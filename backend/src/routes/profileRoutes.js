import {
  getMe,
  patchMeEmail,
  patchMeName,
  patchMePassword,
  deleteMe,
  putUserAvatar,
  deleteUserAvatar,
} from "../controllers/profileController.js";
import {
  changeEmailSchema,
  changePasswordSchema,
  changeUsernameSchema,
  deleteUserSchema,
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

  fastify.post("/api/me/delete", {
    preHandler: fastify.verifyAuth,
    schema: deleteUserSchema,
    handler: deleteMe,
  });

  fastify.put("/api/me/avatar", {
    preHandler: fastify.verifyAuth,
    handler: putUserAvatar,
  });

  fastify.delete("/api/me/avatar", {
    preHandler: fastify.verifyAuth,
    handler: deleteUserAvatar,
  });
}

export default profileRoutes;
