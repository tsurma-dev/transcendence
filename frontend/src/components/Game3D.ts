import { PoolScene } from "../babylon/PoolScene";
export type GameMode = 'local' | 'online';

export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;
  private startButton?: HTMLButtonElement;
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

  // **NEW: Add initialize method to be called externally**
  initialize(): void {
    this.createCanvas();
    this.setupUI();
    this.initializeScene();
  }

  private createCanvas(): void {
    // **CREATE CANVAS ELEMENT PROPERLY**
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none'; // Prevent touch scrolling

    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
  }

  private setupUI(): void {
    // 0️⃣ Create loading overlay with QuickPlay-style design
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

    // **NEW: Use your design system styling like QuickPlay**
    this.loadingOverlay.innerHTML = `
      <div class="container-main-pink max-w-lg">
        <div class="text-center mb-8">
          <pre class="font-mono text-black text-1xl font-bold drop-shadow-lg">
  _|_|_|      _|_|    _|      _|    _|_|_|
  _|    _|  _|    _|  _|_|    _|  _|      
  _|_|_|    _|    _|  _|  _|  _|  _|  _|_|
  _|        _|    _|  _|    _|_|  _|    _|
  _|          _|_|    _|      _|    _|_|_|</pre>
        </div>
        <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-4">Loading Game...</p>
        <div class="animate-pulse">
          <div class="text-black font-mono text-lg">Please wait</div>
        </div>
      </div>
    `;

    this.container.appendChild(this.loadingOverlay);

    // 2️⃣ Start button overlay (hidden initially) - keep existing styling
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start Game";
    this.startButton.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 15px 30px;
      font-size: 24px;
      border: none;
      border-radius: 12px;
      background:rgb(13, 29, 14);
      color: white;
      cursor: pointer;
      z-index: 10;
      display: none;
    `;
    this.container.appendChild(this.startButton);
  }

  private initializeScene(): void {
    try {
      this.poolScene = new PoolScene(this.canvas, this.gameMode, this.player1Name, this.player2Name);

      // Wait until PoolScene signals loaded
      this.poolScene.onLoaded(() => {
        if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
        if (this.startButton) this.startButton.style.display = "block";
      });

      // Start button click handler
      this.startButton?.addEventListener("click", async () => {
        if (!this.poolScene) return;

        // Hide Start button
        this.startButton!.style.display = "none";

        // Start game logic
        await this.poolScene.startGame();
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


  // **ADD DISPOSE METHOD**
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
  }
}