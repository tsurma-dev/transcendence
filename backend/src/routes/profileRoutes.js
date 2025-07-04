import {
  getMe,
  patchMeEmail,
  patchMeName,
  patchMePassword,
} from "../controllers/profileController.js";
import {
  changeEmailSchema,
  changePasswordSchema,
  changeUsernameSchema,
} from "../schemas/userSchemas.js";

async function profileRoutes(fastify) {
  fastify.get("/api/me", { preHandler: fastify.verifyAuth }, getMe);

  fastify.patch("/api/me/password", {
    preHandler: fastify.verifyAuth,
    schema: changePasswordSchema,
    handler: patchMePassword,
  });

  fastify.patch("/api/me/username", {
    preHandler: fastify.verifyAuth,
    schema: changeUsernameSchema,
    handler: patchMeName,
  });

  fastify.patch("/api/me/email", {
    preHandler: fastify.verifyAuth,
    schema: changeEmailSchema,
    handler: patchMeEmail,
  });
}

export default profileRoutes;
