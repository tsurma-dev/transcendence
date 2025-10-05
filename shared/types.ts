
// Duck position and direction
export type Vec2 = { x: number; z: number };
export type DuckState = Vec2 & { dir: number }; // radians

// Player position and identity
export type Paddle1 = { x: number};
export type Paddle2 = { x: number};

// Overall game status
export type GameStatus = 'waiting' | 'playing' | 'finished';


// --- EVENTS ---

// Different types of collisions that can occur in the game
// Different sounds can be played based on the type of collision

export type GameEvent = CollisionEvent | ScoreEvent;

export type CollisionType = 'wall' | 'paddle' | 'paddle-face' | 'paddle-end' | null;
export type CollisionEvent = {
  type: 'collision';
  collisionType: CollisionType;
};

export type ScoreEvent = {
  type: 'score';
  playerID: 'first' | 'second';
  points: number;
};


// --- GAME STATE ---

export type GameState = {

  // Duck state
  duck: DuckState;

  // Player states
  player1: Paddle1;
  player2: Paddle2;

  // Scores (optional for local games)
  scores?: {
    player1: number;
    player2: number;
  };

  // Overall game status
  status: GameStatus;
  winner?: string | null; // present if status === 'finished' (name is needed for the Game Over pop-up)

  // A list of events that occurred in the last tick
  events: GameEvent[];
};
