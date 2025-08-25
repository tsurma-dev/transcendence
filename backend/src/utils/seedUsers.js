import bcrypt from "bcrypt";
import sqlite3 from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "database",
  "database.sqlite"
);
const db = new sqlite3(dbPath);

const users = [
  { username: "Bob", email: "bob@bob.com", password: "changeme" },
  { username: "Ben", email: "ben@ben.com", password: "changeme" },
];

async function seed() {
  for (const user of users) {
    const exists = db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(user.email, user.username);

    if (!exists) {
      const id = randomUUID(); // generate TEXT id
      const hash = await bcrypt.hash(user.password, 10);
      db.prepare(
        "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)"
      ).run(id, user.username, user.email, hash);
      console.log(`Created user ${user.username} with id ${id}`);
    } else {
      console.log(`User ${user.username} already exists`);
    }
  }
}

seed().catch(console.error);
