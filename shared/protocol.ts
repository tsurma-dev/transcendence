import { GameState } from "./types";

export type ServerToClient =
  | { type: "room-joined"; payload: { roomId: string } }
  | { type: "room-ready"; payload: { player1: { name: string; id: "first" }; player2: { name: string; id: "second" } } }
  | { type: "start-countdown" }
  | { type: "game-start" }
  | { type: "game-state"; payload: GameState }
  | { type: "game-over"; payload: { player1Score: number; player2Score: number; winner: "first" | "second" } }

export type Snapshot = {
  //version: number;           // = GAME_CONFIG.VERSION
  //tick: number;              // server tick number
  //serverTime: number;        // ms (Date.now on server)
  state: GameState;
};

export type ClientToServer =
  | { type: "create"; payload: { playerName: string } }
  | { type: "join"; payload: { playerName: string; roomId: string } }
  | { type: "ready-to-play"; payload: { roomId: string; playerId: "first" | "second" } }
  | { type: "input"; payload: { roomId: string; playerId: "first" | "second"; direction: number } }


