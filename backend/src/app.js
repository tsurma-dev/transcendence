import Fastify from "fastify";

import path from "path";
import { fileURLToPath } from "url";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyRedis from "@fastify/redis";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fs from "fs";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import fastifyMultipart from "@fastify/multipart";
// import pongRoutes from './routes/matchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  host: "127.0.0.1",
  port: 6379,
  // password: 'supersecret'
});

// Register CORS to allow frontend requests
await app.register(fastifyCors, {
  origin: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://localhost:5173",
  ], // Allow frontend dev servers, 5173 is for Vite
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});

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
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
});

await app.register(fastifyMultipart);
await app.register(fastifyWebsocket);
await app.register(dbPlugin);
await app.register(authPlugin);
await app.register(userRoutes);
await app.register(profileRoutes);
await app.register(authRoutes);

// await app.register(pongRoutes);
await app.register(fastifyStatic, {
  root: path.resolve("./public"),
  prefix: "/",
}); // will be removed with frontend

export default app;
