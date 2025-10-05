/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";

export type GameMode = 'local' | 'joinRoom' | 'createRoom' | 'AI';

export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;
  private loadingOverlay?: HTMLElement;
  private waitingOverlay?: HTMLElement;
  private roomInputOverlay?: HTMLElement;
  private gameEndOverlay?: HTMLElement;
  private gameMode: GameMode;
  private player1Name: string; // current user
  private player2Name?: string; // opponent (optional - only provided for local games)
  private roomId?: string; // room ID for joinRoom
  private onReturnToMenuCallback?: () => void;

  constructor(
    container: HTMLElement,
    player1Name: string, // current user (required)
    gameMode: GameMode = 'local', // game mode (required)
    player2Name?: string, // opponent (optional, only for local)
    roomId?: string, // room ID (optional, only for joinRoom)
    onReturnToMenuCallback?: () => void
  ) {
    this.container = container;
    this.player1Name = player1Name;
    this.gameMode = gameMode;
    this.player2Name = player2Name;
    this.roomId = roomId;
    this.onReturnToMenuCallback = onReturnToMenuCallback;
  }

  initialize(): void {
    console.log('🎮 Initializing 3D Game - Mode:', this.gameMode, 'Player1:', this.player1Name, 'Player2:', this.player2Name, 'RoomID:', this.roomId);
    this.createCanvas();
    this.setupUI();
    this.startGameFlow();
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
    // Create all overlays
    this.createLoadingOverlay();
    this.createWaitingOverlay();
    this.createRoomInputOverlay();
    this.createGameEndOverlay();
  }

  private createLoadingOverlay(): void {
    this.loadingOverlay = this.createBaseOverlay(20);
    this.loadingOverlay.style.display = 'flex'; // Loading overlay starts visible
    this.loadingOverlay.innerHTML = this.createPongContentWrapper(`
      <div>
        <div class="text-black font-mono text-2xl font-bold drop-shadow-lg animate-pulse text-center">
          Loading game assets...
        </div>
      </div>
    `);
    this.container.appendChild(this.loadingOverlay);
  }

  private createBaseOverlay(zIndex: number): HTMLElement {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: ${zIndex};
    `;
    return overlay;
  }

  private createPongContentWrapper(content: string): string {
    return `
      <div class="container-main-pink max-w-lg text-center">
        <div class="text-center mb-8">
          <pre class="font-mono text-black text-1xl font-bold drop-shadow-lg">${Game3DComponent.PONG_ASCII}</pre>
        </div>
        ${content}
      </div>
    `;
  }


  private createWaitingOverlay(): void {
    this.waitingOverlay = this.createBaseOverlay(25);
    this.container.appendChild(this.waitingOverlay);
  }

  private createRoomInputOverlay(): void {
    this.roomInputOverlay = this.createBaseOverlay(25);
    this.container.appendChild(this.roomInputOverlay);
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

  private async startGameFlow(): Promise<void> {
    console.log('🚀 Starting game flow for mode:', this.gameMode);
    
    // Show loading screen while assets load
    this.showLoadingScreen();
    
    switch (this.gameMode) {
      case 'local':
        await this.startLocalGame();
        break;
      case 'createRoom':
        await this.startCreateRoomGame();
        break;
      case 'joinRoom':
        await this.startJoinRoomGame();
        break;
      case 'AI':
        await this.startAIGame();
        break;
    }
  }

  private showLoadingScreen(): void {
    if (this.loadingOverlay) this.loadingOverlay.style.display = "flex";
    if (this.waitingOverlay) this.waitingOverlay.style.display = "none";
    if (this.roomInputOverlay) this.roomInputOverlay.style.display = "none";
  }

  private hideLoadingScreen(): void {
    if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
  }

  private setupPoolSceneCallbacks(): void {
    if (!this.poolScene) return;
    
    // Always set up game end callback
    this.poolScene.setOnGameEndCallback((finalState) => {
      this.showGameEndOverlay(finalState);
    });
    
    // Set up mode-specific callbacks
    if (this.gameMode === 'AI') {
      // For AI games, hide loading screen when game starts
      this.poolScene.setOnGameStartCallback(() => {
        this.hideLoadingScreen();
      });
    } else if (this.gameMode === 'createRoom' || this.gameMode === 'joinRoom') {
      // Only set up multiplayer callbacks for online modes
      this.setupOnlineCallbacks();
    }
  }

  private setupOnlineCallbacks(): void {
    if (!this.poolScene) return;
    
    // Error handling for online games
    this.poolScene.setOnErrorCallback((error) => {
      console.log('🚫 Game error received:', error);
      if (error.includes('Room not found')) {
        if (this.waitingOverlay) this.waitingOverlay.style.display = "none";
        this.showRoomInputScreen();
      } else {
        alert(`Game error: ${error}`);
        this.returnToMainMenu();
      }
    });
    
    // Game start callback to hide waiting screens
    this.poolScene.setOnGameStartCallback(() => {
      if (this.waitingOverlay) this.waitingOverlay.style.display = "none";
      if (this.roomInputOverlay) this.roomInputOverlay.style.display = "none";
    });
    
    // Room ID callback for createRoom mode
    if (this.gameMode === 'createRoom') {
      this.poolScene.setOnRoomIdCallback((roomId) => {
        this.updateRoomId(roomId);
      });
    }
  }

  private async waitForAssetsToLoad(): Promise<void> {
    if (!this.poolScene) throw new Error('PoolScene not initialized');
    
    return new Promise<void>((resolve) => {
      this.poolScene!.onLoaded(() => {
        this.hideLoadingScreen();
        resolve();
      });
    });
  }

  private async waitForAssetsToLoadLocal(): Promise<void> {
    if (!this.poolScene) throw new Error('PoolScene not initialized');
    
    return new Promise<void>((resolve) => {
      this.poolScene!.onLoaded(() => {
        // Don't hide loading screen yet for local games - wait for animation to start
        resolve();
      });
    });
  }

  private async startLocalGame(): Promise<void> {
    console.log('🎮 Setting up local game');
    
    try {
      // Create PoolScene for local game
      this.poolScene = new PoolScene(this.canvas, 'local', this.player1Name, this.player2Name);
      
      // Set up callbacks
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load (but keep loading screen visible)
      await this.waitForAssetsToLoadLocal();
      
      // Hide loading screen just before animation starts
      this.hideLoadingScreen();
      
      // Start the game immediately for local mode
      await this.poolScene.startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize local game:', error);
      this.showError('Failed to load local game');
    }
  }

  private async startCreateRoomGame(): Promise<void> {
    console.log('🌐 Setting up createRoom game');
    
    try {
      // Create PoolScene for online game in createRoom mode
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name);
      
      // Set up callbacks
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load
      await this.waitForAssetsToLoad();
      
      // Show appropriate waiting screen based on mode
      this.showWaitingForPlayerScreen();
      
      // Start the online game flow (PoolScene will handle server communication)
      await this.poolScene.startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize createRoom game:', error);
      this.showError('Failed to create room');
    }
  }

  private async startJoinRoomGame(): Promise<void> {
    console.log('🔗 Setting up joinRoom game');
    
    try {
      if (!this.roomId) {
        // Show room input screen
        this.showRoomInputScreen();
        return;
      }
      
      // Create PoolScene for online game in joinRoom mode with specific room ID
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name, undefined, this.roomId);
      
      // Set up callbacks
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load
      await this.waitForAssetsToLoad();
      
      // Only show waiting screen if it's not already shown (from room input)
      if (!this.waitingOverlay || this.waitingOverlay.style.display === "none") {
        this.showWaitingForConnectionScreen();
      }
      
      // Start the online game flow (PoolScene will handle server communication)
      // This should happen in background while showing the waiting screen
      this.poolScene.startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize joinRoom game:', error);
      this.showError('Failed to join room');
    }
  }

  private async startAIGame(): Promise<void> {
    console.log('🤖 Setting up AI game');
    
    try {
      // Create PoolScene for AI game using online mode
      this.poolScene = new PoolScene(this.canvas, 'AI', this.player1Name, 'AI');
      
      // Set up callbacks (same as online games)
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load (but keep loading screen visible for AI)
      await this.waitForAssetsToLoadLocal();
      
      // For AI games, we keep showing loading until the game starts
      // No waiting screen needed since AI is immediate
      
      // Start the AI game flow (PoolScene will handle server communication)
      await this.poolScene.startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize AI game:', error);
      this.showError('Failed to load AI game');
    }
  }

  private showWaitingForPlayerScreen(roomId?: string): void {
    if (!this.waitingOverlay) return;
    
    // Show empty room ID initially, will be updated when received from server
    const displayRoomId = roomId || '------';
    
    this.waitingOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">Room Created!</p>
      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Room ID:</p>
        <div class="bg-black text-white font-mono text-2xl font-bold px-4 py-2 rounded border-4 border-black">
          <span id="roomIdDisplay">${displayRoomId}</span>
        </div>
      </div>
      <div class="animate-pulse">
        <p class="font-mono text-black text-lg font-bold">Waiting for Player 2...</p>
      </div>
    `);
    
    this.waitingOverlay.style.display = "flex";
  }

  public updateRoomId(roomId: string): void {
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    if (roomIdDisplay) {
      roomIdDisplay.textContent = roomId;
    }
  }

  private showWaitingForConnectionScreen(): void {
    if (!this.waitingOverlay) return;
    
    this.waitingOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">Joining Room</p>
      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Room ID:</p>
        <div class="bg-black text-white font-mono text-2xl font-bold px-4 py-2 rounded border-4 border-black">
          ${this.roomId}
        </div>
      </div>
      <div class="animate-pulse">
        <p class="font-mono text-black text-lg font-bold">Connecting...</p>
      </div>
    `);
    
    this.waitingOverlay.style.display = "flex";
  }

  private showRoomInputScreen(): void {
    if (!this.roomInputOverlay) return;
    
    this.roomInputOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">Join Room</p>
      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Enter Room ID:</p>
        <input 
          id="roomIdInput" 
          type="text" 
          class="bg-white text-black font-mono text-2xl font-bold px-4 py-2 rounded border-4 border-black text-center"
          placeholder="ABC123"
          maxlength="6"
        />
      </div>
      <div class="flex gap-4">
        <button 
          id="joinRoomBtn" 
          class="flex-1 text-white font-mono text-lg font-bold bg-green-600 px-6 py-3 rounded border-4 border-black cursor-pointer hover:bg-green-700"
        >
          Join Room
        </button>
        <button 
          id="cancelBtn" 
          class="flex-1 text-white font-mono text-lg font-bold bg-red-600 px-6 py-3 rounded border-4 border-black cursor-pointer hover:bg-red-700"
        >
          Cancel
        </button>
      </div>
    `);
    
    // Add event listeners
    const joinBtn = this.roomInputOverlay.querySelector('#joinRoomBtn');
    const cancelBtn = this.roomInputOverlay.querySelector('#cancelBtn');
    const roomInput = this.roomInputOverlay.querySelector('#roomIdInput') as HTMLInputElement;
    
    joinBtn?.addEventListener('click', () => {
      const roomId = roomInput.value.trim().toLowerCase();
      if (roomId.length >= 3) {
        this.roomId = roomId;
        this.roomInputOverlay!.style.display = "none";
        this.showWaitingForConnectionScreen();
        this.startJoinRoomGame();
      } else {
        alert('Please enter a valid room ID (at least 3 characters)');
      }
    });
    
    cancelBtn?.addEventListener('click', () => {
      this.returnToMainMenu();
    });
    
    // Handle Enter key
    roomInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        (joinBtn as HTMLButtonElement)?.click();
      }
    });
    
    this.hideLoadingScreen();
    this.roomInputOverlay.style.display = "flex";
    
    // Focus the input
    setTimeout(() => roomInput?.focus(), 100);
  }

  private showError(message: string): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.innerHTML = this.createPongContentWrapper(`
        <div style="color: red;" class="font-mono text-xl font-bold">
          ${message}
        </div>
        <div class="mt-4">
          <button 
            id="retryBtn" 
            class="text-white font-mono text-lg font-bold bg-blue-600 px-6 py-3 rounded border-4 border-black cursor-pointer hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      `);
      
      const retryBtn = this.loadingOverlay.querySelector('#retryBtn');
      retryBtn?.addEventListener('click', () => {
        this.startGameFlow();
      });
    }
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
      this.returnToMainMenu();
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
    this.startGameFlow();
  }

  private returnToMainMenu(): void {
    // Use the callback if provided
    if (this.onReturnToMenuCallback) {
      this.onReturnToMenuCallback();
      return;
    }

    // If no callback is provided, show an error
    console.error('No return to menu callback provided! This should be handled by the parent screen.');
    alert('Unable to return to menu. Please refresh the page.');
  }

  dispose(): void {
    if (this.poolScene) {
      this.poolScene.dispose();
    }

    // Remove UI elements
    if (this.loadingOverlay && this.loadingOverlay.parentElement) {
      this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
    }
    if (this.waitingOverlay && this.waitingOverlay.parentElement) {
      this.waitingOverlay.parentElement.removeChild(this.waitingOverlay);
    }
    if (this.roomInputOverlay && this.roomInputOverlay.parentElement) {
      this.roomInputOverlay.parentElement.removeChild(this.roomInputOverlay);
    }
    if (this.gameEndOverlay && this.gameEndOverlay.parentElement) {
      this.gameEndOverlay.parentElement.removeChild(this.gameEndOverlay);
    }
  }
}