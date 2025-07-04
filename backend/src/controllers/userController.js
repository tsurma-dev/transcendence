import { findUserByUsername } from "../models/userModel.js";
import { serializeUser } from "../serializers/userSerializer.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export function profileUser(req, reply) {
  const user = req.user;
  if (!user) {
    return reply.code(401).send("Unauthorized");
  }

  return reply.send(serializeUser(user));
}

export function getUser(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    reply.send(serializeUser(user));
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}

export async function listLoggedInUsers(req, reply) {
  const { redis } = req.server;

  const keys = await redis.keys("*");
  const users = [];

  for (const key of keys) {
    const value = await redis.get(key);
    try {
      const user = JSON.parse(value);
      users.push({ id: key, ...user });
    } catch (err) {
      console.warn(`Could not parse user data for key ${key}`);
    }
  }

  return users;
}

export function getUserAvatar(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const avatarFile = `${user.id}.png`;
    const avatarRelativePath = `uploads/avatars/${avatarFile}`;
    const avatarAbsolutePath = path.join(
      __dirname,
      "../../public",
      avatarRelativePath
    );
    const defaultAvatarRelativePath = "uploads/avatars/default.jpg";

    if (fs.existsSync(avatarAbsolutePath)) {
      return reply.sendFile(avatarRelativePath);
    } else {
      return reply.sendFile(defaultAvatarRelativePath);
    }
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}
