import Fastify from "fastify";

import path from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyRedis from "@fastify/redis";
import fastifyHttpProxy from "@fastify/http-proxy";
import fastifyWebsocket from "@fastify/websocket";
import fs from "fs";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import fastifyMultipart from "@fastify/multipart";
import pongRoutes from "./routes/matchRoutes.js";

import "./utils/seedUsers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === "development";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  },
  https: {
    key: fs.readFileSync(path.join(__dirname, "../../.env/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "../../.env/cert.pem")),
  },
});

await app.register(fastifyRedis, {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  // password: 'supersecret'
});

await app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

if (isDev) {
  app.register(fastifyHttpProxy, {
    upstream: "http://localhost:5173",
    prefix: "/",
    websocket: true,
  });
} else {
  const distPath = path.join(__dirname, "../../frontend/dist");

  app.register(fastifyStatic, {
    root: distPath,
    prefix: "/", // default
  });

  app.setNotFoundHandler((req, reply) => {
    // Avoid intercepting API and WebSocket routes
    if (req.raw.url.startsWith("/api") || req.raw.url.startsWith("/ws")) {
      return reply.code(404).send({ error: "Not Found" });
    }
    reply
      .type("text/html")
      .send(fs.readFileSync(path.join(distPath, "index.html")));
  });
}

await app.register(fastifyFormbody);

await app.register(fastifyCookie, {
  secret: "supersecret",
});

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "supersecret",
  cookie: {
    cookieName: "logintoken",
    signed: true,
  },
});

await app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "blob:", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
});

await app.register(fastifyWebsocket);
await app.register(dbPlugin);
await app.register(authPlugin);
await app.register(userRoutes);
await app.register(profileRoutes);
await app.register(authRoutes);
await app.register(friendRoutes);
await app.register(pongRoutes);

export default app;
