import {
  postUser,
  loginUser,
  logoutUser,
  authCheckUser,
  generate2FaSecret,
  verify2FaSecret,
} from "../controllers/authController.js";
import { loginUserSchema, registerUserSchema } from "../schemas/userSchemas.js";

async function authRoutes(fastify) {
  fastify.post("/api/register", {
    csrf: false,
    schema: registerUserSchema,
    handler: postUser,
  });

  fastify.post("/api/login", {
    csrf: false,
    schema: loginUserSchema,
    handler: loginUser,
  });

  fastify.post("/api/logout", {
    csrf: false,
    preHandler: fastify.verifyAuth,
    handler: logoutUser,
  });

  fastify.get("/api/auth/check", {
    preHandler: fastify.verifyAuth,
    handler: authCheckUser,
  });

  fastify.post("/api/me/2fa/setup", {
    preHandler: fastify.verifyAuth,
    handler: generate2FaSecret,
  });

  fastify.post("/api/me/2fa/verify", {
    preHandler: fastify.verifyAuth,
    handler: verify2FaSecret,
  });
}

export default authRoutes;
