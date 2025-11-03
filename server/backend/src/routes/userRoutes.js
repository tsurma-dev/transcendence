import {
  getUser,
  getUserAvatar,
  getUserMatches,
  listLoggedInUsers,
  profileUser,
} from "../controllers/userController.js";

async function userRoutes(fastify) {
  fastify.get("/api/users/:username", getUser);
  fastify.get("/users/:username/avatar", getUserAvatar);
  fastify.get("/users/:username/matches", getUserMatches);
  fastify.get("/api/loggedinusers", listLoggedInUsers);

  fastify.get("/api/profile", {
    preHandler: fastify.verifyAuth,
    handler: profileUser,
  }); // API will be folded into frontend
}

export default userRoutes;
