import { findUserByEmail, findUserByUsername, createUser } from '../models/userModel.js';
import { serializeUser } from '../serializers/userSerializer.js';
import bcrypt from 'bcrypt'

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

  const token = req.server.jwt.sign({
    id: user.id,
    username: user.username
  });

  reply.setCookie('logintoken', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    signed: true,
    maxAge: 60 * 60 * 24 // 1 day
  }
)};

export async function logoutUser(req, reply) {
  reply
    .clearCookie('logintoken', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      signed: true,
    })
    .send({ success: true });
};

export async function profileUser(req, reply) {
  try {
    const token = req.cookies.logintoken;
    const { value, valid } = req.unsignCookie(token);

    if (!valid) {
      return reply.code(401).send({ error: 'Invalid cookie signature' });
    }

    const payload = await req.server.jwt.verify(value);

    console.log("Decoded JWT payload:", payload);

    return reply.send({
      id: payload.id,
      username: payload.username
    });

  } catch (err) {
    console.error(err);
    return reply.code(401).send({ error: 'Unauthorized' });
  }
};
