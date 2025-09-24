/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";
export type GameMode = 'local' | 'online';

export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;
  private startButton?: HTMLElement;
  private loadingOverlay?: HTMLElement;
  private gameMode: GameMode;
  private player1Name?: string;
  private player2Name?: string;

  constructor(
    container: HTMLElement,
    gameMode: 'local' | 'online' = 'online',
    player1Name?: string,
    player2Name?: string
  ) {
    this.container = container;
    this.gameMode = gameMode;
    this.player1Name = player1Name;
    this.player2Name = player2Name;
  }

  initialize(): void {
    console.log('Initializing 3D Game... Mode:', this.gameMode);
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
          <div class="text-black font-mono text-2xl font-bold drop-shadow-lg" style="text-align: left;">
            Loading game<span id="loading-dots" style="display: inline-block; width: 1.5em; text-align: left;"></span>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.loadingOverlay);
    this.startLoadingDotsAnimation();

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
  }

  private startLoadingDotsAnimation(): void {
    // Clear any existing interval first
    if (this.loadingDotsInterval) {
      clearInterval(this.loadingDotsInterval);
    }

    const dotsElement = document.getElementById('loading-dots');
    if (!dotsElement) return;

    let dotCount = 0;
    const maxDots = 3;

    this.loadingDotsInterval = setInterval(() => {
      // Check if element still exists (component not disposed)
      const currentDotsElement = document.getElementById('loading-dots');
      if (!currentDotsElement) {
        if (this.loadingDotsInterval) {
          clearInterval(this.loadingDotsInterval);
          this.loadingDotsInterval = undefined;
        }
        return;
      }

      dotCount++;
      dotCount = dotCount % (maxDots + 1);

      // Cycle through 0, 1, 2, 3, repeat
      if (dotCount === 0) {
        currentDotsElement.textContent = '';
      } else {
        currentDotsElement.textContent = '.'.repeat(dotCount);
      }
    }, 400);
  }

  private initializeScene(): void {
    try {
      const loadingStartTime = Date.now();
      const minimumLoadingTime = 8000; // Minimum 8 seconds loading screen

      this.poolScene = new PoolScene(this.canvas, this.gameMode, this.player1Name, this.player2Name);
      // Wait until PoolScene signals loaded
      this.poolScene.onLoaded(async () => {
        const loadingDuration = Date.now() - loadingStartTime;
        const remainingTime = minimumLoadingTime - loadingDuration;

        if (remainingTime > 0) {
          console.log(`Loading finished early, waiting ${remainingTime}ms more to show animation...`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // Hide loading and show start button
        if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
        if (this.startButton) this.startButton.style.display = "flex";

        // **Clean up the dots animation when we actually hide the loading**
        if (this.loadingDotsInterval) {
         clearInterval(this.loadingDotsInterval);
        }
      });

      // Start button click handler
      this.startButton?.addEventListener("click", async () => {
        if (!this.poolScene) return;
        this.startButton!.style.display = "none";
        await this.poolScene.startGame();
      });

    } catch (error) {
      console.error('Failed to initialize Babylon.js scene:', error);

      // Clean up dots animation on error too
      if (this.loadingDotsInterval) {
        clearInterval(this.loadingDotsInterval);
      }

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

  private loadingDotsInterval?: number;

  dispose(): void {
    if (this.loadingDotsInterval) {
      clearInterval(this.loadingDotsInterval);
      this.loadingDotsInterval = undefined;
    }
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
  }
}