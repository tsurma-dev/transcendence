export function serializeMatch(match) {
  return {
    tournament_id: match.tournament_id,
    player1: match.player1_username,
    player2: match.player2_username,
    player1Score: match.player1_score,
    player2Score: match.player2_score,
    winner: match.winner_username,
    playedAt: match.played_at ? match.played_at.split(" ")[0] : null,
  };
}
