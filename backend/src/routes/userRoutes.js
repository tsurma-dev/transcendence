import {
  getUser,
  getUserAvatar,
  listLoggedInUsers,
  profileUser,
} from "../controllers/userController.js";

async function userRoutes(fastify) {
  fastify.get("/api/users/:username", getUser); // API change later to better serialize data
  fastify.get("/users/:username/avatar", getUserAvatar);
  fastify.get("/api/loggedinusers", listLoggedInUsers); // API wll be secured later
  fastify.get("/register", async (req, reply) => {
    return reply.sendFile("register.html");
  }); // will be folded into frontend
  fastify.get("/api/profile", {
    preHandler: fastify.verifyAuth,
    handler: profileUser,
  }); // API will be folded into frontend
  fastify.get("/", async (req, reply) => {
    return reply.sendFile("index.html");
  }); // will be folded into frontend
}

export default userRoutes;
