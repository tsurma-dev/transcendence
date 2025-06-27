import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app'; // Your Fastify instance

const createUser = (i = 0) => ({
  username: `User${i}`,
  email: `user${i}@example.com`,
  password: 'changeme'
});

describe('User Registration', () => {
  it('registers users', async () => {
    const user = { username: 'test', email: 'test@example.com', password: 'Test1234!' };
    const res = await request(app.server).post('/api/register').send(user);
    expect(res.statusCode).toBe(201);
  });
});
