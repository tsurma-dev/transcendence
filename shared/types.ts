// Coordinate in the XZ plane
export type Vec2 = { x: number; z: number };
// Unique identifier for a player
export type PlayerId = string;

// Duck position and direction
export type DuckState = Vec2 & { dir: number }; // radians
// Player position
export type PlayerState = Vec2;

/**
 * Represents the overall status of the game.
 * - 'waiting': Before the game starts.
 * - 'playing': The game is in progress.
 * - 'finished': The game has ended.
 */
export type GameStatus = 'waiting' | 'playing' | 'finished';

/**
 * Describes the type of collision that occurred.
 * This allows the frontend to play different sounds.
 */
export type CollisionType = 'wall' | 'paddle';

/**
 * A discrete event that happens in the game. The backend sends these
 * to the frontend so it can react with sounds or visual effects.
 */
export type CollisionEvent = {
  type: 'collision';
  collisionType: CollisionType;
};

// Future event types can be added here, e.g., ScoreEvent, PowerUpEvent, etc.
export type GameEvent = CollisionEvent;

export type GameState = {
  // Positional data
  duck: DuckState;
  players: Record<PlayerId, PlayerState>;

  // Score data
  scores: Record<PlayerId, number>;

  // Overall game status
  status: GameStatus;
  winner?: PlayerId; // present if status === 'finished'

  // A list of events that occurred in the last tick
  events: GameEvent[];
};