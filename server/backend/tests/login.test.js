process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore tls errors

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import Database from 'better-sqlite3';

const db = new Database('../database/database.sqlite');

const testUser = {
  username: 'TestLoginUser',
  email: 'testlogin@example.com',
  password: 'changeme'
};

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  const stmt = db.prepare(`DELETE FROM users WHERE email = ?`);
  stmt.run(testUser.email);
  await app.close();
});

describe('Login API', () => {
  it('should login successfully with correct credentials', async () => {
    // Register user
    const regRes = await request(app.server)
      .post('/api/register')
      .send(testUser);
    expect(regRes.statusCode).toBe(201);

    // login
    const loginRes = await request(app.server)
      .post('/api/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.statusCode).toBe(200);
    const cookie = loginRes.headers['set-cookie'];
    expect(cookie).toBeDefined();
    expect(cookie[0]).toMatch(/logintoken=/);
    // logout
    const logoutRes = await request(app.server)
      .post('/api/logout')
      .set('Cookie', cookie);
    expect(logoutRes.statusCode).toBe(200);
  });

  it('should fail to login with wrong password', async () => {
    await request(app.server).post('/api/register').send(testUser);

    const badLogin = await request(app.server)
      .post('/api/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(badLogin.statusCode).toBe(401);
    expect(badLogin.body.message).toMatch(/Invalid/i);
  });

  it('should fail to login with non-existent user', async () => {
    const res = await request(app.server)
      .post('/api/login')
      .send({ email: 'nonexistent@example.com', password: 'doesntmatter' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid/i);
  });
});
