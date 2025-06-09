import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Adjust as needed (higher = more secure but slower)

export async function createUser(db, { username, email, password }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `);
  try {
    const info = stmt.run(username, email, password_hash);
    return this.findUserById(db, info.lastInsertRowid);
  } catch (error) {
    throw error;
  }
}

export function searchUsersByName(db, nameFragment) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE username LIKE ?');
  const user = stmt.get(nameFragment);
  return user;
}

export function findUserById(db, id) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
  const user = stmt.get(id);
  return user;
}

export function findUserByEmail(db, email) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE email = ?');
  const user = stmt.get(email);
  return user;
}

export function findUserByUsername(db, username) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE username = ?');
  const user = stmt.get(username);
  return user;
}
