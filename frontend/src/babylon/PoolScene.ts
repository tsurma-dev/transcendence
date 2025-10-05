import {
  Scene,
  Engine,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  DirectionalLight,
  PointLight,
  ShadowGenerator,
  Vector4,
  SceneLoader,
  HDRCubeTexture,
  ImageProcessingConfiguration,
  GlowLayer,
  Animation,
  CubicEase,
  EasingFunction,
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

import { GAME_CONFIG } from "@shared/GameConfig"
import { RENDERING_SETTINGS, LIGHT_SETTINGS, CAMERA_SETTINGS } from "./constants";
import { Materials } from "./Materials";
import { Duck } from "./Duck";
import { Paddle } from "./Paddle";
import { GameClient } from "./GameClient";
import type { GameState } from "@shared/types";
import { Scoreboard } from "./Scoreboard";
import { LocalGameEngine } from "./LocalGameEngine";



export class PoolScene {
  // Babylon essentials
  private scene: Scene;
  private engine: Engine;
  private canvas: HTMLCanvasElement;

  // Loading state
  private isLoaded = false;
  private loadingPromises: Promise<any>[] = [];
  private onLoadedCallback?: () => void;
  private gameStarted = false;
  private gameEnded = false;

  // Camera and lighting
  private light!: DirectionalLight;
  private hemilight!: HemisphericLight;
  private poolLights: PointLight[] = [];
  private shadowGenerator!: ShadowGenerator;
  private camera!: ArcRotateCamera;
  private cameraPositioned = false;

  // Game objects
  private duck!: Duck;
  private Paddle1!: Paddle;
  private Paddle2!: Paddle;

  // Game mode properties
  private gameMode: 'local' | 'online' | 'AI'; // online includes createRoom and joinRoom depending on given args
  private localGameEngine?: LocalGameEngine;
  private client?: GameClient;
  private currentState?: GameState; // Track current game state for game-over handling

  // Sounds - HTML5 Audio 
  private wallHitAudio!: HTMLAudioElement;
  private paddleHitAudio!: HTMLAudioElement;
  private scoreAudio!: HTMLAudioElement;
  private bgMusicAudio!: HTMLAudioElement;
  public audioEnabled = false;

  // Animations
  private isIntroPlaying = false;

  // Scoreboard and UI
  private scoreboard!: Scoreboard;
  private countdownElement?: HTMLElement;
  private player1Name: string; // current user
  private player2Name: string; // opponent
  private roomId: string;

  // Event handlers for cleanup
  private keyDownHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;
  private resizeHandler!: () => void;

  // Callbacks for external events
  private renderCallback?: () => void;
  private onGameEndCallback?: (finalState: GameState) => void;
  private onRoomIdCallback?: (roomId: string) => void;
  private onGameStartCallback?: () => void;

  // -------------------
  // --- CONSTRUCTOR ---
  // -------------------
  // Sets up the entire scene, connects to the server, and starts the render loop.
  constructor(
    canvas: HTMLCanvasElement,
    gameMode: 'local' | 'online' | 'AI' = 'online',
    player1Name: string,
    player2Name?: string,
    roomId?: string
  ) {
    this.canvas = canvas;
    this.gameMode = gameMode;
    this.player1Name = player1Name;
    this.player2Name = player2Name || "Player 2";
    this.roomId = roomId || "";

    try {
      this.engine = new Engine(this.canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
      });

      // Check if engine was created successfully
      if (!this.engine) {
        throw new Error('Failed to create Babylon.js Engine');
      }

      this.scene = this.CreateScene();
      this.scoreboard = new Scoreboard(this.player1Name, this.player2Name, this.gameMode);
      this.createCountdownUI();

      // Load assets in the background
      this.initializeAssets().then(() => {
        if (this.onLoadedCallback) this.onLoadedCallback();
      }).catch((error) => {
        console.error('Failed to initialize assets:', error);
      });

      // Start render loop
      this.engine.runRenderLoop(() => {
        this.scene.render();
      });

      // Resize listener
      this.resizeHandler = () => this.engine.resize();
      window.addEventListener("resize", this.resizeHandler);

    } catch (error) {
      console.error('Failed to initialize PoolScene:', error);
      throw error; // Re-throw so Game3DComponent can handle it
    }
  }

  // ---- INITIALIZING HELPER FUNCTIONS ----

  // --- Initialize all assets with promises ---
  private async initializeAssets(): Promise<void> {
    console.log('🔄 Loading game assets...');

    // Load 3D models
    await this.load3DModels();

    // Wait for any other async operations
    await Promise.all(this.loadingPromises);

    this.isLoaded = true;
    console.log('✅ Scene loaded');
  }

  // --- LOAD 3D MODELS ---
  private async load3DModels(): Promise<void> {

    // Initialize game objects and wait for them to load
    this.duck = new Duck(this.scene, this.shadowGenerator);
    await this.duck.waitForLoad();

    this.Paddle1 = new Paddle(
      "Paddle1",
      this.scene,
      new Vector3(1, 0.6, 0), //Orange
      new Vector3(0, GAME_CONFIG.WATER_LEVEL, -GAME_CONFIG.TABLE_DEPTH / 2 - GAME_CONFIG.PADDLE_DEPTH / 2),
      this.shadowGenerator
    );
    await this.Paddle1.waitForLoad();

    this.Paddle2 = new Paddle(
      "Paddle2",
      this.scene,
      new Vector3(1, 0.41, 0.71), // Pink
      new Vector3(0, GAME_CONFIG.WATER_LEVEL, GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.PADDLE_DEPTH / 2),
      this.shadowGenerator
    );
    await this.Paddle2.waitForLoad();
  }

  // ---- GAME LOOP AND STATE HANDLING ----

  // --- MAIN GAME START FUNCTION ---
  public async startAnimation(): Promise<void> {
    // Enable audio on first user interaction
    await this.enableAudio();

    // **INITIALIZE GAME LOGIC**
    if (this.gameMode === 'local') {
      // LOCAL GAME
      this.initializeLocalGame();
      this.setupInputListeners();

      // Start background music for local games
      this.startBackgroundMusic();

      await this.playCameraIntro();
      await this.runCountdown();
      this.gameStarted = true;
    } else {
      // ONLINE GAME (including AI)
      this.setupInputListeners();;
      await this.initializeOnlineGameAndWait();

    }
  }

  // Handles the end of the game, displaying the winner and playing sounds.
  private handleGameEnd(finalState: GameState): void {
    console.log(`🏆 Final Result: ${finalState.winner} WINS!`);

    // Play final score sound if audio is enabled
    if (this.audioEnabled && this.scoreAudio) {
      try {
        this.scoreAudio.currentTime = 0;
        this.scoreAudio.play().catch(() => { });
      } catch (error) {
        // Silent error handling
      }
    }

    this.scoreboard.updateFromGameState(finalState);

    // TODO: Show game winning / losing animation
    if (this.onGameEndCallback) {
      this.onGameEndCallback(finalState);
    }
  }

  public isGameReady(): boolean {
    return this.isLoaded;
  }

  // --- CALLBACKS ---

  public onLoaded(callback: () => void): void {
    if (this.isLoaded) {
      callback();
    } else {
      this.onLoadedCallback = callback;
    }
  }

  public setOnGameEndCallback(callback: (finalState: GameState) => void): void {
    this.onGameEndCallback = callback;
  }

  public setOnRoomIdCallback(callback: (roomId: string) => void): void {
    this.onRoomIdCallback = callback;
  }

  public setOnGameStartCallback(callback: () => void): void {
    this.onGameStartCallback = callback;
  }



  // ********************
  // --LOCAL GAME SETUP --
  // ********************
  private initializeLocalGame(): void {
    console.log('🔄 Initializing local game');
    this.localGameEngine = new LocalGameEngine(this.player1Name, this.player2Name);

    // Clean up any existing render callback
    if (this.renderCallback) {
      this.scene.unregisterBeforeRender(this.renderCallback);
    }

    // Create new render callback
    this.renderCallback = () => {
      if (!this.gameStarted) return; // prevent updates before Start
      const deltaTime = this.engine.getDeltaTime();
      if (this.localGameEngine) {
        this.localGameEngine.update(deltaTime);
        const gameState = this.localGameEngine.getGameState();
        this.updateFromState(gameState);
      }
    };

    // Register the callback
    this.scene.registerBeforeRender(this.renderCallback);
  }

  // -----------------------------
  // QUICK RESTART for local games
  // -----------------------------
  public async restartQuick(): Promise<void> {
    console.log('🔄 Quick restart for local game');

    // Reset game state flags
    this.gameStarted = false;
    this.gameEnded = false;

    // Dispose and recreate local game engine
    if (this.localGameEngine) {
      this.localGameEngine.dispose();
    }
    this.initializeLocalGame();

    // Position duck at center before countdown
    this.duck.updatePosition({ x: 0, z: 0, dir: Math.PI / 2 });

    // Reset paddle positions to center
    this.Paddle1.updatePosition({ x: 0 });
    this.Paddle2.updatePosition({ x: 0 });

    // Reset scoreboard
    this.scoreboard.reset();

    // Skip animation and go straight to countdown
    await this.enableAudio();
    await this.runCountdown();
    this.gameStarted = true;
  }


  // **************************
  // --- ONLINE GAME SETUP ---
  // **************************
  private async initializeOnlineGameAndWait(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔄 Initializing online game');

      // Create client
      this.client = new GameClient(
        GAME_CONFIG.SERVER_URL,
        this.player1Name,
        this.roomId,
        this.gameMode
      );

      this.client.setOnRoomJoined(async (roomId: string) => {

        // Notify Game3D about the room ID (for createRoom mode)
        if (this.onRoomIdCallback) {
          this.onRoomIdCallback(roomId);
        }

        // Check if this is player 1 or player 2
        if (this.client?.getMyPosition() === 1) {
          if (this.gameMode === 'AI') {
            console.log('🤖 AI opponent will join automatically...');
          } else {
            console.log('⏳ Waiting for second player to join...');
          }
          // Player 1 waits for player 2/AI
        } else if (this.client?.getMyPosition() === 2) {
          console.log('✅ Both players in room! Second player joined.');
          // Player 2 joining triggers server to send room-ready to both
        }
      });

      this.client.setOnRoomReady(async (player1Name: string, player2Name: string) => {

        // Update scoreboard with actual player names from server
        this.scoreboard.updatePlayerNames(player1Name, player2Name);

        // Notify Game3D to hide waiting screens
        if (this.onGameStartCallback) {
          this.onGameStartCallback();
        }

        const myPosition = this.client?.getMyPosition();
        if (myPosition) {
          await this.playOnlineIntro(myPosition);
          console.log('✅ Animation complete');
        }

        console.log('💫 Sending ready-to-play...');
        this.client?.sendReady();

        console.log('⏳ Waiting for server to start countdown...');
      });

      this.client.setOnStartCountdown(async () => {
        await this.runCountdown();
        this.gameStarted = true;
        resolve(); 
      });

      this.client.setOnGameStart(async () => {
      });

      // Set up game state handler
      this.client.setOnGameState((state: GameState) => {
        this.currentState = state; // Track current state for game-over handling
        this.updateFromState(state);
      });

      // Set up game-over handler to get proper winner name
      this.client.setOnGameOver((result) => {
        // Create a final state with the proper winner name for display
        if (this.currentState) {
          const finalStateWithWinner: GameState = {
            ...this.currentState,
            status: 'finished',
            winner: result.winner, // Use the player name from server
            scores: {
              player1: result.player1Score,
              player2: result.player2Score
            }
          };
          this.handleGameEnd(finalStateWithWinner);
        }
      });

      // Connect to server (this will trigger the room joining)
      this.client.connect();
    });
  }

  // -----------------------
  // --- INPUT HANDLING ---
  // -----------------------
  private setupInputListeners(): void {
    if (this.gameMode === 'local') {
      // Local game - handle both players
      this.keyDownHandler = (e: KeyboardEvent) => {
        if (this.localGameEngine) {
          this.localGameEngine.handleKeyDown(e.key);
        }
      };
      this.keyUpHandler = (e: KeyboardEvent) => {
        if (this.localGameEngine) {
          this.localGameEngine.handleKeyUp(e.key);
        }
      };
    } else {
      // Online game - send to server with position-based direction
      this.keyDownHandler = (e: KeyboardEvent) => {
        const myPosition = this.client?.getMyPosition();
        if (!myPosition) return;

        if (e.key === "ArrowLeft") {
          // Player 1: Left = -1, Player 2: Left = 1 (inverted)
          const direction = myPosition === 1 ? -1 : 1;
          this.client?.sendInput(direction);
        } else if (e.key === "ArrowRight") {
          // Player 1: Right = 1, Player 2: Right = -1 (inverted)
          const direction = myPosition === 1 ? 1 : -1;
          this.client?.sendInput(direction);
        }
      };
      this.keyUpHandler = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          this.client?.sendInput(0); // Stop
        }
      };
    }

    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
    window.addEventListener("resize", this.resizeHandler);
    console.log('✅ Input listeners set up');
  }


  // --------------------------------
  // !!! --- MAIN UPDATE LOOP --- !!!
  // --------------------------------
  //  Receives state from the server and updates the scene.
  private async updateFromState(state: GameState): Promise<void> {
    if (!this.gameStarted) {
      console.log("⚠️  Ignoring state update - game not started yet");
      return; // nothing moves before Start
    }

    if (state.status === 'finished' && !this.gameEnded) {
      this.gameEnded = true;

      // For local games, call handleGameEnd directly since there's no server message
      if (this.gameMode === 'local') {
        this.handleGameEnd(state);
      }

      return; // Stop processing any further updates
    }

    // **Skip updates if game already ended**
    if (this.gameEnded) return;

    // Update camera position for online game
    if (!this.cameraPositioned && this.gameMode === 'online') {
      this._updateCameraPosition(state);
    }

    // Update duck position
    this.duck.updatePosition(state.duck);

    // Update paddles position
    this.Paddle1.updatePosition(state.player1);
    this.Paddle2.updatePosition(state.player2);

    // Handle events (score, sounds)
    for (const event of state.events) {
      switch (event.type) {
        case 'collision':
          if (event.collisionType === 'wall') {
            if (this.audioEnabled && this.wallHitAudio) {
              try {
                this.wallHitAudio.currentTime = 0;
                this.wallHitAudio.play().catch(() => { });
              } catch (error) {
                // Silent error handling
              }
            }
          } else if (event.collisionType === 'paddle-face') {
            // Only play paddle sound for front face hits, not end hits
            if (this.audioEnabled && this.paddleHitAudio) {
              try {
                this.paddleHitAudio.currentTime = 0;
                this.paddleHitAudio.play().catch(() => { });
              } catch (error) {
                // Silent error handling
              }
            }
          } else if (event.collisionType === 'paddle-end') {
            // Play wall hit sound for paddle end collisions
            if (this.audioEnabled && this.wallHitAudio) {
              try {
                this.wallHitAudio.currentTime = 0;
                this.wallHitAudio.play().catch(() => { });
              } catch (error) {
                // Silent error handling
              }
            }
          }
          break;
        case 'score':
          if (this.audioEnabled && this.scoreAudio) {
            try {
              this.scoreAudio.currentTime = 0;
              this.scoreAudio.play().catch(() => { });
            } catch (error) {
              // Silent error handling
            }
          }
          this.scoreboard.updateFromGameState(state);
          break;
      }
    }
  }



  // --------------------
  // --- AUDIO SETUP ---
  // --------------------

  public async enableAudio(): Promise<void> {
    if (this.audioEnabled) return;

    try {
      // Create HTML5 audio objects
      this.wallHitAudio = new Audio('/sounds/squeeze.mp3');
      this.wallHitAudio.volume = 0.6;

      this.paddleHitAudio = new Audio('/sounds/squeak.mp3');
      this.paddleHitAudio.volume = 0.4;

      this.scoreAudio = new Audio('/sounds/score.mp3');
      this.scoreAudio.volume = 0.7;

      this.bgMusicAudio = new Audio('/sounds/bg_music.mp3');
      this.bgMusicAudio.volume = 0.2;
      this.bgMusicAudio.loop = true;

      this.audioEnabled = true;
    } catch (error) {
      console.error('Failed to enable audio:', error);
    }
  }

  private startBackgroundMusic(): void {
    if (!this.audioEnabled || !this.bgMusicAudio) return;

    try {
      this.bgMusicAudio.currentTime = 0;
      this.bgMusicAudio.play().catch(() => {
        // Silent error handling for autoplay restrictions
      });
    } catch (error) {
      // Silent error handling
    }
  }

  public stopBackgroundMusic(): void {
    try {
      if (this.bgMusicAudio && !this.bgMusicAudio.paused) {
        this.bgMusicAudio.pause();
        this.bgMusicAudio.currentTime = 0;
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // ----------------------
  // --- COUNT-DOWN UI ---
  // ----------------------
  private createCountdownUI(): void {
    this.countdownElement = document.createElement("div");
    this.countdownElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 64px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 6px black;
      z-index: 15;
      display: none;
      pointer-events: none;
    `;
    this.canvas.parentElement?.appendChild(this.countdownElement);
  }

  public async runCountdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.countdownElement) {
        this.countdownElement.style.display = "block";
      }

      let count = 3;
      const updateCountdown = () => {
        if (this.countdownElement) {
          this.countdownElement.innerText = count.toString();
        }
        count--;
        if (count < 0) {
          console.log('✅ Countdown finished');
          if (this.countdownElement) {
            this.countdownElement.style.display = "none";
          }
          this.scoreboard.setGameInProgress();
          resolve();
        } else {
          setTimeout(updateCountdown, 1000);
        }
      };
      updateCountdown();
    });
  }

  // ------------------------------
  // --- ANIMATIONS ---
  // ------------------------------

  // --- Camera intro for LOCAL GAME ---

  public async playCameraIntro(): Promise<void> {
    if (this.isIntroPlaying) return;

    this.isIntroPlaying = true;
    console.log('🎬 Playing animation...');

    // **1. PLAY ORBIT ANIMATION**
    await this.playSkyOrbitIntro();

    // **2. ZOOM ANIMATION - Use current camera position as start**
    const startPosition = this.camera.position.clone();
    const startTarget = this.camera.getTarget().clone();
    // Create easing
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    // Position animation
    const positionAnimation = new Animation(
      "cameraPosition",
      "position",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    positionAnimation.setKeys([
      { frame: 0, value: startPosition },
      { frame: 300, value: CAMERA_SETTINGS.POSITION_LOCAL }
    ]);
    positionAnimation.setEasingFunction(easingFunction);

    // Target animation
    const targetAnimation = new Animation(
      "cameraTarget",
      "target",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    targetAnimation.setKeys([
      { frame: 0, value: startTarget },
      { frame: 300, value: CAMERA_SETTINGS.TARGET_LOCAL }
    ]);
    targetAnimation.setEasingFunction(easingFunction);

    // Apply and start
    this.camera.animations = [positionAnimation, targetAnimation];

    return new Promise((resolve) => {
      const animatable = this.scene.beginAnimation(this.camera, 0, 300, false);
      animatable.onAnimationEndObservable.add(() => {
        this.isIntroPlaying = false;
        resolve();
      });
    });
  }

  private async playSkyOrbitIntro(): Promise<void> {
    const orbitFrames = 480;
    const startRadius = 20; // Start far out for skybox view
    const endRadius = 2; // End very close to the duck
    const startHeight = 1;
    const endHeight = 3;
    const center = new Vector3(0, 0, 0);

    const zoomStartPosition = new Vector3(15, 8, 15);
    const endAngle = Math.atan2(zoomStartPosition.z, zoomStartPosition.x);
    const startAngle = endAngle - Math.PI; // rotate 180 degrees

    // Generate keyframes for position
    const positionKeys = [];
    for (let i = 0; i <= orbitFrames; i++) {
      const progress = i / orbitFrames;

      // Smoothly interpolate from start angle to end angle
      const angle = startAngle + (progress * Math.PI);

      // Interpolate radius from startRadius to endRadius
      const radius = startRadius + ((endRadius - startRadius) * progress);

      // Interpolate height from startHeight to endHeight
      const height = startHeight + ((endHeight - startHeight) * progress);

      // Calculate position on the circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      positionKeys.push({
        frame: i,
        value: new Vector3(x, height, z)
      });
    }

    // Last position should match zoom start
    const lastPos = positionKeys[positionKeys.length - 1].value;

    // Always look at pool center
    const targetKeys = [
      { frame: 0, value: center },
      { frame: orbitFrames, value: center }
    ];

    // Create animations
    const positionAnimation = new Animation(
      "skyOrbitPosition",
      "position",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    positionAnimation.setKeys(positionKeys);

    const targetAnimation = new Animation(
      "skyOrbitTarget",
      "target",
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    targetAnimation.setKeys(targetKeys);

    // Easing for smoothness
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    positionAnimation.setEasingFunction(easingFunction);
    targetAnimation.setEasingFunction(easingFunction);

    // Apply and start
    this.camera.animations = [positionAnimation, targetAnimation];

    return new Promise((resolve) => {
      const animatable = this.scene.beginAnimation(this.camera, 0, orbitFrames, false);
      animatable.onAnimationEndObservable.add(() => {
        resolve();
      });
    });
  }


  //--- Camera intro for ONLINE GAME ---

  public async playOnlineIntro(playerPosition: 1 | 2): Promise<void> {
    if (this.isIntroPlaying) return;

    this.isIntroPlaying = true;
    console.log('🎬 Playing animation...');
    // Start background music when online game animation begins
    this.startBackgroundMusic();

    // **SETUP: Position camera at the starting position immediately to avoid visual jump**
    this.camera.position = CAMERA_SETTINGS.INTRO_START_POSITION.clone();
    this.camera.setTarget(new Vector3(0, 0, 0)); // Look at duck/center

    // **PHASE 1: Close orbit around the duck**
    await this.playCloseOrbitAroundDuck();

    // **PHASE 2: Zoom out far to show skybox horizon**
    await this.animateToPosition(
      CAMERA_SETTINGS.INTRO_SKYBOX_POSITION,
      CAMERA_SETTINGS.INTRO_SKYBOX_TARGET,
      CAMERA_SETTINGS.INTRO_SKYBOX_ZOOM_DURATION,
    );

    // **PHASE 3: Zoom into final player position**
    const finalPosition = playerPosition === 1 ?
      CAMERA_SETTINGS.POSITION1 :
      CAMERA_SETTINGS.POSITION2;

    const finalTarget = playerPosition === 1 ?
      CAMERA_SETTINGS.TARGET1 :
      CAMERA_SETTINGS.TARGET2;

    await this.animateToPosition(
      finalPosition,
      finalTarget,
      240, // 4 seconds for dramatic zoom in
    );

    this.isIntroPlaying = false;
  }

  // **Helper method for smooth camera transitions**
  private async animateToPosition(
    targetPosition: Vector3,
    targetLookAt: Vector3,
    durationFrames: number,
  ): Promise<void> {
    return new Promise((resolve) => {

      const startPosition = this.camera.position.clone();
      const startTarget = this.camera.getTarget().clone();

      // Create easing
      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

      // Position animation
      const positionAnimation = new Animation(
        "cameraPosition",
        "position",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      positionAnimation.setKeys([
        { frame: 0, value: startPosition },
        { frame: durationFrames, value: targetPosition }
      ]);
      positionAnimation.setEasingFunction(easingFunction);

      // Target animation
      const targetAnimation = new Animation(
        "cameraTarget",
        "target",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      targetAnimation.setKeys([
        { frame: 0, value: startTarget },
        { frame: durationFrames, value: targetLookAt }
      ]);
      targetAnimation.setEasingFunction(easingFunction);

      // Apply animations
      this.camera.animations = [positionAnimation, targetAnimation];

      const animatable = this.scene.beginAnimation(this.camera, 0, durationFrames, false);
      animatable.onAnimationEndObservable.add(() => {
        resolve();
      });
    });
  }

  // Close orbit around duck
  private async playCloseOrbitAroundDuck(): Promise<void> {
    return new Promise((resolve) => {
      const orbitFrames = CAMERA_SETTINGS.INTRO_CLOSE_ORBIT_DURATION;
      const radius = CAMERA_SETTINGS.INTRO_CLOSE_ORBIT_RADIUS;
      const height = CAMERA_SETTINGS.INTRO_CLOSE_ORBIT_HEIGHT;
      const center = new Vector3(0, 0, 0); // Duck position

      const startPos = CAMERA_SETTINGS.INTRO_START_POSITION;
      const startAngle = Math.atan2(startPos.z, startPos.x);

      // Generate keyframes for full 360° rotation
      const positionKeys = [];
      for (let i = 0; i <= orbitFrames; i++) {
        const progress = i / orbitFrames;
        const angle = startAngle - (progress * Math.PI); // 180° rotation (reversed direction)

        // Calculate position on the circle
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        positionKeys.push({
          frame: i,
          value: new Vector3(x, height, z)
        });
      }

      // Always look at duck center
      const targetKeys = [
        { frame: 0, value: center },
        { frame: orbitFrames, value: center }
      ];

      // Create animations
      const positionAnimation = new Animation(
        "closeOrbitPosition",
        "position",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      positionAnimation.setKeys(positionKeys);

      const targetAnimation = new Animation(
        "closeOrbitTarget",
        "target",
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      targetAnimation.setKeys(targetKeys);

      // Smooth easing
      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      positionAnimation.setEasingFunction(easingFunction);

      // Apply and start
      this.camera.animations = [positionAnimation, targetAnimation];

      const animatable = this.scene.beginAnimation(this.camera, 0, orbitFrames, false);
      animatable.onAnimationEndObservable.add(() => {
        resolve();
      });
    });
  }

  // -------------------------------
  // --- SCENE CREATION METHODS  ---
  // -------------------------------

  // Creates and configures the entire 3D scene.
  private CreateScene(): Scene {
    const scene: Scene = new Scene(this.engine);
    const materials: Materials = new Materials(scene);

    // Create camera and lights
    this._createCamera(scene);
    this._createLights(scene);
    this._createSkybox(scene);

    // Configure scene post-processing
    this._configurePostProcessing(scene);

    // create elements of the pool
    this._createPool(scene, materials);
    this._createLadders(scene, materials);
    this._createWater(scene, materials);

    return scene;
  }

  private _configurePostProcessing(scene: Scene): void {
    const glowLayer = new GlowLayer("glow", scene);
    glowLayer.intensity = RENDERING_SETTINGS.GLOW_INTENSITY;

    scene.imageProcessingConfiguration.toneMappingEnabled = true; // Enables tone mapping, which is a post-processing step that remaps HDR (high dynamic range) colors to the displayable range of your monitor. This makes lighting and colors look more natural and less washed out, especially when using HDR textures or physically based rendering (PBR) materials.
    scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES; // Sets the tone mapping algorithm to ACES Filmic, which is a high-quality, film-like tone mapping curve. It produces more cinematic, realistic color and contrast than the default.
    scene.imageProcessingConfiguration.exposure = RENDERING_SETTINGS.EXPOSURE; // Controls the overall brightness of the scene after tone mapping. Can be tweaked to make scene brighter or darker.
  }

  private _createCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera("camera", 0, 0, 1, CAMERA_SETTINGS.TARGET_LOCAL, scene);
    // Set initial camera position based on game mode to avoid flash
    if (this.gameMode === 'online') {
      // For online games, start at intro position to avoid overhead flash
      this.camera.setPosition(CAMERA_SETTINGS.INTRO_START_POSITION);
      this.camera.setTarget(new Vector3(0, 0, 0)); // Look at duck/center
    } else {
      // For local games, use the standard overhead position
      this.camera.setPosition(CAMERA_SETTINGS.POSITION_LOCAL);
    }
  }

  private _updateCameraPosition(state: GameState): void {
    const myPosition = this.client?.getMyPosition();
    if (myPosition === 1) {
      this.camera.setPosition(CAMERA_SETTINGS.POSITION1);
      this.camera.setTarget(CAMERA_SETTINGS.TARGET1);
    } else if (myPosition === 2) {
      this.camera.setPosition(CAMERA_SETTINGS.POSITION2);
      this.camera.setTarget(CAMERA_SETTINGS.TARGET2);
    }
    this.cameraPositioned = true;
  }

  private _createLights(scene: Scene): void {
    //Lights
    this.light = new DirectionalLight("light", LIGHT_SETTINGS.DIRECTIONAL_DIRECTION, scene);
    this.hemilight = new HemisphericLight("HemiLight", LIGHT_SETTINGS.HEMISPHERE_DIRECTION, scene);
    this.light.position = LIGHT_SETTINGS.DIRECTIONAL_POSITION;
    this.light.intensity = LIGHT_SETTINGS.DIRECTIONAL_INTENSITY;
    this.hemilight.intensity = LIGHT_SETTINGS.HEMISPHERE_INTENSITY;
    // Shadow
    this.shadowGenerator = new ShadowGenerator(RENDERING_SETTINGS.SHADOW_MAP_SIZE, this.light);
    this.shadowGenerator.usePoissonSampling = true;
    this.shadowGenerator.bias = 0.00001;
    this.shadowGenerator.darkness = 0.5;
    this.shadowGenerator.setDarkness(0.5);
  }

  private _createSkybox(scene: Scene): void {
    const skyboxTexture = new HDRCubeTexture("/textures/skybox.hdr", scene, 512);
    scene.createDefaultSkybox(skyboxTexture, true, 1000);
    scene.environmentTexture = skyboxTexture; // enables correct reflections and lighting for PBR materials.
  }

  // --- POOL ---
  private _createPool(scene: Scene, materials: Materials): void {
    this._createPoolFloor(scene, materials);
    this._createPoolWalls(scene, materials);
    this._createPoolLights(scene, materials);
    this._createSurroundingGround(scene, materials);
  }

  private _createPoolFloor(scene: Scene, materials: Materials): void {
    const floorWidth = GAME_CONFIG.TABLE_WIDTH + 2 * GAME_CONFIG.WALL_THICKNESS;
    const floorHeight = GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE + 2 * GAME_CONFIG.WALL_THICKNESS;
    const floor = MeshBuilder.CreateGround("poolFloor", {
      width: floorWidth,
      height: floorHeight
    }, scene);
    floor.material = materials.createScaledFloorMaterial("floorMat", floorWidth, floorHeight, RENDERING_SETTINGS.TILE_SCALE);
    floor.position.y = GAME_CONFIG.FLOOR_LEVEL;
    floor.receiveShadows = true;
    floor.freezeWorldMatrix();
  }

  private _createPoolWalls(scene: Scene, materials: Materials): void {
    const tileScale = RENDERING_SETTINGS.TILE_SCALE;
    // --- FRONT/BACK WALLS ---
    const backWallWidth = GAME_CONFIG.TABLE_WIDTH + 2 * GAME_CONFIG.WALL_THICKNESS;
    const backWallHeight = GAME_CONFIG.WALL_HEIGHT;
    const backWallDepth = GAME_CONFIG.WALL_THICKNESS;
    const backWallUV: Vector4[] = new Array(6);
    backWallUV[0] = new Vector4(0, 0, backWallWidth / tileScale, backWallHeight / tileScale);
    backWallUV[1] = new Vector4(0, 0, backWallWidth / tileScale, backWallHeight / tileScale);
    backWallUV[2] = new Vector4(0, 0, backWallDepth / tileScale, backWallHeight / tileScale);
    backWallUV[3] = new Vector4(0, 0, backWallDepth / tileScale, backWallHeight / tileScale);
    backWallUV[4] = new Vector4(0, 0, backWallWidth / tileScale, backWallDepth / tileScale);
    backWallUV[5] = new Vector4(0, 0, backWallWidth / tileScale, backWallDepth / tileScale);
    const backWall = MeshBuilder.CreateBox("backWall", {
      width: backWallWidth,
      height: backWallHeight,
      depth: backWallDepth,
      faceUV: backWallUV,
      wrap: true
    }, scene);
    backWall.position.set(0, GAME_CONFIG.FLOOR_LEVEL + GAME_CONFIG.WALL_HEIGHT / 2, -(GAME_CONFIG.TABLE_DEPTH / 2) - GAME_CONFIG.WATER_EXTRA_SPACE - GAME_CONFIG.WALL_THICKNESS / 2);
    backWall.material = materials.poolMaterial;
    this.shadowGenerator.addShadowCaster(backWall);
    backWall.freezeWorldMatrix();
    const frontWall = backWall.createInstance("frontWall");
    frontWall.position.z = GAME_CONFIG.TABLE_DEPTH / 2 + GAME_CONFIG.WATER_EXTRA_SPACE + GAME_CONFIG.WALL_THICKNESS / 2;
    this.shadowGenerator.addShadowCaster(frontWall);
    frontWall.freezeWorldMatrix();
    // --- SIDE WALLS ---
    const leftWallDepth = GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE;
    const leftWallHeight = GAME_CONFIG.WALL_HEIGHT;
    const leftWallWidth = GAME_CONFIG.WALL_THICKNESS;
    const sideWallUV: Vector4[] = new Array(6);
    sideWallUV[0] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallHeight / tileScale);
    sideWallUV[1] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallHeight / tileScale);
    sideWallUV[2] = new Vector4(0, 0, leftWallDepth / tileScale, leftWallHeight / tileScale);
    sideWallUV[3] = new Vector4(0, 0, leftWallDepth / tileScale, leftWallHeight / tileScale);
    sideWallUV[4] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallDepth / tileScale);
    sideWallUV[5] = new Vector4(0, 0, leftWallWidth / tileScale, leftWallDepth / tileScale);
    const leftWall = MeshBuilder.CreateBox("leftWall", {
      width: leftWallWidth,
      height: leftWallHeight,
      depth: leftWallDepth,
      faceUV: sideWallUV,
      wrap: true
    }, scene);
    leftWall.position.set(-(GAME_CONFIG.TABLE_WIDTH / 2 + GAME_CONFIG.WALL_THICKNESS / 2), GAME_CONFIG.FLOOR_LEVEL + leftWallHeight / 2, 0);
    leftWall.material = materials.poolMaterial;
    this.shadowGenerator.addShadowCaster(leftWall);
    leftWall.freezeWorldMatrix();
    const rightWall = leftWall.createInstance("rightWall");
    rightWall.position.x = GAME_CONFIG.TABLE_WIDTH / 2 + GAME_CONFIG.WALL_THICKNESS / 2;
    this.shadowGenerator.addShadowCaster(rightWall);
    rightWall.freezeWorldMatrix();
  }

  private _createPoolLights(scene: Scene, materials: Materials): void {
    const numLightsPerSide = LIGHT_SETTINGS.NUM_LIGHTS_PER_SIDE;
    const lightYPosition = GAME_CONFIG.WATER_LEVEL - 1;
    const wallLength = GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE;
    const lightSpacing = wallLength / (numLightsPerSide + 1);
    for (let i = 0; i < numLightsPerSide; i++) {
      const zPos = -wallLength / 2 + (i + 1) * lightSpacing;
      // Left
      const leftBoxPos = new Vector3(-(GAME_CONFIG.TABLE_WIDTH / 2 + 0.05), lightYPosition, zPos);
      const leftBox = MeshBuilder.CreateBox(`leftLightBox_${i}`, { width: 0.2, height: 0.3, depth: 0.5 }, scene);
      leftBox.material = materials.lightBoxMaterial;
      leftBox.position = leftBoxPos;
      leftBox.isPickable = false;
      leftBox.freezeWorldMatrix();
      const leftLight = new PointLight(`leftPoolLight_${i}`, leftBoxPos.add(new Vector3(0.15, 0, 0)), scene);
      leftLight.diffuse = LIGHT_SETTINGS.POOL_LIGHT_DIFFUSE;
      leftLight.intensity = LIGHT_SETTINGS.POOL_LIGHT_INTENSITY;
      leftLight.range = LIGHT_SETTINGS.POOL_LIGHT_RANGE;
      this.poolLights.push(leftLight);
      // Right (instance)
      const rightBoxPos = new Vector3((GAME_CONFIG.TABLE_WIDTH / 2) + 0.05, lightYPosition, zPos);
      const rightBox = leftBox.createInstance(`rightLightBox_${i}`);
      rightBox.position = rightBoxPos;
      rightBox.freezeWorldMatrix();
      const rightLight = new PointLight(`rightPoolLight_${i}`, rightBoxPos.add(new Vector3(-0.15, 0, 0)), scene);
      rightLight.diffuse = LIGHT_SETTINGS.POOL_LIGHT_DIFFUSE;
      rightLight.intensity = LIGHT_SETTINGS.POOL_LIGHT_INTENSITY;
      rightLight.range = LIGHT_SETTINGS.POOL_LIGHT_RANGE;
      this.poolLights.push(rightLight);
    }
  }

  private _createSurroundingGround(scene: Scene, materials: Materials): void {
    const groundSize = RENDERING_SETTINGS.GROUND_SIZE;
    const poolWidth = GAME_CONFIG.TABLE_WIDTH + 2 * GAME_CONFIG.WALL_THICKNESS;
    const poolDepth = GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE + 2 * GAME_CONFIG.WALL_THICKNESS;
    const groundY = GAME_CONFIG.FLOOR_LEVEL + GAME_CONFIG.WALL_HEIGHT - 0.3;
    const desiredTileSize = RENDERING_SETTINGS.GROUND_TILE_SIZE;
    const globalOriginX = -groundSize / 2;
    const globalOriginZ = -groundSize / 2;
    // --- Front strip ---
    const frontWidth = groundSize;
    const frontHeight = (groundSize - poolDepth) / 2;
    const frontGround = MeshBuilder.CreateGround("frontGround", { width: frontWidth, height: frontHeight }, scene);
    const frontOriginX = -frontWidth / 2;
    const frontOriginZ = poolDepth / 2 + (groundSize - poolDepth) / 4 - frontHeight / 2;
    const frontUOffset = (frontOriginX - globalOriginX) / desiredTileSize;
    const frontVOffset = (frontOriginZ - globalOriginZ) / desiredTileSize;
    frontGround.position.set(0, groundY, poolDepth / 2 + (groundSize - poolDepth) / 4);
    frontGround.material = materials.cloneAndScalePavementMaterial(
      "frontGroundMat",
      frontWidth / desiredTileSize,
      frontHeight / desiredTileSize,
      frontUOffset,
      frontVOffset
    );
    frontGround.isPickable = false;
    frontGround.receiveShadows = true;
    frontGround.freezeWorldMatrix();
    // --- Back strip ---
    const backWidth = groundSize;
    const backHeight = (groundSize - poolDepth) / 2;
    const backGround = MeshBuilder.CreateGround("backGround", { width: backWidth, height: backHeight }, scene);
    const backOriginX = -backWidth / 2;
    const backOriginZ = -poolDepth / 2 - (groundSize - poolDepth) / 4 - backHeight / 2;
    const backUOffset = (backOriginX - globalOriginX) / desiredTileSize;
    const backVOffset = (backOriginZ - globalOriginZ) / desiredTileSize;
    backGround.position.set(0, groundY, -poolDepth / 2 - (groundSize - poolDepth) / 4);
    backGround.material = materials.cloneAndScalePavementMaterial(
      "backGroundMat",
      backWidth / desiredTileSize,
      backHeight / desiredTileSize,
      backUOffset,
      backVOffset
    );
    backGround.isPickable = false;
    backGround.receiveShadows = true;
    backGround.freezeWorldMatrix();
    // --- Left strip ---
    const leftWidth = (groundSize - poolWidth) / 2;
    const leftHeight = poolDepth;
    const leftGround = MeshBuilder.CreateGround("leftGround", { width: leftWidth, height: leftHeight }, scene);
    const leftOriginX = -poolWidth / 2 - (groundSize - poolWidth) / 4 - leftWidth / 2;
    const leftOriginZ = -leftHeight / 2;
    const leftUOffset = (leftOriginX - globalOriginX) / desiredTileSize;
    const leftVOffset = (leftOriginZ - globalOriginZ) / desiredTileSize;
    leftGround.position.set(-poolWidth / 2 - (groundSize - poolWidth) / 4, groundY, 0);
    leftGround.material = materials.cloneAndScalePavementMaterial(
      "leftGroundMat",
      leftWidth / desiredTileSize,
      leftHeight / desiredTileSize,
      leftUOffset,
      leftVOffset
    );
    leftGround.isPickable = false;
    leftGround.receiveShadows = true;
    leftGround.freezeWorldMatrix();
    // --- Right strip ---
    const rightWidth = (groundSize - poolWidth) / 2;
    const rightHeight = poolDepth;
    const rightGround = MeshBuilder.CreateGround("rightGround", { width: rightWidth, height: rightHeight }, scene);
    const rightOriginX = poolWidth / 2 + (groundSize - poolWidth) / 4 - rightWidth / 2;
    const rightOriginZ = -rightHeight / 2;
    const rightUOffset = (rightOriginX - globalOriginX) / desiredTileSize;
    const rightVOffset = (rightOriginZ - globalOriginZ) / desiredTileSize;
    rightGround.position.set(poolWidth / 2 + (groundSize - poolWidth) / 4, groundY, 0);
    rightGround.material = materials.cloneAndScalePavementMaterial(
      "rightGroundMat",
      rightWidth / desiredTileSize,
      rightHeight / desiredTileSize,
      rightUOffset,
      rightVOffset
    );
    rightGround.isPickable = false;
    rightGround.receiveShadows = true;
    rightGround.freezeWorldMatrix();
  }

  private _createLadders(scene: Scene, materials: Materials): void {
    SceneLoader.ImportMeshAsync(
      "",
      "/pool_ladder/",
      "scene.gltf",
      scene
    ).then((result) => {
      const ladder1Root = result.meshes[0];
      const ladderMaterial = materials.ladderMaterial;
      ladder1Root.getChildMeshes().forEach(mesh => {
        mesh.material = ladderMaterial;
      });
      ladder1Root.position = new Vector3(-(GAME_CONFIG.TABLE_WIDTH / 2 - 0.1), 0.16, GAME_CONFIG.TABLE_DEPTH / 2 + 0.5);
      ladder1Root.rotationQuaternion = null;
      ladder1Root.rotation.y = Math.PI / 2;
      ladder1Root.freezeWorldMatrix();
      // 2nd ladder
      const ladder2Root = ladder1Root.instantiateHierarchy();
      if (ladder2Root) {
        ladder2Root.getChildMeshes().forEach(mesh => {
          mesh.material = ladderMaterial
        });
        ladder2Root.position = new Vector3(GAME_CONFIG.TABLE_WIDTH / 2 - 0.1, 0.16, -(GAME_CONFIG.TABLE_DEPTH / 2 + 0.5));
        ladder2Root.rotationQuaternion = null;
        ladder2Root.rotation.y = -Math.PI / 2;
        ladder2Root.freezeWorldMatrix();
      }
    });
  }

  _createWater(scene: Scene, materials: Materials): void {
    const waterPlane = MeshBuilder.CreateGround("waterPlane", { width: GAME_CONFIG.TABLE_WIDTH, height: GAME_CONFIG.TABLE_DEPTH + 2 * GAME_CONFIG.WATER_EXTRA_SPACE }, scene);
    waterPlane.material = materials.waterMaterial;
    waterPlane.position.y = GAME_CONFIG.WATER_LEVEL;
    waterPlane.receiveShadows = true;
  }

  // ----------------------
  // --- CLEANUP METHOD ---
  // ----------------------
  public dispose(): void {
    this.stopBackgroundMusic();

    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    window.removeEventListener("resize", this.resizeHandler);

    if (this.localGameEngine) this.localGameEngine.dispose();
    if (this.client) this.client.dispose();
    this.scoreboard.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}