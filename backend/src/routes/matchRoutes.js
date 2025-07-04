import { handlePongWebSocket } from "../controllers/matchController.js";

export default async function pongRoutes(fastify) {
  fastify.get("/ws/pong", { websocket: true }, (connection, req) => {
    handlePongWebSocket(connection);
  });
}
