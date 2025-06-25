import fp from 'fastify-plugin';
import Database from 'better-sqlite3';

export default fp(async function (fastify, opts) {
  const db = new Database('./database/database.sqlite');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES
    (0, '[deleted]', 'deleted@example.com', '');

    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      winner_id INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TIMESTAMP,
      finished_at TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
      FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET DEFAULT
    );

    CREATE TABLE IF NOT EXISTS matches_players (
      match_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (match_id, player_id),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET DEFAULT
    );
  `);

  fastify.decorate('db', db);

  fastify.addHook('onClose', (instance, done) => {
    db.close();
    done();
  });
});
