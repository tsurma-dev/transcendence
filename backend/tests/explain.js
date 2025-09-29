import Database from "better-sqlite3";

const db = new Database("../database/database.sqlite"); // path to your SQLite file

const playerId = "user123";

const explain = db
  .prepare(
    `
  EXPLAIN QUERY PLAN
  SELECT * FROM matches
  WHERE player1_id = ? OR player2_id = ?
`
  )
  .all(playerId, playerId);

console.log("Query Plan:", explain);
