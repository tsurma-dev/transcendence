import { GAME_CONFIG } from "@shared/GameConfig";
import type { GameState, GameType } from "@shared/types";


export class LocalGameEngine {
  private gameState: GameState;

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

  // Called every frame by Babylon's render loop
  update(): void {

    if (this.gameState.status === 'finished') {
      console.log('Game is finished, stopping updates');
      return;
    }

    // Clear events from previous frame
    this.gameState.events = [];

    // Update paddles
    this.updatePaddles();

    // Update duck
    this.updateDuck();

    // Check collisions
    this.checkCollisions();

    // Check scoring
    this.checkScoring();
  }

  private updatePaddles(): void {
    const player1 = this.gameState.players["Player 1"];
    const player2 = this.gameState.players["Player 2"];

    // Player 1 movement
    if (this.player1Input.left) player1.x -= this.PADDLE_SPEED;
    if (this.player1Input.right) player1.x += this.PADDLE_SPEED;

    // Player 2 movement
    if (this.player2Input.left) player2.x -= this.PADDLE_SPEED;
    if (this.player2Input.right) player2.x += this.PADDLE_SPEED;

    // Keep paddles in bounds
    const maxX = GAME_CONFIG.TABLE_WIDTH / 2 - GAME_CONFIG.PADDLE_WIDTH / 2;
    player1.x = Math.max(-maxX, Math.min(maxX, player1.x));
    player2.x = Math.max(-maxX, Math.min(maxX, player2.x));
  }

  private updateDuck(): void {
    this.gameState.duck.x += Math.cos(this.gameState.duck.dir) * this.DUCK_SPEED;
    this.gameState.duck.z += Math.sin(this.gameState.duck.dir) * this.DUCK_SPEED;
  }

  private checkCollisions(): void {
    const duck = this.gameState.duck;

    // Wall bounces
    if (duck.x - GAME_CONFIG.BALL_RADIUS <= -GAME_CONFIG.TABLE_WIDTH / 2 || duck.x + GAME_CONFIG.BALL_RADIUS >= GAME_CONFIG.TABLE_WIDTH / 2) {
      duck.dir = Math.PI - duck.dir;
      this.normalizeDirection(duck);
      this.gameState.events.push({ type: 'collision', collisionType: 'wall' });
    }

    // Paddle bounces
    const paddleHit = this.checkPaddleCollisions();
    if (paddleHit) {
      this.gameState.events.push({ type: 'collision', collisionType: 'paddle' });
    }
  }

  private checkPaddleCollisions(): boolean {
    const duck = this.gameState.duck;
    const player1 = this.gameState.players["Player 1"];
    const player2 = this.gameState.players["Player 2"];

    const paddleZ1 = -GAME_CONFIG.TABLE_DEPTH / 2; // Player 1 paddle (blue)
    const paddleZ2 = GAME_CONFIG.TABLE_DEPTH / 2;  // Player 2 paddle (red)

    const paddleHalfWidth = GAME_CONFIG.PADDLE_WIDTH / 2;
    const paddleHalfDepth = GAME_CONFIG.PADDLE_DEPTH / 2;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // Player 1 paddle collision (duck moving downward)
    if (duck.z - duckRadius <= paddleZ1 + paddleHalfDepth &&
      duck.z > paddleZ1 &&
      duck.x >= player1.x - paddleHalfWidth &&
      duck.x <= player1.x + paddleHalfWidth &&
      Math.sin(duck.dir) < 0) { // Moving downward
        duck.dir = -duck.dir;
        this.normalizeDirection(duck);
        duck.z = paddleZ1 + paddleHalfDepth + duckRadius + 0.1; // Move duck away from paddle
        return true;
    }

    // Player 2 paddle collision (duck moving upward)
    if (duck.z + duckRadius >= paddleZ2 - paddleHalfDepth &&
      duck.z < paddleZ2 && // Duck is below the paddle
      duck.x >= player2.x - paddleHalfWidth &&
      duck.x <= player2.x + paddleHalfWidth &&
      Math.sin(duck.dir) > 0) { // Moving upward
        duck.dir = -duck.dir; // Reverse direction
        this.normalizeDirection(duck);
        duck.z = paddleZ2 - paddleHalfDepth - duckRadius - 0.1; // Move duck away from paddle
        return true;
    }
    return false;
  }

  private normalizeDirection(duck: { dir: number }): void {
    // Keep direction between 0 and 2π
    while (duck.dir < 0) {
      duck.dir += 2 * Math.PI;
    }
    while (duck.dir >= 2 * Math.PI) {
      duck.dir -= 2 * Math.PI;
    }
  }

  private checkScoring(): void {
    const duck = this.gameState.duck;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // Scoring zones are beyond the paddles
    const scoreZone1 = -GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.PADDLE_DEPTH; // Behind Player 1's paddle
    const scoreZone2 = GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.PADDLE_DEPTH;  // Behind Player 2's paddle

    // Player 1 scores when duck goes past Player 2's paddle (positive Z)
    if (duck.z + duckRadius > scoreZone2) {
      this.gameState.scores["Player 1"]++;
      this.gameState.events.push({
        type: 'score',
        player: "Player 1",
        points: this.gameState.scores["Player 1"]
      });
      this.resetDuck();
    }
    // Player 2 scores when duck goes past Player 1's paddle (negative Z)
    else if (duck.z - duckRadius < scoreZone1) {
      this.gameState.scores["Player 2"]++;
      this.gameState.events.push({
        type: 'score',
        player: "Player 2",
        points: this.gameState.scores["Player 2"]
      });
      this.resetDuck();
    }

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

    console.log(`Duck reset! Direction: ${this.gameState.duck.dir.toFixed(2)} (${(this.gameState.duck.dir * 180 / Math.PI).toFixed(0)}°)`);
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

  // Return the complete GameState - to be compatible with PoolScene
  getGameState(): GameState {
    return { ...this.gameState }; // Return copy to prevent external mutation
  }

  dispose(): void {
    console.log('Local game engine disposed');
  }
}