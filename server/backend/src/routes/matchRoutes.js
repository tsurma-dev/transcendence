import { handlePongWebSocket } from "../controllers/matchController.js";

export default async function pongRoutes(fastify) {
  fastify.get("/ws/pong", { websocket: true }, (socket, req) => {
    handlePongWebSocket(socket, req);
  });
}
