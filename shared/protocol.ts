import { GameState } from "./types";

export type ServerToClient =
  | { type: "room-joined"; payload: { playerName: string } }
  | { type: "ready-to-start"; payload: { playerName: string } }
  | { type: "state"; payload: Snapshot }

export type Snapshot = {
  //version: number;           // = GAME_CONFIG.VERSION
  //tick: number;              // server tick number
  //serverTime: number;        // ms (Date.now on server)
  state: GameState;
};

export type ClientToServer =
  | { type: "input"; payload: InputMessage }
  | { type: "join-room"; payload: JoinRoomPayload }
  | { type: "start-game"; payload: { playerName: string } };

export type InputMessage = {
  at: number;                // client send time (ms)
  key: string;               // e.g. "ArrowLeft"
  pressed: boolean;          // true for keydown, false for keyup
};

export type JoinRoomPayload = {
  playerName: string;
  roomId: string;
  playerPosition: 1 | 2;
};