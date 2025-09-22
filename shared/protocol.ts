import { GameState } from "./types";

export type ServerToClient =
  | { type: "hello"; payload: { version: number; yourId: string } }
  | { type: "state"; payload: Snapshot }
  | { type: "playerAssignment"; payload: PlayerAssignmentPayload }
  | { type: "pong"; payload: { t: number } }
  | { type: "room-created"; payload: RoomCreatedPayload }
  | { type: "room-joined"; payload: RoomJoinedPayload }
  | { type: "room-error"; payload: { message: string } }
  | { type: "game-start"; payload: GameStartPayload }
  | { type: "game-over"; payload: GameOverPayload }
  | { type: "player-disconnected"; payload: { playerName: string } };

export type PlayerAssignmentPayload = {
  playerName: string;
  position: 1 | 2;
};

export type Snapshot = {
  version: number;           // = GAME_CONFIG.VERSION
  tick: number;              // server tick number
  serverTime: number;        // ms (Date.now on server)
  state: GameState;
};

export type ClientToServer =
  | { type: "input"; payload: InputMessage }
  | { type: "ping"; payload: { t: number } }
  | { type: "create-room"; payload: CreateRoomPayload }
  | { type: "join-room"; payload: JoinRoomPayload }
  | { type: "leave-room" }
  | { type: "ready" };

export type InputMessage = {
  at: number;                // client send time (ms)
  key: string;               // e.g. "ArrowLeft"
  pressed: boolean;          // true for keydown, false for keyup
};

export type CreateRoomPayload = {
  playerName: string;
};

export type JoinRoomPayload = {
  playerName: string;
  roomId: string;
};

export type RoomCreatedPayload = {
  roomId: string;
  playerName: string;
  position: 1 | 2;
};

export type RoomJoinedPayload = {
  roomId: string;
  playerName: string;
  position: 1 | 2;
};

export type GameStartPayload = {
  roomId: string;
  player1Name: string;
  player2Name: string;
};

export type GameOverPayload = {
  roomId: string;
  winner: string;
  player1Score: number;
  player2Score: number;
};