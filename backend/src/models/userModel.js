import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

export async function createUser(db, { username, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password_hash)
    VALUES (?, ?, ?, ?)
  `);

  const info = stmt.run(id, username, email, passwordHash);
  return findUserById(db, id);
}

export function deleteUser(db, id) {
  const user = findUserById(db, id);
  if (!user) return { success: false, user: null };
  const stmt = db.prepare('DELETE FROM users WHERE email = ?');
  const info = stmt.run(email);
  return {
    success: info.changes > 0,
    user
  };
}

export function searchUsersByName(db, nameFragment) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE username LIKE ?');
  return stmt.all(`%${nameFragment}%`);
}

export function findUserById(db, id) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
  const user = stmt.get(id);
  return user;
}

export function findUserByEmail(db, email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email);
  return user;
}

export function findUserByUsername(db, username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);
  return user;
}

export async function updateUserPassword(db, id, password) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const info = stmt.run(passwordHash, id);
  return info.changes;
}

export function updateUserName(db, id, username) {
  const stmt = db.prepare('UPDATE users SET username = ? WHERE id = ?');
  const info = stmt.run(username, id);
  return {
    success: info.changes > 0,
    user: findUserById(db, id),
  };
}

export function updateUserEmail(db, id, email) {
  const stmt = db.prepare('UPDATE users SET email = ? WHERE id = ?');
  const info = stmt.run(email, id);
  return {
    success: info.changes > 0,
    user: findUserById(db, id),
  };
}

