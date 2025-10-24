process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore tls errors

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import app from '../src/app';

import { createMatch, getMatchesForPlayer } from '../src/models/matchModel.js';
import {
  createTournament,
  addParticipant,
  createTournamentMatch,
  getMatchesForTournament,
  recordMatchAndLink,
} from '../src/models/tournamentModel.js';

const db = new Database('../database/database.sqlite');

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, email, password_hash)
  VALUES (?, ?, ?, ?)
`);

beforeAll(async () => {
  await app.ready();

  // create some dummy users
  insertUser.run('tu1', 't_alice', 't_alice@example.com', 'hash1');
  insertUser.run('tu2', 't_bob', 't_bob@example.com', 'hash2');
  insertUser.run('tu3', 't_carol', 't_carol@example.com', 'hash3');
});

afterAll(async () => {
  // cleanup: remove matches and users and tournament artefacts created by tests
  db.prepare(`DELETE FROM matches WHERE player1_id IN ('tu1','tu2','tu3') OR player2_id IN ('tu1','tu2','tu3')`).run();
  db.prepare(`DELETE FROM tournament_matches WHERE match_id IS NOT NULL`).run();
  db.prepare(`DELETE FROM tournament_participants WHERE user_id IN ('tu1','tu2','tu3')`).run();
  db.prepare(`DELETE FROM tournaments WHERE name = ?`).run('Test Cup');
  db.prepare(`DELETE FROM users WHERE id IN ('tu1','tu2','tu3')`).run();

  await app.close();
});

describe('Tournament & Match models', () => {
  it('should create a tournament, record a match and link it to the bracket', () => {
    // create tournament
    const tid = createTournament(db, 'Test Cup', 'A simple test tournament');
    expect(tid).toBeTruthy();

    // add participants
    addParticipant(db, tid, 'tu1');
    addParticipant(db, tid, 'tu2');

    // create a bracket cell for final (round 1, index 0)
    const cellId = createTournamentMatch(db, tid, 1, 0);
    expect(cellId).toBeTruthy();

    // record the match and link it atomically
    const matchId = recordMatchAndLink(db, tid, 1, 0, 'tu1', 'tu2', 11, 7, 'tu1');
    expect(matchId).toBeTruthy();

    // verify tournament matches now include the linked match and scores
    const tMatches = getMatchesForTournament(db, tid);
    expect(Array.isArray(tMatches)).toBe(true);
    expect(tMatches.length).toBeGreaterThan(0);

    const tm = tMatches.find((m) => m.match_index === 0 && m.round === 1);
    expect(tm).toBeTruthy();
    expect(tm.player1_id === 'tu1' || tm.player2_id === 'tu2').toBe(true);
    expect(tm.player1_score === 11 || tm.player2_score === 7).toBe(true);

    // verify getMatchesForPlayer returns results for tu1
    const pMatches = getMatchesForPlayer(db, 'tu1');
    expect(Array.isArray(pMatches)).toBe(true);
    expect(pMatches.length).toBeGreaterThan(0);

    const found = pMatches.some((m) => m.id === matchId);
    expect(found).toBe(true);
  });

  it('createMatch should insert standalone match rows', () => {
    const mid = createMatch(db, null, 'tu2', 'tu3', 5, 3, 'tu2');
    expect(mid).toBeTruthy();

    const pMatches = getMatchesForPlayer(db, 'tu2');
    const found = pMatches.some((m) => m.id === mid);
    expect(found).toBe(true);
  });
});
