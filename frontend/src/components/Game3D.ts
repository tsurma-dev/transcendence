/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";

export type GameMode = 'local' | 'joinRoom' | 'createRoom' | 'AI';

/**
 * Game3D Component with organized overlay system:
 * 
 * Full Screen Overlays (z-index 20-25):
 * - loadingOverlay: Shows while game assets are loading (for all game modes)
 * - roomCreatedOverlay: Shows room ID while waiting for player 2 to join
 * 
 * Pop-up Overlays (z-index 30+, with game visible in background):
 * - gameEndOverlay: Shows game over screen with winner and options
 * - disconnected popup: Uses gameEndOverlay to show disconnection messages
 * 
 * UI Elements:
 * - quitButton: Fixed position quit button for active games
 * 
 * Code Organization:
 * - OVERLAY CREATION METHODS: Create DOM elements for all overlays
 * - GAME FLOW METHODS: Main game lifecycle and initialization
 * - OVERLAY DISPLAY METHODS: Show/hide overlay screens and handle UI state
 * - CALLBACK SETUP METHODS: Configure PoolScene event handlers and callbacks
 * - GAME INITIALIZATION METHODS: Asset loading and game mode setup
 * - UTILITY METHODS: Helper functions and error handling
 * - POP-UP OVERLAY METHODS: Modal overlay content and behavior
 */
