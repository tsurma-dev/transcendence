import {
  sendFriendRequestCon,
  acceptFriendRequestCon,
  rejectFriendRequestCon,
  deleteFriendCon,
  getFriendsCon,
} from "../controllers/friendController.js";

async function friendRoutes(fastify) {
  fastify.get("/api/me/friends", {
    preHandler: fastify.verifyAuth,
    handler: getFriendsCon,
  });

  fastify.post("/api/me/friends/:username/request", {
    preHandler: fastify.verifyAuth,
    handler: sendFriendRequestCon,
  });

  fastify.post("/api/me/friends/:username/accept", {
    preHandler: fastify.verifyAuth,
    handler: acceptFriendRequestCon,
  });

  fastify.post("/api/me/friends/:username/reject", {
    preHandler: fastify.verifyAuth,
    handler: rejectFriendRequestCon,
  });

  fastify.delete("/api/me/friends/:username", {
    preHandler: fastify.verifyAuth,
    handler: deleteFriendCon,
  });
}

export default friendRoutes;
