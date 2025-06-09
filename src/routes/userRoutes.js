import { getUser, postUser } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/users/:username', getUser);
  fastify.post('/register', postUser);
}

export default userRoutes;
