import { getUser, postUser, loginUser, logoutUser, profileUser } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/users/:username', getUser);
  fastify.get('/profile', profileUser);
  fastify.post('/register', postUser);
  fastify.post('/login', loginUser);
  fastify.post('/logout', logoutUser);
}

export default userRoutes;
