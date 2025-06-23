import Fastify from 'fastify';

import path from 'path';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyRedis from '@fastify/redis';
import fs from 'fs';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import userRoutes from './routes/userRoutes.js';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, '../.env/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../.env/cert.pem')),
  }
 });

app.register(fastifyRedis, {
  host: '127.0.0.1',
  port: 6379,
  // password: 'supersecret'
});

 app.register(fastifyFormbody);

 app.register(fastifyCookie, {
  secret: 'supersecret',
  });
 app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
  cookie: {
    cookieName: 'logintoken',
    signed: true
  }
  });


await app.register(dbPlugin);
await app.register(authPlugin);
await app.register(userRoutes);

app.register(fastifyStatic, {
  root: path.resolve('./public'),
  prefix: '/',
});


export default app;
