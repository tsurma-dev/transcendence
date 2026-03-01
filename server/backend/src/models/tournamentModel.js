
export function createTournament(db, name, description = null) {
  const stmt = db.prepare(`
    INSERT INTO tournaments (name, description)
    VALUES (?, ?)
  `);
  const info = stmt.run(name, description);
  return info.lastInsertRowid;
}

export function addParticipant(db, tournamentId, userId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO tournament_participants (tournament_id, user_id)
    VALUES (?, ?)
  `);
  const info = stmt.run(tournamentId, userId);
  return info.lastInsertRowid;
}

export function createTournamentMatch(db, tournamentId, round, matchIndex, player1Id = '0', player2Id = '0') {
  const stmt = db.prepare(`
    INSERT INTO tournament_matches (tournament_id, round, match_index)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(tournamentId, round, matchIndex);
  return info.lastInsertRowid;
}

export function getMatchesForTournament(db, tournamentId) {
  const stmt = db.prepare(`
    SELECT tm.*, m.player1_id, m.player2_id, m.player1_score, m.player2_score, m.winner_id, m.played_at,
      u1.username AS player1_username, u2.username AS player2_username, uw.username AS winner_username
    FROM tournament_matches tm
    LEFT JOIN matches m ON tm.match_id = m.id
    LEFT JOIN users u1 ON m.player1_id = u1.id
    LEFT JOIN users u2 ON m.player2_id = u2.id
    LEFT JOIN users uw ON m.winner_id = uw.id
    WHERE tm.tournament_id = ?
    ORDER BY tm.round, tm.match_index
  `);
  return stmt.all(tournamentId);
}

export function linkMatchToBracket(db, tournamentId, round, matchIndex, matchId) {
  const stmt = db.prepare(`
    INSERT INTO tournament_matches (tournament_id, round, match_index, match_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tournament_id, round, match_index) DO UPDATE SET match_id = excluded.match_id
  `);
  const info = stmt.run(tournamentId, round, matchIndex, matchId);
  return info.changes;
}

export function recordMatchAndLink(
  db,
  tournamentId,
  round,
  matchIndex,
  player1Id,
  player2Id,
  player1Score,
  player2Score,
  winnerId
) {
  const insertMatchStmt = db.prepare(`
    INSERT INTO matches (tournament_id, player1_id, player2_id, player1_score, player2_score, winner_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const linkStmt = db.prepare(`
    INSERT INTO tournament_matches (tournament_id, round, match_index, match_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tournament_id, round, match_index) DO UPDATE SET match_id = excluded.match_id
  `);

  const tx = db.transaction((tId, r, mIdx, p1, p2, s1, s2, win) => {
    const info = insertMatchStmt.run(tId, p1, p2, s1, s2, win);
    const matchId = info.lastInsertRowid;
    linkStmt.run(tId, r, mIdx, matchId);
    return matchId;
  });

  return tx(tournamentId, round, matchIndex, player1Id, player2Id, player1Score, player2Score, winnerId);
}
