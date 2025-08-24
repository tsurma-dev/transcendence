import { GameState } from "./types";

export type ServerToClient =
  | { type: "hello"; payload: { version: number; yourId: string } }
  | { type: "state"; payload: Snapshot }
  | { type: "pong"; payload: { t: number } };

export type Snapshot = {
  version: number;           // = GAME_CONFIG.VERSION
  tick: number;              // server tick number
  serverTime: number;        // ms (Date.now on server)
  state: GameState;
};

export type ClientToServer =
  | { type: "input"; payload: InputMessage }
  | { type: "ping"; payload: { t: number } };

export type InputMessage = {
  at: number;                // client send time (ms)
  key: string;               // e.g. "ArrowLeft"
  pressed: boolean;          // true for keydown, false for keyup
};