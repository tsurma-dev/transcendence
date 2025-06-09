import { findUserByUsername, createUser } from '../models/userModel.js';
import { serializeUser } from '../serializers/userSerializer.js';

export async function postUser(req, reply) {
  const { username, email, password } = req.body;
  try {
    const newUser = await createUser(req.server.sqlite, { username, email, password });
    reply.code(201).send(serializeUser(newUser));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      reply.code(409).send({ error: 'Username or email already exists' });
    } else {
      req.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
}

export async function getUser(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    reply.send(serializeUser(user));
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
}

