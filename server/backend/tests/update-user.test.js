process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Ignore tls errors
import app from "../src/app";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import Database from "better-sqlite3";
const db = new Database("../database/database.sqlite");

describe("User Profile Update API", () => {
  let cookie;
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "testpass123",
  };

  beforeAll(async () => {
    await app.ready();
    await request(app.server).post("/api/register").send(testUser);

    const loginRes = await request(app.server)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    cookie = loginRes.headers["set-cookie"]?.find((c) =>
      c.startsWith("logintoken=")
    );
    expect(cookie).toBeTruthy();
  });

  beforeEach(async () => {
    const loginRes = await request(app.server)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });
    cookie = loginRes.headers["set-cookie"].find((c) =>
      c.startsWith("logintoken=")
    );
  });

  it("should update username successfully", async () => {
    const newUsername = "updateduser";

    const res = await request(app.server)
      .patch("/api/me/username")
      .set("Cookie", cookie)
      .send({ username: newUsername }); // send the intended new username

    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe(newUsername);
  });

  it("should not update username to an already taken one", async () => {
    // Register a second user to take the name
    await request(app.server).post("/api/register").send({
      username: "takenuser",
      email: "taken@example.com",
      password: "anotherpass",
    });

    const res = await request(app.server)
      .patch("/api/me/username")
      .set("Cookie", cookie)
      .send({ username: "takenuser" });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Username already exists");
  });

  it("should update password and invalidate session", async () => {
    const res = await request(app.server)
      .patch("/api/me/password")
      .set("Cookie", cookie)
      .send({ password: "newpassword123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true); // or whatever logout returns

    // Old session should be invalid now
    const protectedRes = await request(app.server)
      .get("/api/me")
      .set("Cookie", cookie);

    expect(protectedRes.statusCode).toBe(401);
  });

  afterAll(() => {
    // Clean up both test users
    db.prepare("DELETE FROM users WHERE email IN (?, ?)").run(
      "test@example.com",
      "taken@example.com"
    );
  });
});
