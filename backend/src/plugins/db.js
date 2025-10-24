import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";

export default fp(async function (fastify, opts) {
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
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      two_fa_enabled INTEGER DEFAULT 0,
      two_fa_secret TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES
    (0, '[deleted]', 'deleted@example.com', '');

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT '0',
      friend_id TEXT NOT NULL DEFAULT '0',
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET DEFAULT,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE SET DEFAULT,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      -- start_date and end_date are not required; match timestamps are recorded on matches
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


    -- Matches specific to tournaments. This table stores the bracket structure and results.
    -- round: 1 is first round, increasing numbers indicate later rounds. A special round value
    -- can be used for the 3rd-place decider (e.g. -1)
    -- tournament_matches now links to canonical matches via match_id to avoid duplicating scores/users
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_index INTEGER NOT NULL,
      match_id INTEGER UNIQUE, -- references matches.id once the match has been played
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      UNIQUE (tournament_id, round, match_index)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      player1_id TEXT NOT NULL DEFAULT '0',
      player2_id TEXT NOT NULL DEFAULT '0',
      player1_score INTEGER NOT NULL,
      player2_score INTEGER NOT NULL,
      winner_id TEXT NOT NULL DEFAULT '0',
      played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
      FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE SET DEFAULT,
      FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE SET DEFAULT,
      FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET DEFAULT
    );

    CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
    CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);

    -- Simple participants table to allow listing tournament participants. Keeps minimal data.
    CREATE TABLE IF NOT EXISTS tournament_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id TEXT NOT NULL DEFAULT '0',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET DEFAULT,
      UNIQUE(tournament_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);

    CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_round ON tournament_matches(tournament_id, round);
    CREATE INDEX IF NOT EXISTS idx_tournament_matches_match_id ON tournament_matches(match_id);
  `);

  fastify.decorate("db", db);

  fastify.addHook("onClose", (instance, done) => {
    db.close();
    done();
  });
});
