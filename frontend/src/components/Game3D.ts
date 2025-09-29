/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";
export type GameMode = 'local' | 'online'; // TODO: add | 'tournament' | 'ai' ??

export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;
  private startButton?: HTMLElement;
  private loadingOverlay?: HTMLElement;
  private gameEndOverlay?: HTMLElement;
  private gameMode: GameMode;
  private player1Name?: string;
  private player2Name?: string;
  private player1Position: 1 | 2 = 1;
  private roomId?: string;
  private onReturnToMenuCallback?: () => void;

  constructor(
    container: HTMLElement,
    gameMode: 'local' | 'online' = 'online',
    player1Name?: string, // current user
    player2Name?: string, // opponent
    player1Position: 1 | 2 = 1,
    roomId?: string,
    onReturnToMenuCallback?: () => void
  ) {
    this.container = container;
    this.gameMode = gameMode;
    this.player1Name = player1Name;
    this.player2Name = player2Name;
    this.roomId = roomId;
    this.onReturnToMenuCallback = onReturnToMenuCallback;
  }

  initialize(): void {
    console.log('... Initializing 3D Game... Mode:', this.gameMode);
    this.createCanvas();
    this.setupUI();
    this.initializeScene();
  }

  private createCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none'; // Prevent touch scrolling

    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
  }

  private static readonly PONG_ASCII = [
    "_|_|_|      _|_|    _|      _|    _|_|_|",
    "_|    _|  _|    _|  _|_|    _|  _|      ",
    "_|_|_|    _|    _|  _|  _|  _|  _|  _|_|",
    "_|        _|    _|  _|    _|_|  _|    _|",
    "_|          _|_|    _|      _|    _|_|_|"
  ].join('\n');

  private setupUI(): void {
    this.loadingOverlay = document.createElement("div");
    this.loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
    `;

    this.loadingOverlay.innerHTML = `
      <div class="container-main-pink max-w-lg">
        <div class="text-center mb-8">
          <pre class="font-mono text-black text-1xl font-bold drop-shadow-lg">${Game3DComponent.PONG_ASCII}</pre>
        </div>
        <div>
          <div class="text-black font-mono text-2xl font-bold drop-shadow-lg animate-pulse text-center">
            Loading game...
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.loadingOverlay);

    this.startButton = document.createElement("div");
    this.startButton.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 20;
      cursor: pointer;
    `;

    this.startButton.innerHTML = `
      <div class="container-main-pink max-w-lg text-center">
        <div class="text-center mb-8">
          <pre class="font-mono text-black text-1xl font-bold drop-shadow-lg">${Game3DComponent.PONG_ASCII}</pre>
        </div>
        <p class="font-mono text-black text-3xl font-bold drop-shadow-lg mb-6">Ready to Play!</p>
        <div class="animate-pulse">
          <div class="text-black font-mono text-xl font-bold bg-green-800 text-white px-8 py-4 rounded-lg border-4 border-black">
            Click to Start Game
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.startButton);
    
    // Create game end overlay
    this.createGameEndOverlay();
  }



  private initializeScene(): void {
    try {
      this.poolScene = new PoolScene(this.canvas, this.gameMode, this.player1Name, this.player2Name, this.player1Position, this.roomId);
      
      // Set up game end callback
      this.poolScene.setOnGameEndCallback((finalState) => {
        this.showGameEndOverlay(finalState);
      });
      
      // Wait until PoolScene signals loaded
      this.poolScene.onLoaded(async () => {
        // Hide loading and show start button
        if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
        if (this.startButton) this.startButton.style.display = "flex";
      });

      // Start button click handler
      this.startButton?.addEventListener("click", async () => {
        if (!this.poolScene) return;
        this.startButton!.style.display = "none";
        await this.poolScene.startAnimation();
      });

    } catch (error) {
      console.error('Failed to initialize Babylon.js scene:', error);

      // Show error message
      if (this.loadingOverlay) {
        this.loadingOverlay.innerHTML = `
          <div style="color: red;">Failed to load game</div>
          <div style="font-size: 16px; margin-top: 10px;">
            WebGL may not be supported in your browser
          </div>
        `;
      }
    }
  }



  private createGameEndOverlay(): void {
    this.gameEndOverlay = document.createElement("div");
    this.gameEndOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 25;
    `;
    this.container.appendChild(this.gameEndOverlay);
  }

  private showGameEndOverlay(finalState: any): void {
    if (!this.gameEndOverlay) return;

    const winner = finalState.winner || "Unknown";
    const isLocalGame = this.gameMode === 'local';

    this.gameEndOverlay.innerHTML = `
      <div style="
        background: rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(10px) !important;
        border-radius: 12px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        padding: 24px !important;
        max-width: 448px !important;
        text-align: center !important;
        border: 4px solid black !important;
      ">
        <div style="margin-bottom: 24px !important;">
          <h2 style="font-family: monospace !important; color: white !important; font-size: 30px !important; font-weight: bold !important; margin-bottom: 8px !important;">🏆 Game Over!</h2>
          <p style="font-family: monospace !important; color: white !important; font-size: 20px !important; font-weight: bold !important;">${winner} Wins!</p>
        </div>
        
        <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          <button id="playAgainBtn" style="
            width: 100% !important;
            color: white !important;
            font-family: monospace !important;
            font-size: 18px !important;
            font-weight: bold !important;
            background: rgb(249, 115, 22) !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            border: 2px solid black !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          " onmouseover="this.style.background='rgb(234, 88, 12)'" onmouseout="this.style.background='rgb(249, 115, 22)'">
            🎮 Play Again
          </button>
          
          <button id="returnToMenuBtn" style="
            width: 100% !important;
            color: white !important;
            font-family: monospace !important;
            font-size: 18px !important;
            font-weight: bold !important;
            background: rgb(236, 72, 153) !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            border: 2px solid black !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          " onmouseover="this.style.background='rgb(219, 39, 119)'" onmouseout="this.style.background='rgb(236, 72, 153)'">
            🏠 Return to Menu
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const playAgainBtn = this.gameEndOverlay.querySelector('#playAgainBtn');
    const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');

    playAgainBtn?.addEventListener('click', () => {
      this.restartGameQuick();
    });

    returnToMenuBtn?.addEventListener('click', () => {
      if (this.onReturnToMenuCallback) {
        this.onReturnToMenuCallback();
      } else {
        // Fallback: redirect to home
        window.location.href = 'http://localhost:5173/';
      }
    });

    // Show the overlay
    this.gameEndOverlay.style.display = "flex";
  }

  private restartGameQuick(): void {
    // Hide game end overlay
    if (this.gameEndOverlay) {
      this.gameEndOverlay.style.display = "none";
    }

    // Reset the current scene without disposing it
    if (this.poolScene && this.gameMode === 'local') {
      // For local games, restart without animation
      this.poolScene.restartQuick();
    } else {
      // For online games, fall back to full restart
      this.restartGame();
    }
  }

  private restartGame(): void {
    // Hide game end overlay
    if (this.gameEndOverlay) {
      this.gameEndOverlay.style.display = "none";
    }

    // Dispose current scene
    if (this.poolScene) {
      this.poolScene.dispose();
      this.poolScene = undefined;
    }

    // Show loading overlay again
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = "flex";
    }

    // Reinitialize the scene
    this.initializeScene();
  }

  dispose(): void {
    if (this.poolScene) {
      this.poolScene.dispose();
    }

    // Remove UI elements
    if (this.loadingOverlay && this.loadingOverlay.parentElement) {
      this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
    }
    if (this.startButton && this.startButton.parentElement) {
      this.startButton.parentElement.removeChild(this.startButton);
    }
    if (this.gameEndOverlay && this.gameEndOverlay.parentElement) {
      this.gameEndOverlay.parentElement.removeChild(this.gameEndOverlay);
    }
  }
}