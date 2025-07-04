import {
  postUser,
  loginUser,
  logoutUser,
  authCheckUser,
} from "../controllers/authController.js";

async function authRoutes(fastify) {
  fastify.post("/api/register", postUser); // API
  fastify.post("/api/login", loginUser); // API
  fastify.post("/api/logout", { preHandler: fastify.verifyAuth }, logoutUser); // API
  fastify.get(
    "/api/auth/check",
    { preHandler: fastify.verifyAuth },
    authCheckUser
  ); // API
}

export default authRoutes;
