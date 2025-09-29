process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Ignore tls errors

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import Database from "better-sqlite3";
import app from "../src/app"; // adjust as needed

const db = new Database("../database/database.sqlite");

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, email, password_hash)
  VALUES (?, ?, ?, ?)
`);

const insertMatch = db.prepare(`
  INSERT INTO matches (tournament_id, player1_id, player2_id, player1_score, player2_score, winner_id, played_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

const sampleUsers = [
  {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    password_hash: "hash1",
  },
  {
    id: "u2",
    username: "bob",
    email: "bob@example.com",
    password_hash: "hash2",
  },
];

beforeAll(async () => {
  await app.ready();

  // Insert sample users
  for (const user of sampleUsers) {
    insertUser.run(user.id, user.username, user.email, user.password_hash);
  }

  // Insert a sample match between alice and bob
  insertMatch.run(null, "u1", "u2", 10, 5, "u1");
});

afterAll(async () => {
  // Clean up sample data
  db.prepare(
    `DELETE FROM matches WHERE player1_id IN ('u1','u2') OR player2_id IN ('u1','u2')`
  ).run();
  db.prepare(`DELETE FROM users WHERE id IN ('u1','u2')`).run();

  await app.close();
});

describe("User Matches API", () => {
  it("should get matches for user alice", async () => {
    const res = await request(app.server).get("/users/alice/matches");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Optional: check the first match involves alice as player1 or player2
    const match = res.body[0];
    expect(match.player1 === "alice" || match.player2 === "bob").toBe(true);
  });
});
