import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(db, { username, email, password }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `);
  try {
    const info = stmt.run(username, email, password_hash);
    console.log(info);
    return findUserById(db, info.lastInsertRowid);
  } catch (error) {
    throw error;
  }
}

export function deleteUser(db, email) {
  const user = findUserByEmail(db, email);
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
  const user = stmt.get(nameFragment);
  return user;
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
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  try {
    const info = stmt.run(password_hash, id);
    return info.changes;
  } catch (error) {
    throw error;
  }
}
