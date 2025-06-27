import { getUser, postUser, loginUser, logoutUser, profileUser, authCheckUser, getMe, listLoggedInUsers } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/api/users/:username', getUser); // API change later to better serialize data
  fastify.get('/api/auth/check', { preHandler: fastify.verifyAuth }, authCheckUser); // API
  fastify.get('/api/profile', { preHandler: fastify.verifyAuth }, profileUser); // API will be folded into frontend
  fastify.post('/api/register', postUser); // API
  fastify.get('/register', async (req, reply) => {
  return reply.sendFile('register.html');
  }); // will be folded into frontend
  fastify.post('/api/login', loginUser); // API
  fastify.post('/api/logout', { preHandler: fastify.verifyAuth }, logoutUser); // API
  fastify.get('/api/me', { preHandler: fastify.verifyAuth }, getMe); // API change later to better serialize data
  fastify.get('/', async (req, reply) => {
    return reply.sendFile('index.html');
  }); // will be folded into frontend
  fastify.get('/api/loggedinusers', listLoggedInUsers); // API wll be secured later
}

export default userRoutes;
