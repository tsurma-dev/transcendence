import { updateUserName, findUserByEmail, findUserByUsername, createUser, findUserById, updateUserPassword } from '../models/userModel.js';
import { serializeUser, serializeMe } from '../serializers/userSerializer.js';
import { loginCookieOptions } from '../config/cookies.js';
import { reissueJwtAndSetCookie } from '../utils/authUtils.js';
import bcrypt from 'bcrypt'

export async function postUser(req, reply) {
  const { username, email, password } = req.body;
  try {
    const newUser = await createUser(req.server.db, { username, email, password });
    reply.code(201).send(serializeUser(newUser));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      reply.code(409).send({ message: 'Username or email already exists' });
    } else {
      req.log.error(err);
      reply.code(500).send({ message: 'Internal Server Error' });
    }
  }
}


export function getMe(req, reply) {
  try {
    const { id } = req.user;
    const user = findUserById(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }
    reply.send(serializeUser(user));
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function patchMeName(req, reply) {
    const { id } = req.user;
    const { username } = req.body;
    if (!username) {
      return reply.code(400).send({ message: 'Username is required' });
    }
    try {
      const result = updateUserName(db, id, username);

      if (!result.success) {
        if (result.error === 'User not found') {
          return reply.code(404).send({ message: 'User not found' });
        }
        return reply.code(400).send({ message: result.error });
      }
      await reissueJwtAndSetCookie({
        user: result.user,
        req,
        reply,
        cookieOptions: loginCookieOptions,
      });
      return reply.code(200).send({ user: result.user });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.code(409).send({ message: 'Username already exists' });
      }
      request.log.error(error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
};


export async function patchMePassword(req, reply) {
  try {
    const { id } = req.user;
    const { password } = req.body;

    if (!password) {
      return reply.code(400).send({ message: 'Password is required' });
    }

    const user = findUserById(req.server.db, id);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }

    const changes = await updateUserPassword(req.server.db, id, password);
    if (changes === 1) {
      return logoutUser(req, reply);
    }
    return reply.code(304).send({ message: 'No changes made' });
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: 'Internal Server Error' });
  }
}



export function getUser(req, reply) {
  try {
    const { username } = req.params;
    const user = findUserByUsername(req.server.db, username);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }
    reply.send(serializeUser(user));
  } catch (error) {
    req.log.error(error);
    reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function loginUser(req, reply) {
  const { email, password } = req.body;
  const user = findUserByEmail(req.server.db, email);
  if (!user) {
    return reply.code(401).send({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return reply.code(401).send({ message: 'Invalid credentials' });
  }

  await reissueJwtAndSetCookie({
    user,
    req,
    reply,
    cookieOptions: loginCookieOptions,
  });

  reply.send({ success: true });
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

  reply.clearCookie('logintoken', loginCookieOptions).send({ success: true });
}

export function profileUser(req, reply) {
  const user = req.user;
  if (!user) {
    return reply.code(401).send('Unauthorized');
  }

  return reply.send(user);
};

export function authCheckUser(req, reply ) {
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
