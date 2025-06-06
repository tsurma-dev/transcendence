import db from './db';
import bcrypt from 'bcrypt';
import type {FastifyInstance } from 'fastify';

import type { User } from '../models/user';

export class UserRepository {
  static createUser(username: string, email: string, passwordHash: string): User | null {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `);

    try {
      const info = stmt.run(username, email, passwordHash);
      return this.getUserById(info.lastInsertRowid as number);
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // username or email already exists
        return null;
      }
      throw e;
    }
  }

  static getUserById(id: number): User | null {
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    const row = stmt.get(id);
    return row ? (row as User) : null;
  }

static deleteUserById(id: number): User | null {
  const user = this.getUserById(id);
  if (!user) return null;
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  stmt.run(id);
  return user;
}


  static getUserByUsername(username: string): User | null {
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    const row = stmt.get(username);
    return row ? (row as User) : null;
  }

  static getUserByEmail(email: string): User | null {
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
    const row = stmt.get(email);
    return row ? (row as User) : null;
  }
}

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { username, email, password } = request.body as {
        username: string;
        email: string;
        password: string;
      };

      const passwordHash = await bcrypt.hash(password, 10);
      const user = UserRepository.createUser(username, email, passwordHash);

      if (!user) {
        return reply.status(409).send({ message: 'Username or email already exists' });
      }

      return reply.status(201).send({ message: 'User created succesfully' });
    },
  });
  fastify.delete('/users/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: number };

      const user = UserRepository.deleteUserById(id);
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }

      return reply.send({ message: `User with ID ${id} deleted` });
    },
  });
}
