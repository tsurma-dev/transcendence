import { findUserByEmail, findUserByUsername, createUser } from '../models/userModel.js';
import { serializeUser, serializeMe } from '../serializers/userSerializer.js';
import { loginCookieOptions } from '../config/cookies.js';
import bcrypt from 'bcrypt'
import crypto from 'crypto';

export async function postUser(req, reply) {
  const { username, email, password } = req.body;
  try {
    const newUser = await createUser(req.server.db, { username, email, password });
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


export async function getMe(req, reply) {
  try {
    const { username } = req.user;
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

export async function loginUser(req, reply) {
  const { email, password } = req.body;
  const user = findUserByEmail(req.server.db, email);
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const sessionId = crypto.randomUUID();
  const token = req.server.jwt.sign({
    id: user.id,
    username: user.username,
    sessionId,
  });

  await req.server.redis.set(
    user.id,
    JSON.stringify({
      username: user.username,
      loginTime: Date.now(),
      sessionId,
    })
  );

  reply
    .setCookie('logintoken', token, loginCookieOptions)
    .send({ success: true });
}


export async function logoutUser(req, reply) {
  const { redis } = req.server;
  const user = req.user;

  if (user?.id) {
    try {
      await redis.del(user.id);
    } catch (err) {
      req.log.warn(`Failed to delete Redis session for user ${user.id}:`, err);
    }
  }

  // Make sure to call `send()` only once
  reply.clearCookie('logintoken', loginCookieOptions).send({ success: true });
}

export async function profileUser(req, reply) {
  const user = req.user;
  if (!user) {
    return reply.code(401).send('Unauthorized');
  }

  return reply.send(user);
};

export async function authCheckUser(req, reply ) {
  return {
    loggedIn: true,
    user: req.user,
  };
};

export async function listLoggedInUsers(req, reply) {
  const { redis } = req.server;

  const keys = await redis.keys('*');
  const users = [];

  for (const key of keys) {
    const value = await redis.get(key);
    try {
      const user = JSON.parse(value);
      users.push({ id: key, ...user });
    } catch (err) {
      console.warn(`Could not parse user data for key ${key}`);
    }
  }

  return users;
}
