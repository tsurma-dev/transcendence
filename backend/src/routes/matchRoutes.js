import { handlePongWebSocket } from '../controllers/matchController';

export default async function pongRoutes(fastify) {
  fastify.get('/ws/pong', { websocket: true }, (connection, req) => {
    handlePongWebSocket(connection);
  });
}
