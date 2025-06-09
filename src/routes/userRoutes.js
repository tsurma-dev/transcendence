import { getUser, postUser, loginUser } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/users/:username', getUser);
  fastify.post('/register', postUser);
  fastify.post('/login', loginUser);
}

export default userRoutes;
