import * as userController from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/api/users/:username', userController.getUser); // API change later to better serialize data
  fastify.get('/api/auth/check', { preHandler: fastify.verifyAuth }, userController.authCheckUser); // API
  fastify.get('/api/profile', { preHandler: fastify.verifyAuth }, userController.profileUser); // API will be folded into frontend
  fastify.post('/api/register', userController.postUser); // API
  fastify.post('/api/login', userController.loginUser); // API
  fastify.post('/api/logout', { preHandler: fastify.verifyAuth }, userController.logoutUser); // API
  fastify.get('/api/me', { preHandler: fastify.verifyAuth }, userController.getMe); // API change later to better serialize data
  fastify.patch('/api/me/password', { preHandler: fastify.verifyAuth }, userController.patchMePassword); // API
  fastify.patch('/api/me/username', { preHandler: fastify.verifyAuth }, userController.patchMeName);
  fastify.get('/api/loggedinusers', userController.listLoggedInUsers); // API wll be secured later
  fastify.get('/register', async (req, reply) => {
  return reply.sendFile('register.html');
  }); // will be folded into frontend
  fastify.get('/', async (req, reply) => {
    return reply.sendFile('index.html');
  }); // will be folded into frontend
}


export default userRoutes;
