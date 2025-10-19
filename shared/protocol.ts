import { GameState } from "./types";

export type ServerToClient =
  | { type: "room-joined"; payload: { roomId: string } }
  | { type: "room-ready"; payload: { player1: { name: string; id: "first" }; player2: { name: string; id: "second" } } }
  | { type: "start-countdown" }
  | { type: "game-start" }
  | { type: "game-state"; payload: GameState }
  | { type: "game-over"; payload: { player1Score: number; player2Score: number; winner: string } }
  | { type: "game-failed"; payload: { message: string } }
  | { type: "fail"; payload: { message: string } }
  | { type: "registered"; payload: { tournamentId: string; players: string[]; state: string } }
  | { type: "tournament-player-joined"; payload: { playerNumber: number; playerName: string; state: string } }
  | { type: "join-tournament-room"; payload: { roomId: string } }
  | { type: "tournament-first-round-finished"; payload: { matchA: any; matchB: any } }
  | { type: "tournament-finished"; payload: { finalMatch: any; thirdPlaceMatch: any; champions: any } }

export type Snapshot = {
  //version: number;           // = GAME_CONFIG.VERSION
  //tick: number;              // server tick number
  //serverTime: number;        // ms (Date.now on server)
  state: GameState;
};

export type ClientToServer =
  | { type: "create"; payload: { playerName: string } }
  | { type: "create-ai"; payload: { playerName: string } }
  | { type: "join"; payload: { playerName: string; roomId: string } }
  | { type: "ready-to-play"; payload: { roomId: string; playerId: "first" | "second" } }
  | { type: "input"; payload: { roomId: string; playerId: "first" | "second"; direction: number } }
  | { type: "tournament-join"; payload: { playerName: string } }


