import {
  findUserById,
  updateUserName,
  updateUserPassword,
  updateUserEmail,
} from "../models/userModel.js";
import { logoutUser } from "./authController.js";
import { serializeUser } from "../serializers/userSerializer.js";
import { loginCookieOptions } from "../config/cookies.js";
import { reissueJwtAndSetCookie } from "../utils/authUtils.js";

export function getMe(req, reply) {
  try {
    const { id } = req.user;
    const user = findUserById(req.server.db, id);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    reply.send(serializeUser(user));
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}

export async function patchMeName(req, reply) {
  const { id } = req.user;
  const { username } = req.body;

  if (!username) {
    return reply.code(400).send({ message: "Username is required" });
  }
  const user = findUserById(req.server.db, id);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }
  try {
    const result = updateUserName(req.server.db, id, username);
    if (!result.success) {
      return reply.code(304).send({ message: "No changes made" });
    }
    const updatedUser = findUserById(req.server.db, id);
    if (!updatedUser) {
      req.log.error(error);
      return reply.code(500).send({ message: "Internal server error" });
    }
    await reissueJwtAndSetCookie({
      user: updatedUser,
      req,
      reply,
      cookieOptions: loginCookieOptions,
    });
    return reply.code(200).send({ user: serializeUser(updatedUser) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return reply.code(409).send({ message: "Username already exists" });
    }
    req.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export async function patchMeEmail(req, reply) {
  const { id } = req.user;
  const { email } = req.body;

  if (!email) {
    return reply.code(400).send({ message: "Email is required" });
  }
  const user = findUserById(req.server.db, id);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }
  try {
    const result = updateUserEmail(req.server.db, id, email);
    if (!result.success) {
      return reply.code(304).send({ message: "No changes made" });
    }
    const updatedUser = findUserById(req.server.db, id);
    if (!updatedUser) {
      req.log.error(error);
      return reply.code(500).send({ message: "Internal server error" });
    }
    await reissueJwtAndSetCookie({
      user: updatedUser,
      req,
      reply,
      cookieOptions: loginCookieOptions,
    });
    return reply.code(200).send({ user: serializeUser(updatedUser) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return reply.code(409).send({ message: "Email already registered" });
    }
    req.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export async function patchMePassword(req, reply) {
  try {
    const { id } = req.user;
    const { password } = req.body;

    if (!password) {
      return reply.code(400).send({ message: "Password is required" });
    }

    const user = findUserById(req.server.db, id);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    const changes = await updateUserPassword(req.server.db, id, password);
    if (changes === 1) {
      return logoutUser(req, reply);
    }
    return reply.code(304).send({ message: "No changes made" });
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}
