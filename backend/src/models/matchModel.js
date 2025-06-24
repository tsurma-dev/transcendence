// services/matchService.js
export function createMatch(db, tournamentId = null) {
  const stmt = db.prepare(`
    INSERT INTO matches (tournament_id, status)
    VALUES (?, 'pending')
  `);
  const info = stmt.run(tournamentId);
  return info.lastInsertRowid; // match ID
}

export function addPlayerToMatch(db, matchId, playerId) {
  const stmt = db.prepare(`
    INSERT INTO match_players (match_id, player_id)
    VALUES (?, ?)
  `);
  stmt.run(matchId, playerId);
}

export function updateMatchStatus(db, matchId, status, winnerId = null) {
  const stmt = db.prepare(`
    UPDATE matches
    SET status = ?, winner_id = ?
    WHERE id = ?
  `);
  stmt.run(status, winnerId, matchId);
}

export function getMatchesForPlayer(db, playerId) {
  const stmt = db.prepare(`
    SELECT m.*
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    WHERE mp.player_id = ?
    ORDER BY m.id DESC
  `);
  return stmt.all(playerId);
}

export function getPlayersInMatch(db, matchId) {
  const stmt = db.prepare(`
    SELECT p.*
    FROM users p
    JOIN match_players mp ON p.id = mp.player_id
    WHERE mp.match_id = ?
  `);
  return stmt.all(matchId);
}
