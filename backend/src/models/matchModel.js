// services/matchService.js

export function createMatch(
  db,
  tournament_id,
  player1_id,
  player2_id,
  player1_score,
  player2_score,
  winner_id
) {
  const stmt = db.prepare(`
    INSERT INTO matches (tournament_id, player1_id, player2_id, player1_score, player2_score, winner_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    tournament_id,
    player1_id,
    player2_id,
    player1_score,
    player2_score,
    winner_id
  );
  return info.lastInsertRowid;
}

export function getMatchesForPlayer(db, playerId) {
  const stmt = db.prepare(`
    SELECT
      m.id,
      m.tournament_id,
      u1.username AS player1_username,
      u2.username AS player2_username,
      m.player1_score,
      m.player2_score,
      u3.username AS winner_username,
      m.played_at
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    JOIN users u2 ON m.player2_id = u2.id
    JOIN users u3 ON m.winner_id = u3.id
    WHERE u1.id = ? OR u2.id = ?
    ORDER BY m.played_at DESC
  `);
  return stmt.all(playerId, playerId);
}
