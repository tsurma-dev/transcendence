import {
  getMe,
  patchMeEmail,
  patchMeName,
  patchMePassword,
} from "../controllers/profileController.js";

async function profileRoutes(fastify) {
  fastify.get("/api/me", { preHandler: fastify.verifyAuth }, getMe);
  fastify.patch(
    "/api/me/password",
    { preHandler: fastify.verifyAuth },
    patchMePassword
  );
  fastify.patch(
    "/api/me/username",
    { preHandler: fastify.verifyAuth },
    patchMeName
  );
  fastify.patch(
    "/api/me/email",
    { preHandler: fastify.verifyAuth },
    patchMeEmail
  );
}

export default profileRoutes;
