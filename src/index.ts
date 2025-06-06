import Fastify from 'fastify';
import db from './Databse/db';
import type { User } from './models/user';
import { UserRepository } from './Databse/UserRepository';
import path from 'path';
import fastifyStatic from '@fastify/static';
import { userRoutes } from './Databse/UserRepository';




const fastify = Fastify({ logger: true });
fastify.register(require('@fastify/formbody'));

fastify.register(fastifyStatic, {
  root: path.join(__dirname, './public'),
  prefix: '/', // optional: serve under '/'
});

fastify.register(userRoutes);

fastify.get('/users', async (request, reply) => {
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all() as User[];
  return users;
});


const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server is running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
