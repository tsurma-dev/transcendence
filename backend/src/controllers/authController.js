import {
  findUserByEmail,
  createUser,
  set2FA,
  findUserById,
  enable2FA,
  disable2FA,
} from "../models/userModel.js";
import { serializeUser } from "../serializers/userSerializer.js";
import { loginCookieOptions } from "../config/cookies.js";
import { reissueJwtAndSetCookie } from "../utils/authUtils.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

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

function compare2FA(secret, token) {
  if (!token) {
    return "Token Missing";
  }

  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1,
  });

  if (!verified) {
    return "Invalid token";
  }

  return "Success";
}

export async function loginUser(req, reply) {
  const { email, password, TwoFAToken } = req.body;

  const user = findUserByEmail(req.server.db, email);
  if (!user) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  if (user.two_fa_enabled == 1 && user.two_fa_secret) {
    const twoFAResult = compare2FA(user.two_fa_secret, TwoFAToken);
    if (twoFAResult !== "Success") {
      return reply.code(401).send({ message: twoFAResult });
    }
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

export async function generate2FaSecret(req, reply) {
  try {
    const user = findUserById(req.server.db, req.user.id);
    const secret = speakeasy.generateSecret({
      name: `Transcendence:${user.email}`,
    });
    const info = set2FA(req.server.db, user.id, secret);
    const qr = await QRCode.toDataURL(secret.otpauth_url);
    reply.send({ qrCodeUrl: qr, secret: secret.base32 });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ message: "Failed to generate 2FA setup" });
  }
}

export async function verify2FaSecret(req, reply) {
  try {
    const { TwoFAToken } = req.body;
    const { id } = req.user;
    const user = findUserById(req.server.db, id);

    const twoFAResult = compare2FA(user.two_fa_secret, TwoFAToken);
    if (twoFAResult !== "Success") {
      return reply.code(400).send({ message: "Invalid token" });
    }
    enable2FA(req.server.db, id);
    return { success: true };
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ message: "Failed to validate 2FA setup" });
  }
}

export async function remove2Fa(req, reply) {
  try {
    const user = findUserById(req.server.db, req.user.id);
    disable2FA(req.server.db, user.id);
    return { success: true };
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({ message: "Failed to disable 2FA" });
  }
}
