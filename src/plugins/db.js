import fp from 'fastify-plugin';
import Database from 'better-sqlite3';

export default fp(async function (fastify, opts) {
  const db = new Database('./database/database.sqlite');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      winner_id INTEGER,
      score_player1 INTEGER,
      score_player2 INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS match_participants (
      match_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('player1', 'player2')),
      PRIMARY KEY (match_id, user_id),
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS match_tournaments (
      match_id INTEGER PRIMARY KEY,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );
  `);

  fastify.decorate('db', db);

  fastify.addHook('onClose', (instance, done) => {
    db.close();
    done();
  });
});
