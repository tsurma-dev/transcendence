import { GAME_CONFIG } from "@shared/GameConfig";
import type { GameState} from "@shared/types";


export class LocalGameEngine {
  private gameState: GameState;

  private paddleCollisionCooldown = 0;
  private readonly COLLISION_COOLDOWN_TIME = 100; // 100ms cooldown

  private player1Name: string = "Player 1";
  private player2Name: string = "Player 2";

  private player1Input = { left: false, right: false };
  private player2Input = { left: false, right: false };

  private readonly PADDLE_SPEED = GAME_CONFIG.PADDLE_SPEED;
  private readonly DUCK_SPEED = GAME_CONFIG.BALL_SPEED;

constructor(player1Name?: string, player2Name?: string) {
  if (player1Name) this.player1Name = player1Name;
  if (player2Name) this.player2Name = player2Name;

  this.gameState = this.createInitialGameState();
  console.log('🎮 Local game engine created');
}

private createInitialGameState(): GameState {
    return {
      players: {
        [this.player1Name]: { x: 0, position: 1 },
        [this.player2Name]: { x: 0, position: 2 }
      },
      scores: {
        [this.player1Name]: 0,
        [this.player2Name]: 0
      },
      duck: {
        x: 0,
        z: 0,
        dir: Math.PI / 4
      },
      status: 'playing',
      events: []
    };
  }

  private normalizeDirection(duck: { dir: number }): void {
    // Keep direction between 0 (inclusive) and 2π (exclusive)
    const twoPi = 2 * Math.PI;
    duck.dir = duck.dir % twoPi;
    if (duck.dir < 0) duck.dir += twoPi;
  }

  // *******************************
  // MAIN GAME UPDATE LOOP
  // *******************************
  // Called every frame by Babylon's render loop
  public update(deltaTime: number): void {

    if (this.gameState.status === 'finished') {
      return;
    }

    if (this.paddleCollisionCooldown > 0) {
      this.paddleCollisionCooldown -= deltaTime;
    }

    // Clear events from previous frame
    this.gameState.events = [];

    // Update game state
    this.updatePaddles(deltaTime);
    this.updateDuck(deltaTime);
    this.checkWallCollisions();
    if (this.paddleCollisionCooldown <= 0) {
      this.checkPaddleCollisions();
    }
    this.checkScoring();
  }

