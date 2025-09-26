// Coordinate in the XZ plane
export type Vec2 = { x: number; z: number };

// Unique identifier for a player (their unique name)
export type PlayerName = string;

// Duck position and direction
export type DuckState = Vec2 & { dir: number }; // radians

// Player information including position and paddle location
export type PlayerState = {
  x: number;           // Paddle position
  position: 1 | 2;     // Which paddle they control (bottom or top)
  connected?: boolean;
  ready?: boolean;
};

// Overall game status
export type GameStatus = 'waiting' | 'playing' | 'finished';

// Gametype (Local or Online)
export type GameType = 'local' | 'online';

// Roommanagement
export type RoomId = string | null;
export type RoomState = {
  id: RoomId;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  players: {
    player1?: PlayerName;
    player2?: PlayerName;
  };
  createdAt: number;         // Timestamp
  gameStartedAt?: number;    // Timestamp when game started
};

// --- EVENTS ---

// Different types of collisions that can occur in the game
// Different sounds can be played based on the type of collision
export type CollisionType = 'wall' | 'paddle' | null;

export type CollisionEvent = {
  type: 'collision';
  collisionType: CollisionType;
};

export type ScoreEvent = {
  type: 'score';
  player: PlayerName;
  points: number;
};

export type RoomEvent = {
  type: 'room';
  roomEvent: 'player-joined' | 'player-left' | 'game-started' | 'game-ended';
  playerName?: PlayerName;
};

export type GameEvent = CollisionEvent | ScoreEvent | RoomEvent;


// --- GAME STATE ---

export type GameState = {
  // Player data - maps player name to their state
  players: Record<PlayerName, PlayerState>;

  // Room information
  roomId?: RoomId;

  // Score data - maps player name to their score
  scores: Record<PlayerName, number>;

  // Duck state
  duck: DuckState;

  // Game type (Local or Online)
  gameType: GameType;

  // Overall game status
  status: GameStatus;
  winner?: PlayerName; // present if status === 'finished'

  // A list of events that occurred in the last tick
  events: GameEvent[];
};
