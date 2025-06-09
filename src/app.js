import Fastify from 'fastify';

import path from 'path';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import fastifyJwt from '@fastify/jwt';

import dbPlugin from './plugins/db.js';
import userRoutes from './routes/userRoutes.js';

const app = Fastify({ logger: true });

app.register(fastifyFormbody);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

app.register(dbPlugin);

app.register(fastifyStatic, {
  root: path.resolve('./public'),
  prefix: '/',
});

app.register(userRoutes);

export default app;