export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;
  
  // Full screen overlays
  private loadingOverlay?: HTMLElement;
  private roomCreatedOverlay?: HTMLElement;
  
  // Pop-up overlays (with game in background)
  private gameEndOverlay?: HTMLElement; // also used for disconnection messages

  // Game parameters
  private gameMode: GameMode;
  private player1Name: string; // current user
  private player2Name?: string; // opponent (optional - only provided for local games)
  private roomId?: string; // room ID for joinRoom
  private onReturnToMenuCallback?: () => void;

  constructor(
    container: HTMLElement,
    player1Name: string, // current user (required)
    gameMode: GameMode, // game mode (required)
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
    // === Full Screen Overlays ===
    this.createLoadingOverlay();
    this.createRoomCreatedOverlay();
    
    // === Pop-up Overlays ===
    this.createGameEndOverlay();
    
    // === UI Elements ===
    this.createQuitButton();
  }

  // ============================================================================
  // OVERLAY CREATION METHODS
  // ============================================================================

  private createLoadingOverlay(): void {
    this.loadingOverlay = this.createBaseOverlay(20);
    this.loadingOverlay.style.display = 'flex'; // Loading overlay starts visible
    this.loadingOverlay.innerHTML = this.createPongContentWrapper(`
      <div>
        <div class="text-black font-mono text-2xl font-bold drop-shadow-lg animate-pulse text-center mb-6">
          Loading game assets...
        </div>
      </div>
    `);
    
    this.container.appendChild(this.loadingOverlay);
  }

  private createRoomCreatedOverlay(): void {
    this.roomCreatedOverlay = this.createBaseOverlay(25);
    this.container.appendChild(this.roomCreatedOverlay);
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

  private createGameEndOverlay(): void {
    this.gameEndOverlay = document.createElement("div");
    this.gameEndOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 30;
    `;
    this.container.appendChild(this.gameEndOverlay);
  }

  private createQuitButton(): void {
  
    const quitButton = document.createElement('button');
    quitButton.id = 'quit-button';
    quitButton.innerHTML = 'Quit';
    quitButton.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
      background-color: #000000;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      display: none;
    `;
    
    quitButton.addEventListener('mouseenter', () => {
      quitButton.style.backgroundColor = '#374151';
    });
    
    quitButton.addEventListener('mouseleave', () => {
      quitButton.style.backgroundColor = '#000000';
    });
    
    quitButton.addEventListener('click', () => {
      this.showQuitConfirmation();
    });
    
    document.body.appendChild(quitButton);

    // Create confirmation overlay
    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'quit-confirmation-overlay';
    confirmOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    `;
    
    const confirmContent = document.createElement('div');
    confirmContent.style.cssText = `
      background-color: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
      max-width: 400px;
    `;
    
    const confirmTitle = document.createElement('h3');
    confirmTitle.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #374151;
    `;
    confirmTitle.textContent = 'Quit Game?';
    
    const confirmMessage = document.createElement('p');
    confirmMessage.style.cssText = `
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.5;
    `;
    confirmMessage.textContent = 'Are you sure you want to quit the game and return to menu?';
    
    const confirmButtons = document.createElement('div');
    confirmButtons.style.cssText = `
      display: flex;
      gap: 16px;
      justify-content: center;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.style.cssText = `
      padding: 8px 24px;
      background-color: #d1d5db;
      color: #374151;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.backgroundColor = '#9ca3af';
    });
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.backgroundColor = '#d1d5db';
    });
    cancelButton.addEventListener('click', () => {
      this.hideQuitConfirmation();
    });
    
    const confirmQuitButton = document.createElement('button');
    confirmQuitButton.style.cssText = `
      padding: 8px 24px;
      background-color: #ec4899;
      color: white;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    confirmQuitButton.textContent = 'Quit';
    confirmQuitButton.addEventListener('mouseenter', () => {
      confirmQuitButton.style.backgroundColor = '#db2777';
    });
    confirmQuitButton.addEventListener('mouseleave', () => {
      confirmQuitButton.style.backgroundColor = '#ec4899';
    });
    confirmQuitButton.addEventListener('click', async () => {
      this.hideQuitConfirmation();
      await this.returnToMainMenu();
    });
    
    confirmButtons.appendChild(cancelButton);
    confirmButtons.appendChild(confirmQuitButton);
    
    confirmContent.appendChild(confirmTitle);
    confirmContent.appendChild(confirmMessage);
    confirmContent.appendChild(confirmButtons);
    confirmOverlay.appendChild(confirmContent);
    
    document.body.appendChild(confirmOverlay);
  }

  // ============================================================================
  // GAME FLOW METHODS
  // ============================================================================

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

    private async startLocalGame(): Promise<void> {
    console.log('🎮 Setting up local game');
    
    try {
      // Create PoolScene for local game
      this.poolScene = new PoolScene(this.canvas, 'local', this.player1Name, this.player2Name);
      
      // Set up callbacks
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load completely (keep loading screen visible)
      await this.waitForAssetsToLoadLocal();
      
      // Start the game - loading screen will be hidden when camera intro begins
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
      this.showRoomCreatedScreen();
      
      // Start the online game flow (PoolScene will handle server communication)
      await this.poolScene.startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize createRoom game:', error);
      this.showError('Failed to create room');
    }
  }

  private async startJoinRoomGame(): Promise<void> {
    // Prevent multiple initializations
    if (this.poolScene) {
      return;
    }
    
    try {
      if (!this.roomId) {
        throw new Error('Room ID is required for joinRoom mode');
      }
      
      // Create PoolScene for online game in joinRoom mode with specific room ID
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name, undefined, this.roomId);
      
      // Set up callbacks
      this.setupPoolSceneCallbacks();
      
      // Wait for assets to load (loading screen stays visible)
      await this.waitForAssetsToLoad();
      
      // Start the online game flow (PoolScene will handle server communication)
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

  // ============================================================================
  // OVERLAY DISPLAY METHODS
  // ============================================================================

  private showLoadingScreen(): void {
    this.hideQuitButton();
    if (this.loadingOverlay) this.loadingOverlay.style.display = "flex";
    if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
  }

  private hideLoadingScreen(): void {
    if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
    
    // Show quit button for local games when loading screen is hidden
    if (this.gameMode === 'local') {
      this.showQuitButton();
    }
  }

  private showRoomCreatedScreen(roomId?: string): void {
    if (!this.roomCreatedOverlay) return;
    
    this.hideQuitButton();
    
    // Show empty room ID initially, will be updated when received from server
    const displayRoomId = roomId || '------';
    
    this.roomCreatedOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">Room Created!</p>
      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Room ID:</p>
        <div class="relative">
          <div class="w-full bg-black text-white font-mono text-2xl font-bold px-8 py-3 rounded border-4 border-black text-center">
            <span id="roomIdDisplay">${displayRoomId}</span>
          </div>
          <button 
            id="copyRoomIdBtn" 
            class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-500 text-sm transition-colors duration-150" 
            title="Copy Room ID"
          >
            🔗
          </button>
        </div>
      </div>
      <div class="animate-pulse mb-6">
        <p class="font-mono text-black text-lg font-bold">Waiting for Player 2...</p>
      </div>
      <div class="space-y-4">
        <button 
          id="backToMenuFromWaitingBtn" 
          class="w-full px-6 py-4 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white font-bold text-lg rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider"
        >
          ← Back
        </button>
      </div>
    `);
    
    this.roomCreatedOverlay.style.display = "flex";
    
    // Add event listeners
    const copyBtn = this.roomCreatedOverlay.querySelector('#copyRoomIdBtn');
    const backBtn = this.roomCreatedOverlay.querySelector('#backToMenuFromWaitingBtn');
    
    copyBtn?.addEventListener('click', () => {
      const roomIdElement = document.getElementById('roomIdDisplay');
      if (roomIdElement) {
        const roomId = roomIdElement.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(roomId).then(() => {
            // Visual feedback
            copyBtn.textContent = '✅';
            setTimeout(() => {
              copyBtn.textContent = '🔗';
            }, 1000);
          }).catch(() => {
            // Fallback for older browsers
            alert(`Room ID: ${roomId}\nCopy this manually!`);
          });
        } else {
          // Fallback for older browsers
          alert(`Room ID: ${roomId}\nCopy this manually!`);
        }
      }
    });
    
    backBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });
  }

  // ============================================================================
  // CALLBACK SETUP METHODS
  // ============================================================================

  private setupPoolSceneCallbacks(): void {
    if (!this.poolScene) return;
    
    // Always set up game end callback
    this.poolScene.setOnGameEndCallback((finalState) => {
      this.hideQuitButton();
      this.showGameEndOverlay(finalState);
    });
    
    // Always set up game failed callback for online games
    this.poolScene.setOnGameFailedCallback((message) => {
      this.hideQuitButton();
      this.handleGameFailure(message);
    });
    
    // Set up mode-specific callbacks
    if (this.gameMode === 'local') {
      // For local games, hide loading screen when camera intro starts
      this.poolScene.setOnGameStartCallback(() => {
        this.hideLoadingScreen();
        this.showQuitButton();
      });
    } else if (this.gameMode === 'AI') {
      // For AI games, hide loading screen when game starts
      this.poolScene.setOnGameStartCallback(() => {
        this.hideLoadingScreen();
        this.showQuitButton();
      });
    } else if (this.gameMode === 'createRoom' || this.gameMode === 'joinRoom') {
      // Only set up multiplayer callbacks for online modes
      this.setupOnlineCallbacks();
    }
  }

  private setupOnlineCallbacks(): void {
    if (!this.poolScene) return;
    
    // Game start callback to hide waiting screens
    this.poolScene.setOnGameStartCallback(() => {
      if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
      if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
      this.showQuitButton();
    });
    
    // Room ID callback for createRoom mode
    if (this.gameMode === 'createRoom') {
      this.poolScene.setOnRoomIdCallback((roomId) => {
        this.updateRoomId(roomId);
      });
    }
  }

  // ============================================================================
  // GAME INITIALIZATION METHODS
  // ============================================================================

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


  public handleGameFailure(message: string): void {
    console.log('🚨 Game failure received:', message);
    
    // Stop all animations and dispose of the PoolScene immediately
    if (this.poolScene) {
      this.poolScene.dispose();
      this.poolScene = undefined;
    }
    
    // Hide all other overlays
    if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
    if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
    
    // Show the disconnect overlay with the message
    this.showDisconnectOverlay(message);
  }



  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

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

  public updateRoomId(roomId: string): void {
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    if (roomIdDisplay) {
      roomIdDisplay.textContent = roomId;
    }
  }

  // ============================================================================
  // POP-UP OVERLAY METHODS (appear over game with backdrop)
  // ============================================================================

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
          <h2 style="font-family: monospace !important; color: white !important; font-size: 30px !important; font-weight: bold !important; margin-bottom: 8px !important;">🏆 Game Over</h2>
          <p style="font-family: monospace !important; color: white !important; font-size: 20px !important; font-weight: bold !important;">${winner} Wins!</p>
        </div>
        
        <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          ${isLocalGame ? `
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
          ` : ''}
          
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

    // Only add Play Again listener for local games
    if (isLocalGame && playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.restartLocalGame();
      });
    }

    returnToMenuBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });

    // Show the overlay
    this.gameEndOverlay.style.display = "flex";
  }

  private showDisconnectOverlay(message: string): void {
    if (!this.gameEndOverlay) return;

    // Hide quit button when showing disconnect overlay
    this.hideQuitButton();

    // Increase z-index to ensure it's above animations and other content
    this.gameEndOverlay.style.zIndex = '9999';
    
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
          <h2 style="font-family: monospace !important; color: #ef4444 !important; font-size: 30px !important; font-weight: bold !important; margin-bottom: 8px !important;">⚠️ Connection Lost</h2>
          <p style="font-family: monospace !important; color: white !important; font-size: 18px !important; font-weight: bold !important;">${message}</p>
        </div>
        
        <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
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

    // Add event listener for return to menu
    const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
    returnToMenuBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });

    // Show the overlay
    this.gameEndOverlay.style.display = "flex";
  }

  private restartLocalGame(): void {
    // Only available for local games
    if (this.gameMode !== 'local' || !this.poolScene) return;

    // Hide game end overlay
    if (this.gameEndOverlay) {
      this.gameEndOverlay.style.display = "none";
    }

    // Reset the current scene without disposing it
    this.poolScene.restartQuick();
    
    // Show quit button again after restart
    this.showQuitButton();
  }

  private async returnToMainMenu(): Promise<void> {
    // Hide quit button when returning to menu
    this.hideQuitButton();
    
    // Use the callback if provided
    if (this.onReturnToMenuCallback) {
      this.onReturnToMenuCallback();
      return;
    }

    // If no callback is provided, show an error
    console.error('No return to menu callback provided! This should be handled by the parent screen.');
    alert('Unable to return to menu. Please refresh the page.');
  }

  private showQuitConfirmation(): void {
    const overlay = document.getElementById('quit-confirmation-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }

  private hideQuitConfirmation(): void {
    const overlay = document.getElementById('quit-confirmation-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  private showQuitButton(): void {
    const quitButton = document.getElementById('quit-button');
    if (quitButton) {
      quitButton.style.display = 'block';
    }
  }

  private hideQuitButton(): void {
    const quitButton = document.getElementById('quit-button');
    if (quitButton) {
      quitButton.style.display = 'none';
    }
  }

  // ===========================================================================  
  // DISPOSE METHOD
  // ===========================================================================
  dispose(): void {
    if (this.poolScene) {
      this.poolScene.dispose();
    }

    // Remove UI elements
    if (this.loadingOverlay && this.loadingOverlay.parentElement) {
      this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
    }
    if (this.roomCreatedOverlay && this.roomCreatedOverlay.parentElement) {
      this.roomCreatedOverlay.parentElement.removeChild(this.roomCreatedOverlay);
    }
    if (this.gameEndOverlay && this.gameEndOverlay.parentElement) {
      this.gameEndOverlay.parentElement.removeChild(this.gameEndOverlay);
    }
    
    // Clean up quit button and confirmation overlay
    const quitButton = document.getElementById('quit-button');
    if (quitButton && quitButton.parentElement) {
      quitButton.parentElement.removeChild(quitButton);
    }
    
    const quitConfirmOverlay = document.getElementById('quit-confirmation-overlay');
    if (quitConfirmOverlay && quitConfirmOverlay.parentElement) {
      quitConfirmOverlay.parentElement.removeChild(quitConfirmOverlay);
    }
  }
}