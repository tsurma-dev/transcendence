process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore tls errors

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import Database from 'better-sqlite3';

const db = new Database('../database/database.sqlite');

const createUser = (i = 0) => ({
  username: `User${i}`,
  email: `user${i}@example.com`,
  password: 'changeme'
});

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  const stmt = db.prepare(`DELETE FROM users WHERE email LIKE 'user%@example.com'`);
  stmt.run();

  await app.close();
});

describe('User Registration API', () => {
  it('should register 50 unique users successfully', async () => {
    const users = Array.from({ length: 50 }, (_, i) => createUser(i));

    for (const user of users) {
      const res = await request(app.server)
        .post('/api/register')
        .send(user);

      expect(res.statusCode).toBe(201);
    }
  });

  it('should reject duplicate user registration (email and username)', async () => {
    const user = createUser(999);

    const first = await request(app.server)
      .post('/api/register')
      .send(user);
    expect(first.statusCode).toBe(201);

    const duplicate = await request(app.server)
      .post('/api/register')
      .send(user);
    expect(duplicate.statusCode).toBe(409); // Adjust based on your error code
  });
});

