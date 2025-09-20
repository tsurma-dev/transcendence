export const GAME_CONFIG = {
  VERSION: 1,
  SERVER_URL: "ws://localhost:8443",
  TICK_RATE: 60,                  // How often the server updates the game state internally. Common values: 30–60 ticks/sec.
  SNAPSHOT_RATE: 20,              // How often the server sends state snapshots to clients. Common values: 10–30 snapshots/sec.
  TABLE_WIDTH: 4,
  TABLE_DEPTH: 8,
  WATER_LEVEL: 0,
  FLOOR_LEVEL: -2,
  WATER_EXTRA_SPACE: 1,
  WALL_THICKNESS: 0.2,
  WALL_HEIGHT: 2.5,
  PADDLE_WIDTH: 0.8,
  PADDLE_HEIGHT: 0.6,
  PADDLE_DEPTH: 0.1,
  PADDLE_SPEED: 2,
  BALL_RADIUS: 0.2,
  BALL_SPEED: 1.5,
} as const;
