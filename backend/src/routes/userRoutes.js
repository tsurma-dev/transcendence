import { getUser, postUser, loginUser, logoutUser, profileUser, authCheckUser, getMe, listLoggedInUsers } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/users/:username', getUser); // API change later to better serialize data
  fastify.get('/auth/check', { preHandler: fastify.verifyAuth }, authCheckUser); // API
  fastify.get('/profile', { preHandler: fastify.verifyAuth }, profileUser); // will be folded into frontend
  fastify.post('/register', postUser); // API
  fastify.get('/register', async (req, reply) => {
  return reply.sendFile('register.html');
  }); // will be folded into frontend
  fastify.post('/login', loginUser); // API
  fastify.post('/logout', { preHandler: fastify.verifyAuth }, logoutUser); // API
  fastify.get('/me', { preHandler: fastify.verifyAuth }, getMe); // API change later to better serialize data
  fastify.get('/', async (req, reply) => {
    return reply.sendFile('index.html');
  }); // will be folded into frontend
  fastify.get('/loggedinusers', listLoggedInUsers); // API wll be secured later
}

export default userRoutes;
