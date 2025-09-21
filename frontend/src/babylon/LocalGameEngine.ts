import { GAME_CONFIG } from "@shared/GameConfig";
import type { GameState, GameType } from "@shared/types";


export class LocalGameEngine {
  private gameState: GameState;
  private isPausedState = false;

  // Input state
  private player1Input = { left: false, right: false };
  private player2Input = { left: false, right: false };

  // Physics constants
  private readonly PADDLE_SPEED = GAME_CONFIG.PADDLE_SPEED;
  private readonly DUCK_SPEED = GAME_CONFIG.BALL_SPEED;

  constructor() {
    this.gameState = this.createInitialGameState();
    console.log('Local game engine created');
  }

private createInitialGameState(): GameState {
    return {
      players: {
        "Player 1": { x: 0, position: 1 },
        "Player 2": { x: 0, position: 2 }
      },
      scores: {
        "Player 1": 0,
        "Player 2": 0
      },
      duck: {
        x: 0,
        z: 0,
        dir: Math.PI / 4
      },
      gameType: 'local' as GameType,
      status: 'playing',
      events: []
    };
  }

  public pause(): void {
    this.isPausedState = true;
    console.log('🟡 Game paused for countdown');
  }

  public resume(): void {
    this.isPausedState = false;
    console.log('🟢 Game resumed after countdown');
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  // Called every frame by Babylon's render loop
  public update(deltaTime: number): void {
    if (this.isPausedState) {
      this.gameState.events = [];
      return;
    }

    if (this.gameState.status === 'finished') {
      console.log('Game is finished, stopping updates');
      return;
    }

    // Clear events from previous frame
    this.gameState.events = [];

    // Update game state
    this.updatePaddles(deltaTime);
    this.updateDuck(deltaTime);
    this.checkWallCollisions();
    const paddleHit = this.checkPaddleCollisions();

    // Add collision events if they occurred
    if (paddleHit) {
      this.gameState.events.push({
        type: 'collision',
        collisionType: 'paddle'
      });
    }

    // Check scoring LAST (after clearing events)
    this.checkScoring();
  }

  private updatePaddles(deltaTime: number): void {
    const player1 = this.gameState.players["Player 1"];
    const player2 = this.gameState.players["Player 2"];

    const step = this.PADDLE_SPEED * (deltaTime / 1000); // <-- frame-independent

    // Player 1 movement (W/S)
    if (this.player1Input.left) player1.x -= step;
    if (this.player1Input.right) player1.x += step;

    // Player 2 movement (ArrowUp/ArrowDown)
    if (this.player2Input.left) player2.x -= step;
    if (this.player2Input.right) player2.x += step;

    const maxX = GAME_CONFIG.TABLE_WIDTH / 2 - GAME_CONFIG.PADDLE_WIDTH / 2;
    player1.x = Math.max(-maxX, Math.min(maxX, player1.x));
    player2.x = Math.max(-maxX, Math.min(maxX, player2.x));
  }

  private updateDuck(deltaTime: number): void {
    const duck = this.gameState.duck;
    const step = this.DUCK_SPEED * (deltaTime / 1000); // <-- frame-independent
    duck.x += Math.cos(duck.dir) * step;
    duck.z += Math.sin(duck.dir) * step;
  }

  private checkWallCollisions(): void {
    const duck = this.gameState.duck;
    const maxX = GAME_CONFIG.TABLE_WIDTH / 2 - GAME_CONFIG.BALL_RADIUS;

    // Bounce from wall and rotate duck accordingly
    if (duck.x <= -maxX) {
      duck.x = -maxX;                 // clamp inside
      duck.dir = Math.PI - duck.dir;  // reflect X
      this.normalizeDirection(duck);
      this.gameState.events.push({ type: 'collision', collisionType: 'wall' });
    } else if (duck.x >= maxX) {
      duck.x = maxX;
      duck.dir = Math.PI - duck.dir;
      this.normalizeDirection(duck);
      this.gameState.events.push({ type: 'collision', collisionType: 'wall' });
    }
  }

  private checkPaddleCollisions(): boolean {
    const duck = this.gameState.duck;
    const player1 = this.gameState.players["Player 1"];
    const player2 = this.gameState.players["Player 2"];

    const paddleHalfWidth = GAME_CONFIG.PADDLE_WIDTH / 2;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // --- Player 1 paddle (duck moving towards negative Z axis) ---
    if (
      duck.z - GAME_CONFIG.BALL_RADIUS <= -GAME_CONFIG.TABLE_DEPTH / 2 &&
      duck.x  >= player1.x - GAME_CONFIG.PADDLE_WIDTH / 2 &&
      duck.x  <= player1.x + GAME_CONFIG.PADDLE_WIDTH / 2 &&
      duck.dir > Math.PI // Moving towards negative Z
      ) {
      // Reflect Z direction
      duck.dir = -duck.dir;
      this.normalizeDirection(duck);
      // Clamp outside paddle so we don’t get stuck
      duck.z = -GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.BALL_RADIUS;

      return true; // Paddle hit
    }

    // --- Player 2 paddle (duck moving towards positive Z axis) ---
    if (
      duck.z + GAME_CONFIG.BALL_RADIUS >= GAME_CONFIG.TABLE_DEPTH / 2 &&
      duck.x >= player2.x - GAME_CONFIG.PADDLE_WIDTH / 2 &&
      duck.x <= player2.x + GAME_CONFIG.PADDLE_WIDTH / 2 &&
      duck.dir < Math.PI // Moving towards positive Z
      ) {
      duck.dir = -duck.dir;
      this.normalizeDirection(duck);
      duck.z = GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.BALL_RADIUS;

      return true; // Paddle hit
    }
    return false; // No paddle hit
  }

  private normalizeDirection(duck: { dir: number }): void {
    // Keep direction between 0 (inclusive) and 2π (exclusive)
    const twoPi = 2 * Math.PI;
    duck.dir = duck.dir % twoPi;
    if (duck.dir < 0) duck.dir += twoPi;
  }

  private checkScoring(): void {
     if (this.isPausedState) return;
    const duck = this.gameState.duck;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // Scoring zones are the pool ends
    const scoreZone1 = -GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.WATER_EXTRA_SPACE; // Behind Player 1's paddle
    const scoreZone2 = GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.WATER_EXTRA_SPACE;  // Behind Player 2's paddle

    let scored = false;

    // Player 1 scores when duck hits the positive Z end of the pool
    if (duck.z + duckRadius > scoreZone2) {
      this.gameState.scores["Player 1"]++;
      this.gameState.events.push({
        type: 'score',
        player: "Player 1",
        points: this.gameState.scores["Player 1"]
      });
      scored = true;
    }
    // Player 2 scores when duck hits the negative Z end of the pool
    else if (duck.z - duckRadius < scoreZone1) {
      this.gameState.scores["Player 2"]++;
      this.gameState.events.push({
        type: 'score',
        player: "Player 2",
        points: this.gameState.scores["Player 2"]
      });
      scored = true;
    }

    if (scored) {
    this.resetDuck();

    // Check win condition
    const winningScore = 5;
    if (this.gameState.scores["Player 1"] >= winningScore) {
      this.gameState.status = 'finished';
      this.gameState.winner = "Player 1";
      console.log("🏆 Player 1 wins the game!");
    } else if (this.gameState.scores["Player 2"] >= winningScore) {
      this.gameState.status = 'finished';
      this.gameState.winner = "Player 2";
      console.log("🏆 Player 2 wins the game!");
    }
  }
}

  private resetDuck(): void {
    // Start with one of four diagonal directions
    const directions = [
      Math.PI / 4,     // 45° (up-right)
      3 * Math.PI / 4, // 135° (up-left)
      5 * Math.PI / 4, // 225° (down-left)
      7 * Math.PI / 4  // 315° (down-right)
    ];

    this.gameState.duck = {
      x: 0,
      z: 0,
      dir: directions[Math.floor(Math.random() * directions.length)]
    };
  }

  // Input handlers
  handleKeyDown(key: string): void {
    if (this.gameState.status === 'finished') {
      console.log('Game is finished, ignoring input');
      return;
    }

    switch (key) {
      case 'ArrowUp':
        this.player2Input.left = true;
        break;
      case 'ArrowDown':
        this.player2Input.right = true;
        break;
      case 'w':
      case 'W':
        this.player1Input.left = true;
        break;
      case 's':
      case 'S':
        this.player1Input.right = true;
        break;
    }
  }

  handleKeyUp(key: string): void {
    if (this.gameState.status === 'finished') {
      return;
    }
    switch (key) {
      case 'ArrowUp': this.player2Input.left = false; break;
      case 'ArrowDown': this.player2Input.right = false; break;
      case 'w': case 'W': this.player1Input.left = false; break;
      case 's': case 'S': this.player1Input.right = false; break;
    }
  }

  // Return the complete GameState - deep cloned to prevent external mutation
  getGameState(): GameState {
    // structuredClone is the best if available (keeps types/objects), fallback to JSON deep copy
    try {
      // @ts-ignore - structuredClone may not be in TS lib, but runtime in modern envs provides it
      return structuredClone(this.gameState) as GameState;
    } catch (e) {
      // Fallback
      return JSON.parse(JSON.stringify(this.gameState)) as GameState;
    }
  }

  dispose(): void {
    console.log('Local game engine disposed');
  }
}