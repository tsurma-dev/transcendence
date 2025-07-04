import {
  postUser,
  loginUser,
  logoutUser,
  authCheckUser,
} from "../controllers/authController.js";
import { loginUserSchema, registerUserSchema } from "../schemas/userSchemas.js";

async function authRoutes(fastify) {
  fastify.post("/api/register", {
    schema: registerUserSchema,
    handler: postUser,
  });
  fastify.post("/api/login", {
    schema: loginUserSchema,
    handler: loginUser,
  });
  fastify.post("/api/logout", { preHandler: fastify.verifyAuth }, logoutUser); // API
  fastify.get(
    "/api/auth/check",
    { preHandler: fastify.verifyAuth },
    authCheckUser
  ); // API
}

export default authRoutes;
