import { getUser, postUser, loginUser, logoutUser, profileUser, authCheckUser, getMe, listLoggedInUsers } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/users/:username', getUser);
  fastify.get('/auth/check', { preHandler: fastify.verifyAuth }, authCheckUser);
  fastify.get('/profile', { preHandler: fastify.verifyAuth }, profileUser);
  fastify.post('/register', postUser);
  fastify.get('/register', async (req, reply) => {
  return reply.sendFile('register.html');
  });
  fastify.post('/login', loginUser);
  fastify.post('/logout', { preHandler: fastify.verifyAuth }, logoutUser);
  fastify.get('/me', { preHandler: fastify.verifyAuth }, getMe);
  fastify.get('/', async (req, reply) => {
    return reply.sendFile('index.html');
  });
  fastify.get('/loggedinusers', listLoggedInUsers);
}

export default userRoutes;
