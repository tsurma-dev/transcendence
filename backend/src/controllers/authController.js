import { findUserByEmail, createUser } from "../models/userModel.js";
import { serializeUser } from "../serializers/userSerializer.js";
import { loginCookieOptions } from "../config/cookies.js";
import { reissueJwtAndSetCookie } from "../utils/authUtils.js";
import bcrypt from "bcrypt";

export async function postUser(req, reply) {
  const { username, email, password } = req.body;
  try {
    const newUser = await createUser(req.server.db, {
      username,
      email,
      password,
    });
    reply.code(201).send(serializeUser(newUser));
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      reply.code(409).send({ message: "Username or email already exists" });
    } else {
      req.log.error(err);
      reply.code(500).send({ message: "Internal Server Error" });
    }
  }
}

export async function loginUser(req, reply) {
  const { email, password } = req.body;
  const user = findUserByEmail(req.server.db, email);
  if (!user) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  await reissueJwtAndSetCookie({
    user,
    req,
    reply,
    cookieOptions: loginCookieOptions,
  });

  reply.send({ success: true });
}

export async function logoutUser(req, reply) {
  const { redis } = req.server;
  const user = req.user;

  if (user?.id) {
    try {
      await redis.del(user.id);
    } catch (err) {
      req.log.warn(`Failed to delete Redis session for user ${user.id}:`, err);
    }
  }

  reply.clearCookie("logintoken", loginCookieOptions).send({ success: true });
}

export function authCheckUser(req, reply) {
  return {
    loggedIn: true,
    user: req.user,
  };
}