  private updatePaddles(deltaTime: number): void {
    const player1 = this.gameState.players[this.player1Name];
    const player2 = this.gameState.players[this.player2Name];

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

  private checkPaddleCollisions(): void {
    const duck = this.gameState.duck;
    const player1 = this.gameState.players[this.player1Name];
    const player2 = this.gameState.players[this.player2Name];

    const paddleHalfWidth = GAME_CONFIG.PADDLE_WIDTH / 2;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // --- Player 1 paddle (at negative Z end) ---
    const paddle1FaceZ = -GAME_CONFIG.TABLE_DEPTH / 2;
    const paddle1BackZ = paddle1FaceZ - GAME_CONFIG.PADDLE_DEPTH;

    // **Check if duck is in paddle zone**
    if (duck.z <= paddle1FaceZ && duck.z >= paddle1BackZ) {
      // **FACE COLLISION: Duck hits paddle front face**
      if (
        duck.z >= paddle1FaceZ - duckRadius &&
        duck.dir > Math.PI && // Moving towards paddle
        duck.x >= player1.x - paddleHalfWidth &&
        duck.x <= player1.x + paddleHalfWidth
      ) {
        // Normal face bounce - reflect back into game area
        duck.dir = 2 * Math.PI - duck.dir; // Reflect across Z-axis
        this.normalizeDirection(duck);
        duck.z = paddle1FaceZ + duckRadius; // **Move duck out of paddle**
        this.gameState.events.push({type: 'collision', collisionType: 'paddle'});
        this.paddleCollisionCooldown = this.COLLISION_COOLDOWN_TIME;
      }
      // **END COLLISION: Duck hits paddle sides**
      else if (
        Math.abs(duck.x - player1.x) <= paddleHalfWidth + duckRadius &&
        Math.abs(duck.x - player1.x) > paddleHalfWidth
      ) {
        const hitLeftEnd = duck.x < player1.x;

        if (hitLeftEnd) {
          // Hit left end - bounce toward left bottom corner
          console.log("HIT LEFT PADDLE END");
          duck.dir = 5 * Math.PI / 4; // 225° (down-left)
          // **Push duck out of paddle**
          duck.x = player1.x - paddleHalfWidth - duckRadius;
        } else {
          console.log("HIT RIGHT PADDLE END");
          // Hit right end - bounce toward right bottom corner
          duck.dir = 7 * Math.PI / 4; // 315° (down-right)
          // **Push duck out of paddle**
          duck.x = player1.x + paddleHalfWidth + duckRadius;
        }

        this.normalizeDirection(duck);
        this.gameState.events.push({type: 'collision', collisionType: 'paddle'});
        this.paddleCollisionCooldown = this.COLLISION_COOLDOWN_TIME;
      }
    }

    // --- Player 2 paddle (at positive Z end) ---
    const paddle2FaceZ = GAME_CONFIG.TABLE_DEPTH / 2;
    const paddle2BackZ = paddle2FaceZ + GAME_CONFIG.PADDLE_DEPTH;

    // **Check if duck is in paddle zone**
    if (duck.z >= paddle2FaceZ && duck.z <= paddle2BackZ) {
      // **FACE COLLISION: Duck hits paddle front face**
      if (
        duck.z <= paddle2FaceZ + duckRadius &&
        duck.dir < Math.PI && // Moving towards paddle
        duck.x >= player2.x - paddleHalfWidth &&
        duck.x <= player2.x + paddleHalfWidth
      ) {
        // Normal face bounce - reflect back into game area
        duck.dir = 2 * Math.PI - duck.dir; // Reflect across Z-axis
        this.normalizeDirection(duck);
        duck.z = paddle2FaceZ - duckRadius; // **Move duck out of paddle**
        this.gameState.events.push({type: 'collision', collisionType: 'paddle'});
        this.paddleCollisionCooldown = this.COLLISION_COOLDOWN_TIME;
      }
      // **END COLLISION: Duck hits paddle sides**
      else if (
        Math.abs(duck.x - player2.x) <= paddleHalfWidth + duckRadius &&
        Math.abs(duck.x - player2.x) > paddleHalfWidth
      ) {
        const hitLeftEnd = duck.x < player2.x;

        if (hitLeftEnd) {
          console.log("HIT LEFT PADDLE END");
          // Hit left end - bounce toward left upper corner
          duck.dir = 3 * Math.PI / 4; // 135 ° (up-left)
          // **Push duck out of paddle**
          duck.x = player2.x - paddleHalfWidth - duckRadius;
        } else {
          console.log("HIT RIGHT PADDLE END");
          // Hit right end - bounce toward right upper corner
          duck.dir = Math.PI / 4; // 45° (up-right)
          // **Push duck out of paddle**
          duck.x = player2.x + paddleHalfWidth + duckRadius;
        }

        this.normalizeDirection(duck);
        this.gameState.events.push({type: 'collision', collisionType: 'paddle'});
        this.paddleCollisionCooldown = this.COLLISION_COOLDOWN_TIME;
      }
    }
  }

  private checkScoring(): void {
    if (this.gameState.status === 'finished') return;
    const duck = this.gameState.duck;
    const duckRadius = GAME_CONFIG.BALL_RADIUS;

    // Scoring zones are the pool ends
    const scoreZone1 = -GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.WATER_EXTRA_SPACE; // Behind Player 1's paddle
    const scoreZone2 = GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.WATER_EXTRA_SPACE;  // Behind Player 2's paddle

    let scored = false;

    // Player 1 scores when duck hits the positive Z end of the pool
    if (duck.z + duckRadius > scoreZone2) {
      this.gameState.scores[this.player1Name]++;
      console.log(`🎉 ${this.player1Name} scored ${this.gameState.scores[this.player1Name]} points!`);
      this.gameState.events.push({
        type: 'score',
        player: this.player1Name,
        points: this.gameState.scores[this.player1Name]
      });
      scored = true;
    }
    // Player 2 scores when duck hits the negative Z end of the pool
    else if (duck.z - duckRadius < scoreZone1) {
      this.gameState.scores[this.player2Name]++;
      console.log(`🎉 ${this.player2Name} scored ${this.gameState.scores[this.player2Name]} points!`);
      this.gameState.events.push({
        type: 'score',
        player: this.player2Name,
        points: this.gameState.scores[this.player2Name]
      });
      scored = true;
    }

    if (scored) {
    this.resetDuck();

    // Check win condition
    const winningScore = 3;
    if (this.gameState.scores[this.player1Name] >= winningScore) {
      this.gameState.status = 'finished';
      this.gameState.winner = this.player1Name;
    } else if (this.gameState.scores[this.player2Name] >= winningScore) {
      this.gameState.status = 'finished';
      this.gameState.winner = this.player2Name;
    }
  }
}

  private resetDuck(): void {
    this.paddleCollisionCooldown = 0;
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
      console.log('⛔ Game is finished, ignoring input');
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
    console.log('⛔ Local game engine disposed');
  }
}