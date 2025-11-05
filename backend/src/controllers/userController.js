import { findUserByUsername } from "../models/userModel.js";
import { getMatchesForPlayer } from "../models/matchModel.js";
import { serializeUser } from "../serializers/userSerializer.js";
import { serializeMatch } from "../serializers/matchSerializer.js";
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

/**
 * Serve user avatar image. If user has no custom avatar, serve default image.
 * 
 * Security: The /public/uploads/avatars directory is NOT exposed as a static file directory.
 * All avatar access is controlled through the /users/:username/avatar endpoint, which:
 * - Validates user existence before serving files
 * - Prevents directory traversal attacks by using controlled file paths
 */
export function getUserAvatar(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const avatarDir = path.join(__dirname, "../../public/uploads/avatars");
    const possibleExtensions = [".png", ".jpg"];
    let avatarPath = null;
    
    console.log(`Looking for avatar for user ${username} (ID: ${user.id})`);
    console.log(`Avatar directory: ${avatarDir}`);
    
    for (const ext of possibleExtensions) {
      const filePath = path.join(avatarDir, `${user.id}${ext}`);
      console.log(`Checking: ${filePath}`);
      if (fs.existsSync(filePath)) {
        avatarPath = filePath;
        console.log(`Found avatar: ${avatarPath}`);
        break;
      }
    }

    // If no custom avatar found, use default
    if (!avatarPath) {
      avatarPath = path.join(avatarDir, "default.jpg");
      console.log(`Using default avatar: ${avatarPath}`);
    }

    // Read and send the file directly
    const origin = req.headers.origin || req.headers.referer || 'https://127.0.0.1:8443';
    reply.header("Access-Control-Allow-Origin", origin);
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    reply.header("Content-Type", avatarPath.endsWith('.png') ? "image/png" : "image/jpeg");
    
    const fileStream = fs.createReadStream(avatarPath);
    return reply.send(fileStream);
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}

export function getUserMatches(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }
    const matches = getMatchesForPlayer(req.server.db, user.id);
    const serializedMatches = matches.map(serializeMatch);

    return reply.send(serializedMatches);
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
}
