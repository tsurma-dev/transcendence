/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";

export type GameMode = 'local' | 'joinRoom' | 'createRoom' | 'AI' | 'tournament';

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
  private tournamentConnectingOverlay?: HTMLElement;
  private tournamentLobbyOverlay?: HTMLElement;

  // Pop-up overlays (with game in background)
  private gameEndOverlay?: HTMLElement; // also used for disconnection messages

  // Game parameters
  private gameMode: GameMode;
  private player1Name: string; // current user
  private player2Name?: string; // opponent (optional - only provided for local games)
  private roomId?: string; // room ID for joinRoom
  private onReturnToMenuCallback?: () => void;

  // Tournament state
  private tournamentPlayers: string[] = [];
  private tournamentState: string = 'waiting';
  private tournamentRoomId?: string; // Room ID for tournament game

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
    this.createTournamentConnectingOverlay();
    this.createTournamentLobbyOverlay();

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

  private createTournamentConnectingOverlay(): void {
    this.tournamentConnectingOverlay = document.createElement("div");
    this.tournamentConnectingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 25;
    `;
    this.container.appendChild(this.tournamentConnectingOverlay);
  }

  private createTournamentLobbyOverlay(): void {
    this.tournamentLobbyOverlay = document.createElement("div");
    this.tournamentLobbyOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
      display: none;
      overflow-y: auto;
      z-index: 25;
    `;
    this.container.appendChild(this.tournamentLobbyOverlay);
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
      case 'tournament':
        await this.startTournamentMode();
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

  private async startTournamentMode(): Promise<void> {
    console.log('🏆 Setting up tournament mode');

    try {
      // Show tournament connecting screen first
      this.showTournamentConnectingScreen();

      // Create PoolScene for tournament - PoolScene will handle all tournament logic
      this.poolScene = new PoolScene(this.canvas, 'tournament', this.player1Name);

      // Set up callbacks - this will listen for tournament data from server
      this.setupPoolSceneCallbacks();

      // Start tournament connection (no asset loading yet)
      // Assets will be loaded when we get tournament pairs and start actual games
      await this.poolScene.startAnimation();

    } catch (error) {
      console.error('Failed to initialize tournament:', error);
      this.showError('Failed to join tournament');
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

  private showTournamentConnectingScreen(): void {
    if (!this.tournamentConnectingOverlay) return;

    this.hideQuitButton();

    this.tournamentConnectingOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">🏆 Joining Tournament</p>
      <div class="mb-6">
        <div class="text-black font-mono text-lg animate-pulse text-center">
          Connecting to tournament server...
        </div>
      </div>
      <div class="space-y-4">
        <button 
          id="cancelTournamentBtn" 
          class="w-full px-6 py-4 bg-gradient-to-b from-red-400 to-red-600 hover:from-red-300 hover:to-red-500 text-white font-bold text-lg rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider"
        >
          ← Cancel
        </button>
      </div>
    `);

    this.tournamentConnectingOverlay.style.display = "flex";

    // Add event listener for cancel button
    const cancelBtn = this.tournamentConnectingOverlay.querySelector('#cancelTournamentBtn');
    cancelBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });
  }

  private hideTournamentConnectingScreen(): void {
    if (this.tournamentConnectingOverlay) this.tournamentConnectingOverlay.style.display = "none";
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

  private showTournamentLobbyScreen(tournamentId?: string): void {
    if (!this.tournamentLobbyOverlay) return;

    this.hideQuitButton();

    // Show tournament ID or placeholder  
    const displayTournamentId = tournamentId || '------';

    this.tournamentLobbyOverlay.innerHTML = `
      <div class="min-h-full p-4 flex items-center justify-center">
        <div class="container-main-pink max-w-4xl w-full">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            🏆 Tournament Lobby
          </h1>
          <p class="text-black font-mono text-lg" id="tournamentStatusMessage">
            Waiting for players to join...
          </p>
        </div>

        <!-- Tournament Info Panel -->
        <div class="container-white p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-black text-2xl font-bold font-mono" id="tournamentPlayers">-</div>
              <div class="text-black text-sm font-mono uppercase">Players Joined</div>
            </div>
            <div class="text-center">
              <div class="text-black text-2xl font-bold font-mono" id="tournamentMaxPlayers">4</div>
              <div class="text-black text-sm font-mono uppercase">Max Players</div>
            </div>
            <div class="text-center">
              <div class="text-black text-2xl font-bold font-mono" id="tournamentStatus">Loading...</div>
              <div class="text-black text-sm font-mono uppercase">Status</div>
            </div>
          </div>
        </div>

        <!-- Players List -->
        <div class="container-white p-6 mb-6">
          <h2 class="text-2xl font-bold text-black mb-4 font-mono uppercase text-center">Players</h2>
          <div id="tournamentPlayersList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Player slots will be populated dynamically -->
            <div class="col-span-2 text-center text-gray-500 font-mono p-8">
              Loading tournament players...
            </div>
          </div>
        </div>

        <!-- Tournament Matches -->
        <div class="container-white p-6 mb-6">
          <h2 class="text-2xl font-bold text-black mb-4 font-mono uppercase text-center">Tournament Matches</h2>
          
          <!-- Placeholder (shown when waiting for players) -->
          <div id="tournamentPlaceholder" class="text-center">
            <div class="inline-block border-2 border-dashed border-gray-400 p-8 rounded-none">
              <div class="text-content">Matches will be generated when all players join</div>
            </div>
          </div>

          <!-- Tournament Bracket (hidden by default) -->
          <div id="tournamentBracketContainer" class="tournament-bracket space-y-6 hidden">
            <!-- Semifinals -->
            <div class="semifinals">
              <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">Semifinals</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- Semi-Final 1 -->
                <div class="match-card container-shadowed bg-gradient-to-r from-blue-100 to-blue-200 p-4">
                  <div class="text-center mb-2">
                    <div class="text-black font-mono font-bold text-sm">SEMIFINAL 1</div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-white border-2 border-black">
                      <span id="semi1Player1" class="font-mono font-bold text-black">Player 1</span>
                      <span class="text-black">VS</span>
                      <span id="semi1Player2" class="font-mono font-bold text-black">Player 2</span>
                    </div>
                    <div class="text-center">
                      <span id="semi1Status" class="text-xs font-mono uppercase text-black bg-yellow-200 px-2 py-1 border border-black">
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Semi-Final 2 -->
                <div class="match-card container-shadowed bg-gradient-to-r from-green-100 to-green-200 p-4">
                  <div class="text-center mb-2">
                    <div class="text-black font-mono font-bold text-sm">SEMIFINAL 2</div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-white border-2 border-black">
                      <span id="semi2Player1" class="font-mono font-bold text-black">Player 3</span>
                      <span class="text-black">VS</span>
                      <span id="semi2Player2" class="font-mono font-bold text-black">Player 4</span>
                    </div>
                    <div class="text-center">
                      <span id="semi2Status" class="text-xs font-mono uppercase text-black bg-yellow-200 px-2 py-1 border border-black">
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Finals -->
            <div class="finals">
              <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">Final</h3>
              <div class="flex justify-center">
                <div class="match-card container-shadowed bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 w-full max-w-md">
                  <div class="text-center mb-4">
                    <div class="text-black font-mono font-bold text-lg">🏆 FINAL MATCH</div>
                  </div>
                  <div class="space-y-4">
                    <div class="flex items-center justify-center p-3 bg-white border-2 border-black">
                      <span id="finalPlayer1" class="text-gray-500 font-mono italic">Winner of SF1</span>
                      <span class="mx-4 text-black font-bold">VS</span>
                      <span id="finalPlayer2" class="text-gray-500 font-mono italic">Winner of SF2</span>
                    </div>
                    <div class="text-center">
                      <span id="finalStatus" class="text-xs font-mono uppercase text-black bg-gray-200 px-2 py-1 border border-black">
                        WAITING
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tournament Start Button -->
            <div class="flex justify-center mt-6">
              <button id="startTournamentBtn" class="btn-green px-8 py-3 text-lg font-bold" style="display: none;">
                START TOURNAMENT
              </button>
            </div>
          </div>
        </div>

        <!-- Tournament Controls -->
        <div class="container-white p-6">
          <div class="flex justify-center">
            <button 
              id="leaveTournamentBtn"
              class="btn-red px-8">
              Leave Tournament
            </button>
          </div>
        </div>
        </div>
      </div>
    `;

    this.tournamentLobbyOverlay.style.display = "block";

    // Add event listeners
    const leaveTournamentBtn = this.tournamentLobbyOverlay.querySelector('#leaveTournamentBtn');

    leaveTournamentBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });
  }

    // ============================================================================
  // PUBLIC METHODS FOR POOLSCENE COMMUNICATION
  // ============================================================================

  // Update tournament lobby with server data
  updateTournamentLobby(tournamentId: string, players: string[], state: string): void {
    if (!this.tournamentLobbyOverlay || this.tournamentLobbyOverlay.style.display === 'none') return;

    // Ensure players array is valid
    if (!players || !Array.isArray(players)) {
      console.warn('updateTournamentLobby: players array is invalid', players);
      return;
    }

    console.log('🏆 Updating tournament lobby with players:', players, 'state:', state);

    // Update tournament player count
    const playerCountElement = document.getElementById('tournamentPlayers');
    if (playerCountElement) {
      playerCountElement.textContent = players.length.toString();
    }

    // Update tournament status
    const statusElement = document.getElementById('tournamentStatus');
    if (statusElement) {
      statusElement.textContent = state.toUpperCase();
    }

    // Update main status message based on player count
    const statusMessageElement = document.getElementById('tournamentStatusMessage');
    if (statusMessageElement) {
      if (players.length >= 4) {
        // All players joined - show ready message with lighter green
        statusMessageElement.textContent = 'All players ready!';
        statusMessageElement.style.color = '';
        statusMessageElement.style.fontWeight = '';
      } else {
        // Still waiting for players - keep black as requested
        statusMessageElement.textContent = 'Waiting for players to join...';
        statusMessageElement.style.color = ''; 
        statusMessageElement.style.fontWeight = ''; 
      }
    }

    // Update player list
    const playersList = document.getElementById('tournamentPlayersList');
    if (playersList) {
      if (players.length === 0) {
        playersList.innerHTML = `
          <div class="col-span-2 text-center text-gray-500 font-mono p-8">
            Loading tournament players...
          </div>
        `;
      } else {
        // Create player slots (4 slots total)
        const playerSlots = [];
        for (let i = 0; i < 4; i++) {
          const player = players[i];
          if (player && player.trim() !== '') {
            playerSlots.push(`
              <div class="bg-white border-2 border-black p-4 text-center">
                <div class="text-black font-mono font-bold text-lg">${player}</div>
                <div class="text-green-600 font-mono text-sm">✓ READY</div>
              </div>
            `);
          } else {
            playerSlots.push(`
              <div class="bg-gray-100 border-2 border-dashed border-gray-400 p-4 text-center">
                <div class="text-gray-500 font-mono font-bold text-lg">Waiting...</div>
                <div class="text-gray-400 font-mono text-sm">Player ${i + 1}</div>
              </div>
            `);
          }
        }

        playersList.innerHTML = playerSlots.join('');
      }
    }

    // Show/hide tournament bracket based on player count
    const placeholderElement = document.getElementById('tournamentPlaceholder');
    const bracketElement = document.getElementById('tournamentBracketContainer');

    if (players.length >= 4) {
      // Show bracket and populate with players
      if (placeholderElement) placeholderElement.style.display = 'none';
      if (bracketElement) {
        bracketElement.classList.remove('hidden');

        // Update semifinal matches
        const semi1Player1 = document.getElementById('semi1Player1');
        const semi1Player2 = document.getElementById('semi1Player2');
        const semi2Player1 = document.getElementById('semi2Player1');
        const semi2Player2 = document.getElementById('semi2Player2');

        if (semi1Player1) semi1Player1.textContent = players[0] || 'Player 1';
        if (semi1Player2) semi1Player2.textContent = players[1] || 'Player 2';
        if (semi2Player1) semi2Player1.textContent = players[2] || 'Player 3';
        if (semi2Player2) semi2Player2.textContent = players[3] || 'Player 4';
      }
    } else {
      // Show placeholder
      if (placeholderElement) placeholderElement.style.display = 'block';
      if (bracketElement) bracketElement.classList.add('hidden');
    }
  }

  // Handle when a new player joins the tournament
  onTournamentPlayerJoined(playerNumber: number, playerName: string, state: string): void {
    console.log(`🏆 Player ${playerNumber} joined: ${playerName}`);

    // Update state
    this.tournamentState = state;

    // Update players list to ensure correct order
    while (this.tournamentPlayers.length < playerNumber) {
      this.tournamentPlayers.push('');
    }
    
    // Set the player at the correct position (playerNumber is 1-based, array is 0-based)
    this.tournamentPlayers[playerNumber - 1] = playerName;

    console.log('🏆 Updated tournament players list:', this.tournamentPlayers);

    // Update the tournament lobby with current player list
    this.updateTournamentLobby('', this.tournamentPlayers, this.tournamentState);
  }

  // Update tournament lobby with round results
  private updateTournamentWithResults(): void {
    console.log('🏆 Updating tournament lobby with first round results');

    // Update main status message (keep black and normal font as requested)
    const statusMessageElement = document.getElementById('tournamentStatusMessage');
    if (statusMessageElement) {
      statusMessageElement.textContent = 'First round completed!';
      statusMessageElement.style.color = ''; // Reset to default black
      statusMessageElement.style.fontWeight = ''; // Reset to default
    }

    // Update tournament status to second round with lighter green
    const statusElement = document.getElementById('tournamentStatus');
    if (statusElement) {
      statusElement.textContent = 'SECOND ROUND ON';
      statusElement.style.color = '#00dd00'; // Lighter green
      statusElement.style.fontWeight = 'bold';
    }

    // Update semifinal results with scores and winner highlighting
    if (this.tournamentPlayers.length >= 4) {
      // Semifinal 1 - update VS box with scores and highlight winner
      const semi1Player1 = document.getElementById('semi1Player1');
      const semi1Player2 = document.getElementById('semi1Player2');
      const semi1Status = document.getElementById('semi1Status');
      
      if (semi1Player1 && semi1Player2 && semi1Status) {
        // Mock scores - in real implementation this would come from server
        const player1Score = 3;
        const player2Score = 1;
        const player1Won = player1Score > player2Score;
        
        // Update VS box to show scores
        const semi1VSBox = semi1Player1.parentElement;
        if (semi1VSBox) {
          semi1VSBox.innerHTML = `
            <span class="font-mono font-bold text-lg ${player1Won ? 'text-green-600' : 'text-black'}">${this.tournamentPlayers[0]} (${player1Score})</span>
            <span class="text-black text-sm">VS</span>
            <span class="font-mono font-bold text-lg ${!player1Won ? 'text-green-600' : 'text-black'}">${this.tournamentPlayers[1]} (${player2Score})</span>
          `;
        }
        
        semi1Status.textContent = 'COMPLETED';
        semi1Status.className = 'text-xs font-mono uppercase text-white bg-green-600 px-2 py-1 border border-black';
      }

      // Semifinal 2 - update VS box with scores and highlight winner
      const semi2Player1 = document.getElementById('semi2Player1');
      const semi2Player2 = document.getElementById('semi2Player2');
      const semi2Status = document.getElementById('semi2Status');
      
      if (semi2Player1 && semi2Player2 && semi2Status) {
        // Mock scores - in real implementation this would come from server
        const player3Score = 2;
        const player4Score = 3;
        const player3Won = player3Score > player4Score;
        
        // Update VS box to show scores
        const semi2VSBox = semi2Player1.parentElement;
        if (semi2VSBox) {
          semi2VSBox.innerHTML = `
            <span class="font-mono font-bold text-lg ${player3Won ? 'text-green-600' : 'text-black'}">${this.tournamentPlayers[2]} (${player3Score})</span>
            <span class="text-black text-sm">VS</span>
            <span class="font-mono font-bold text-lg ${!player3Won ? 'text-green-600' : 'text-black'}">${this.tournamentPlayers[3]} (${player4Score})</span>
          `;
        }
        
        semi2Status.textContent = 'COMPLETED';
        semi2Status.className = 'text-xs font-mono uppercase text-white bg-green-600 px-2 py-1 border border-black';
      }
    }

    // Update final match with winners (based on mock semifinal results)
    const finalPlayer1 = document.getElementById('finalPlayer1');
    const finalPlayer2 = document.getElementById('finalPlayer2');
    const finalStatus = document.getElementById('finalStatus');
    
    if (finalPlayer1 && finalPlayer2 && finalStatus && this.tournamentPlayers.length >= 4) {
      // Based on mock scores: Player 1 (3-1) beats Player 2, Player 4 (3-2) beats Player 3
      finalPlayer1.textContent = this.tournamentPlayers[0] || 'Winner 1'; // Player 1 won semifinal 1
      finalPlayer2.textContent = this.tournamentPlayers[3] || 'Winner 2'; // Player 4 won semifinal 2
      finalStatus.textContent = 'READY';
      finalStatus.className = 'text-xs font-mono uppercase text-white bg-blue-600 px-2 py-1 border border-black';
    }

    // Show the start tournament button for second round (room IDs have been sent)
    const startTournamentBtn = document.getElementById('startTournamentBtn') as HTMLButtonElement;
    if (startTournamentBtn) {
      startTournamentBtn.style.display = 'block';
      startTournamentBtn.textContent = '🎮 START FINAL GAME';
      startTournamentBtn.style.opacity = '1';
      startTournamentBtn.disabled = false;
      
      // Remove any existing event listeners to avoid duplicates
      const newBtn = startTournamentBtn.cloneNode(true) as HTMLButtonElement;
      startTournamentBtn.parentNode?.replaceChild(newBtn, startTournamentBtn);
      
      // Add event listener for final game
      newBtn.addEventListener('click', async () => {
        // For the second round, we'll trigger the tournament game invite process
        // The server should have already sent room IDs for the final
        if (this.tournamentRoomId) {
          await this.startTournamentGame(this.tournamentRoomId);
        } else {
          console.log('🏆 Waiting for final game room ID from server...');
          // The server should send a tournament game invite for the final
        }
      });
    }
  }

  // Reset tournament game state for next round
  private resetTournamentGameForNextRound(): void {
    console.log('🏆 Resetting tournament game for next round');

    // Dispose of the existing PoolScene to clean up WebSocket connections, 
    // event listeners, and game state
    if (this.poolScene) {
      this.poolScene.dispose();
      this.poolScene = undefined;
    }

    // Create a new PoolScene for the next tournament round
    // This ensures a clean state without any leftover game data
    try {
      this.poolScene = new PoolScene(this.canvas, 'tournament', this.player1Name);
      
      // Set up callbacks for the new PoolScene
      this.setupPoolSceneCallbacks();
      
      // Initialize the tournament connection for the new PoolScene
      // This prepares it for the next round without connecting to lobby
      // (since we're already in the lobby)
      
      console.log('🏆 Tournament PoolScene reset complete');
    } catch (error) {
      console.error('🚨 Failed to reset tournament PoolScene:', error);
    }
  }

  public onTournamentGameInvite(roomId: string): void {
    console.log("🏆 Tournament game invitation received in Game3D:", roomId);
    
    // Store the room ID for when user clicks start
    this.tournamentRoomId = roomId;
    
    // Update the tournament status to lighter green
    const statusElement = document.getElementById('tournamentStatus');
    if (statusElement) {
      statusElement.textContent = 'FIRST ROUND ON';
      statusElement.style.color = '#00dd00'; 
      statusElement.style.fontWeight = 'bold';
    }

    // Show the start tournament button in the existing lobby
    this.showStartTournamentButton();
  }

  // Enable the existing start tournament button
  private showStartTournamentButton(): void {
    // Find the existing start tournament button
    const startTournamentBtn = this.tournamentLobbyOverlay?.querySelector('#startTournamentBtn') as HTMLButtonElement;
    
    if (startTournamentBtn) {
      // Make the button visible and enabled (it might have been disabled/hidden initially)
      startTournamentBtn.style.display = 'block';
      startTournamentBtn.disabled = false;
      startTournamentBtn.style.opacity = '1';
      
      // Update button text to be more clear
      startTournamentBtn.textContent = '🎮 START TOURNAMENT GAME';
      
      // Add click event listener
      startTournamentBtn.addEventListener('click', async () => {
        if (this.tournamentRoomId) {
          await this.startTournamentGame(this.tournamentRoomId);
        }
      });
    }
  }

  // Show tournament lobby in "ready to start" state
  private showTournamentGameReady(roomId: string): void {
    if (!this.tournamentLobbyOverlay) return;

    this.tournamentLobbyOverlay.innerHTML = this.createPongContentWrapper(`
      <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">🏆 Tournament is On!</p>
      
      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Status:</p>
        <div class="w-full bg-green-600 text-white font-mono text-xl font-bold px-6 py-3 rounded border-4 border-black text-center">
          Round 1 - Ready to Start!
        </div>
      </div>

      <div class="mb-6">
        <p class="font-mono text-black text-lg font-bold mb-2">Your Match:</p>
        <div class="w-full bg-blue-600 text-white font-mono text-lg font-bold px-6 py-3 rounded border-4 border-black text-center">
          Room: ${roomId}
        </div>
      </div>

      <div class="space-y-4">
        <button 
          id="startTournamentGameBtn" 
          class="w-full px-6 py-4 bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white font-bold text-xl rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider animate-pulse"
        >
          🎮 Start Tournament Game
        </button>
        
        <button 
          id="backToMenuFromTournamentBtn" 
          class="w-full px-6 py-4 bg-gradient-to-b from-gray-400 to-gray-600 hover:from-gray-300 hover:to-gray-500 text-white font-bold text-lg rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider"
        >
          ← Back to Menu
        </button>
      </div>
    `);

    this.tournamentLobbyOverlay.style.display = 'flex';

    // Set up event listeners for the new buttons
    const startBtn = this.tournamentLobbyOverlay.querySelector('#startTournamentGameBtn') as HTMLButtonElement;
    const backBtn = this.tournamentLobbyOverlay.querySelector('#backToMenuFromTournamentBtn') as HTMLButtonElement;

    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        await this.startTournamentGame(roomId);
      });
    }
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.returnToMainMenu();
      });
    }
  }

  // Start the tournament game with the given room ID
  private async startTournamentGame(roomId: string): Promise<void> {
    console.log("🏆 Starting tournament game with room:", roomId);
    
    // Hide tournament lobby
    if (this.tournamentLobbyOverlay) {
      this.tournamentLobbyOverlay.style.display = 'none';
    }

    // Show loading overlay while assets load and game initializes
    this.showLoadingScreen();

    // Update PoolScene's roomId and transition to actual online game with asset loading
    if (this.poolScene) {
      try {
        await this.poolScene.updateRoomIdAndStartGame(roomId);
        console.log("🏆 Tournament game initialization complete!");
      } catch (error) {
        console.error("🚨 Failed to start tournament game:", error);
        this.hideLoadingScreen();
        // Could show error overlay here
      }
    }
  }

  // ============================================================================
  // CALLBACK SETUP METHODS
  // ============================================================================

  private setupPoolSceneCallbacks(): void {
    if (!this.poolScene) return;

    // Always set up game end callback
    this.poolScene.setOnGameEndCallback((finalState) => {
      this.hideQuitButton();
      if (this.gameMode === 'tournament') {
        this.showTournamentGameEndOverlay(finalState);
      } else {
        this.showGameEndOverlay(finalState);
      }
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
    } else if (this.gameMode === 'tournament') {
      // Set up tournament callbacks
      this.setupTournamentCallbacks();
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

  private setupTournamentCallbacks(): void {
    if (!this.poolScene) return;

    // Don't show tournament lobby immediately - wait for server response

    // Game start callback - hide tournament lobby when actual game begins
    this.poolScene.setOnGameStartCallback(() => {
      if (this.tournamentLobbyOverlay) this.tournamentLobbyOverlay.style.display = "none";
      if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
      this.showQuitButton();
    });

    // Room ID callback for tournament registration (when server assigns tournament ID)
    this.poolScene.setOnRoomIdCallback((tournamentId) => {
      console.log('🏆 Tournament registered with ID:', tournamentId);
      // Don't show lobby yet - wait for complete registration data
      // Just store the tournament ID for later use
    });

    // Tournament registered callback - receives complete player list from server
    this.poolScene.setOnTournamentRegisteredCallback((tournamentId, players, state) => {
      console.log('🏆 Tournament registered callback with complete players:', players);
      // Use the authoritative player list from server
      this.tournamentPlayers = [...players];
      this.tournamentState = state;
      // Now hide connecting screen and show tournament lobby with complete data
      this.hideTournamentConnectingScreen();
      this.showTournamentLobbyScreen(tournamentId);
      // Update lobby with complete player information
      this.updateTournamentLobby(tournamentId, this.tournamentPlayers, this.tournamentState);
    });

    // Tournament player joined callback
    this.poolScene.setOnTournamentPlayerJoinedCallback((playerNumber, playerName, state) => {
      console.log('🏆 Tournament player joined callback received in Game3D');
      // Update tournament lobby with new player information
      this.onTournamentPlayerJoined(playerNumber, playerName, state);
    });

    // Tournament game invite callback - when server assigns players to tournament matches
    this.poolScene.setOnTournamentGameInviteCallback((roomId: string) => {
      console.log('🏆 Tournament game invite callback received in Game3D');
      this.onTournamentGameInvite(roomId);
    });

    // TODO: Add remaining tournament callbacks:
    // - onTournamentResults: (results) => void
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

  private showTournamentGameEndOverlay(finalState: any): void {
    if (!this.gameEndOverlay) return;

    const winner = finalState.winner || "Unknown";
    const isCurrentPlayerWinner = winner === this.player1Name;

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
          <h2 style="font-family: monospace !important; color: white !important; font-size: 30px !important; font-weight: bold !important; margin-bottom: 8px !important;">
            ${isCurrentPlayerWinner ? '🏆 You Win!' : 'You Lose!'}
          </h2>
          <p style="font-family: monospace !important; color: white !important; font-size: 18px !important; font-weight: bold !important;">
            ${winner} wins the match!
          </p>
          <p style="font-family: monospace !important; color: rgb(249, 115, 22) !important; font-size: 16px !important; margin-top: 8px !important;">
            Tournament continues...
          </p>
        </div>
        
        <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          <button id="returnToTournamentLobbyBtn" style="
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
            🏆 Return to Tournament Lobby
          </button>
        </div>
      </div>
    `;

    // Add event listener
    const returnToLobbyBtn = this.gameEndOverlay.querySelector('#returnToTournamentLobbyBtn');

    returnToLobbyBtn?.addEventListener('click', async () => {
      // Hide the game end overlay
      this.gameEndOverlay!.style.display = "none";
      
      // Show the tournament lobby again
      if (this.tournamentLobbyOverlay) {
        this.tournamentLobbyOverlay.style.display = "block";
      }
      
      // Reset tournament state for next round
      // Update tournament lobby to show round results and next round setup
      this.updateTournamentWithResults();
      
      // Reset the game for the next round
      this.resetTournamentGameForNextRound();
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


