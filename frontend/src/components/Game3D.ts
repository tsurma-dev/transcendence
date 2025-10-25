/* eslint-disable no-trailing-spaces */

import { PoolScene } from "../babylon/PoolScene";

export type GameMode = 'local' | 'joinRoom' | 'createRoom' | 'AI' | 'tournament';

/**
 * Game3D Component with organized overlay system:
 *
 * Full Screen Overlays (z-index 20-25):
 * - loadingOverlay: Shows while game assets are loading (for all game modes)
 * - roomCreatedOverlay: Shows room ID while waiting for player 2 to join
 * Tournament specific Overlays:
 * - tournamentConnectingOverlay: connecting to server
 * - tournamentScreenLobbyOverlay: dynamically updating while players join 
 * -- and results come in (hidden until the end of the tournament)
 *
 * Pop-up Overlays (z-index 30+, with game visible in background):
 * - gameEndOverlay: Shows game over screen with winner and options
 * - disconnected popup: Uses gameEndOverlay to show disconnection messages
 *
 * UI Elements:
 * - quitButton: Fixed position quit button for active games
 *
 * Code Organization:
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
  private tournamentRound: 'semifinals' | 'final' | 'bronze' = 'semifinals'; // Track current tournament round

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
  // GAME FLOW METHODS
  // ============================================================================

  private async startGameFlow(): Promise<void> {
 
    switch (this.gameMode) {
      case 'local':
        this.showLoadingScreen();
        await this.startLocalGame();
        break;
      case 'createRoom':
        this.showLoadingScreen();
        await this.startCreateRoomGame();
        break;
      case 'joinRoom':
        this.showLoadingScreen();
        await this.startJoinRoomGame();
        break;
      case 'AI':
        this.showLoadingScreen();
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
      this.poolScene = new PoolScene(this.canvas, 'local', this.player1Name, this.player2Name);
      this.setupPoolSceneCallbacks();
      await this.waitForAssetsToLoadLocal();
      await this.poolScene.startAnimation();
    } catch (error) {
      console.error('Failed to initialize local game:', error);
      this.showError('Failed to load local game');
    }
  }

  private restartLocalGame(): void {
    if (this.gameMode !== 'local' || !this.poolScene) return;
    if (this.gameEndOverlay) {
      this.gameEndOverlay.style.display = "none";
    }
    this.poolScene.restartQuick();
    this.showQuitButton();
  }

  private async startCreateRoomGame(): Promise<void> {
    console.log('🌐 Setting up createRoom game');

    try {
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name);
      this.setupPoolSceneCallbacks();
      this.showRoomCreatedScreen();
      await this.waitForAssetsToLoad();
    } catch (error) {
      console.error('Failed to initialize createRoom game:', error);
      this.showError('Failed to create room');
    }
  }

  private async startJoinRoomGame(): Promise<void> {
    console.log('🌐 Setting up joinRoom game');
    // Prevent multiple initializations
    if (this.poolScene) {
      return;
    }
    try {
      if (!this.roomId) {
        throw new Error('Room ID is required for joinRoom mode');
      }
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name, undefined, this.roomId);
      this.setupPoolSceneCallbacks();
      await this.waitForAssetsToLoad();
    } catch (error) {
      console.error('Failed to initialize joinRoom game:', error);
      this.showError('Failed to join room');
    }
  }

  private async startAIGame(): Promise<void> {
    console.log('🤖 Setting up AI game');
    try {
      this.poolScene = new PoolScene(this.canvas, 'AI', this.player1Name, 'AI');
      this.setupPoolSceneCallbacks();
      await this.waitForAssetsToLoadLocal();
    } catch (error) {
      console.error('Failed to initialize AI game:', error);
      this.showError('Failed to load AI game');
    }
  }

  private async startTournamentMode(): Promise<void> {
    console.log('🏆 Setting up tournament mode');
    try {
      this.showTournamentConnectingScreen();
      this.poolScene = new PoolScene(this.canvas, 'tournament', this.player1Name);
      this.setupPoolSceneCallbacks();
    } catch (error) {
      console.error('Failed to initialize tournament:', error);
      this.showError('Failed to join tournament');
    }
  }

  // Start the tournament game with the given room ID
  private async startTournamentGame(tournamentRoomId: string): Promise<void> {
    console.log("🏆 Starting game in room:", tournamentRoomId);
    if (this.tournamentLobbyOverlay) {
      this.tournamentLobbyOverlay.style.display = 'none';
    }
    if (this.gameEndOverlay) {
      this.gameEndOverlay.style.display = 'none';
    }
    this.showLoadingScreen();
    if (this.tournamentRound === 'final' || this.tournamentRound === 'bronze') {
      if (this.poolScene) {
        await this.poolScene.resetTournamentVisualState();
      }
    }
    this.poolScene?.updateRoomIdandSendJoin(tournamentRoomId);
    this.tournamentRoomId = ''; //reset tournamentRoomId after use
    await this.waitForAssetsToLoad();
  }

  // ============================================================================
  // GAME HELPER METHODS
  // ============================================================================

  private async waitForAssetsToLoad(): Promise<void> {
    if (!this.poolScene) throw new Error('PoolScene not initialized');

    return new Promise<void>((resolve) => {
      this.poolScene!.setOnLoadedCallback(() => {
        this.hideLoadingScreen();
        resolve();
      });
    });
  }

  private async waitForAssetsToLoadLocal(): Promise<void> {
    if (!this.poolScene) throw new Error('PoolScene not initialized');

    return new Promise<void>((resolve) => {
      this.poolScene!.setOnLoadedCallback(() => {
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

  // ============================================================================
  // OVERLAYS
  // ============================================================================

  // Repeating elements for creating overlays

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

  // ********************
  // Full screen overlays
  // ********************

  // LOADING OVERLAY
  private createLoadingOverlay(): void {
    this.loadingOverlay = this.createBaseOverlay(20);
    this.loadingOverlay.style.display = 'flex';
    this.loadingOverlay.innerHTML = this.createPongContentWrapper(`
      <div>
        <div class="text-black font-mono text-2xl font-bold drop-shadow-lg animate-pulse text-center mb-6">
          Loading game assets...
        </div>
      </div>
    `);

    this.container.appendChild(this.loadingOverlay);
  }

  private showLoadingScreen(): void {
    this.hideQuitButton();
    console.log('⏳ Showing loading screen');
    if (this.loadingOverlay) this.loadingOverlay.style.display = "flex";
    if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
  }

  private hideLoadingScreen(): void {
    console.log('✅ Hiding loading screen');
    if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
  }

  // ROOM CREATED OVERLAY
  private createRoomCreatedOverlay(): void {
    this.roomCreatedOverlay = this.createBaseOverlay(25);
    this.container.appendChild(this.roomCreatedOverlay);
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

  // TOURNAMENT CONNECTING OVERLAY
  private createTournamentConnectingOverlay(): void {
    this.tournamentConnectingOverlay = this.createBaseOverlay(25);
    this.container.appendChild(this.tournamentConnectingOverlay);
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


  // TOURNAMENT LOBBY OVERLAY
  private createTournamentLobbyOverlay(): void {
    this.tournamentLobbyOverlay = this.createBaseOverlay(25);
    // Enable scrolling for lobby overlay
    this.tournamentLobbyOverlay.style.overflowY = 'auto';
    this.tournamentLobbyOverlay.style.maxHeight = '100vh';
    this.container.appendChild(this.tournamentLobbyOverlay);
  }

  // Initialize tournament lobby screen
  private showTournamentLobbyScreen(tournamentId?: string): void {
    if (!this.tournamentLobbyOverlay) return;

    this.hideQuitButton();

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

            <!-- Bronze Match -->
            <div class="bronze-match mt-6">
              <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">3rd Place Match</h3>
              <div class="flex justify-center">
                <div class="match-card container-shadowed bg-gradient-to-r from-orange-100 to-orange-200 p-6 w-full max-w-md">
                  <div class="text-center mb-4">
                    <div class="text-black font-mono font-bold text-lg">🥉 BRONZE MATCH</div>
                  </div>
                  <div class="space-y-4">
                    <div class="flex items-center justify-center p-3 bg-white border-2 border-black">
                      <span id="bronzePlayer1" class="text-gray-500 font-mono italic">Loser of SF1</span>
                      <span class="mx-4 text-black font-bold">VS</span>
                      <span id="bronzePlayer2" class="text-gray-500 font-mono italic">Loser of SF2</span>
                    </div>
                    <div class="text-center">
                      <span id="bronzeStatus" class="text-xs font-mono uppercase text-black bg-gray-200 px-2 py-1 border border-black">
                        WAITING
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tournament Start Button -->
        <div class="flex justify-center mt-6">
          <button id="startTournamentBtn" class="btn-green px-8 py-3 text-lg font-bold w-full max-w-md" style="display: none;">
            START TOURNAMENT
          </button>
        </div>

        <!-- Leave Tournament Button-->
        <div class="flex justify-center mt-6">
          <button
            id="leaveTournamentBtn"
            class="btn-red px-8 py-3 text-lg font-bold w-full max-w-md">
            Leave Tournament
          </button>
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

  // Update tournament lobby with current players and state
  private updateTournamentLobby(players: string[], state: string): void {
    if (!this.tournamentLobbyOverlay || this.tournamentLobbyOverlay.style.display === 'none') return;

    // Ensure players array is always 4 slots
    const slots = 4;
    const normalizedPlayers = Array.from({ length: slots }, (_, i) => players[i] || "");

    // Update tournament status
    const statusElement = document.getElementById('tournamentStatus');
    if (statusElement) {
      statusElement.textContent = state.toUpperCase();
    }

    // Update Players Joined count
    const playerCountElement = document.getElementById('tournamentPlayers');
    if (playerCountElement) {
      const joinedCount = normalizedPlayers.filter(p => p.trim() !== '').length;
      playerCountElement.textContent = joinedCount.toString();
    }

    // Update main status message based on player count
    const statusMessageElement = document.getElementById('tournamentStatusMessage');
    if (statusMessageElement) {
      if (normalizedPlayers.filter(p => p.trim() !== '').length >= 4) {
        statusMessageElement.textContent = 'All players ready!';
        statusMessageElement.style.color = '';
        statusMessageElement.style.fontWeight = '';
      } else {
        statusMessageElement.textContent = 'Waiting for players to join...';
        statusMessageElement.style.color = '';
        statusMessageElement.style.fontWeight = '';
      }
    }

    // Update player list
    const playersList = document.getElementById('tournamentPlayersList');
    if (playersList) {
      // Always show 4 slots
      const playerSlots = [];
      for (let i = 0; i < slots; i++) {
        const player = normalizedPlayers[i];
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

    // Show/hide tournament bracket based on player count
    const placeholderElement = document.getElementById('tournamentPlaceholder');
    const bracketElement = document.getElementById('tournamentBracketContainer');

    if (normalizedPlayers.filter(p => p.trim() !== '').length >= 4) {
      if (placeholderElement) placeholderElement.style.display = 'none';
      if (bracketElement) {
        bracketElement.classList.remove('hidden');
        // Update semifinal matches
        const semi1Player1 = document.getElementById('semi1Player1');
        const semi1Player2 = document.getElementById('semi1Player2');
        const semi2Player1 = document.getElementById('semi2Player1');
        const semi2Player2 = document.getElementById('semi2Player2');
        if (semi1Player1) semi1Player1.textContent = normalizedPlayers[0] || 'Player 1';
        if (semi1Player2) semi1Player2.textContent = normalizedPlayers[1] || 'Player 2';
        if (semi2Player1) semi2Player1.textContent = normalizedPlayers[2] || 'Player 3';
        if (semi2Player2) semi2Player2.textContent = normalizedPlayers[3] || 'Player 4';
      }
    } else {
      if (placeholderElement) placeholderElement.style.display = 'block';
      if (bracketElement) bracketElement.classList.add('hidden');
    }
  }

  // Enable the existing start tournament button
  private showStartTournamentButton(): void {
    const startTournamentBtn = this.tournamentLobbyOverlay?.querySelector('#startTournamentBtn') as HTMLButtonElement;

    if (startTournamentBtn) {
      startTournamentBtn.style.display = 'block';
      startTournamentBtn.disabled = false;
      startTournamentBtn.style.opacity = '1';
      startTournamentBtn.textContent = '🎮 START TOURNAMENT GAME';

      startTournamentBtn.addEventListener('click', async () => {
        if (this.tournamentRoomId) {
          await this.startTournamentGame(this.tournamentRoomId);
        }
      });
    }
  }

  // ********************
  // Pop-up overlays
  // ********************

  // GAME END OVERLAY
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

    // Add return to menu listener
    const returnToMenuBtnImmediate = this.gameEndOverlay.querySelector('#returnToMenuBtn');
    returnToMenuBtnImmediate?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });

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


  private showTournamentGameEndOverlay(finalState: any, isSecondRound: boolean = false): void {
    if (!this.gameEndOverlay) return;

    // Ensure winner and current player result are always defined
    const winner = finalState.winner || "Unknown";
    const isCurrentPlayerWinner = winner === this.player1Name;

    if (this.tournamentRound === 'semifinals') {
      if (isCurrentPlayerWinner) {
        this.tournamentRound = 'final';
      } else {
        this.tournamentRound = 'bronze';
      }
    }

    if (isSecondRound) {
      // If tournament is finished, show go to results button immediately
      let resultsButtonHtml = '';
      if (this.tournamentState === 'finished') {
        resultsButtonHtml = `<button id="goToResultsBtn" style="width: 100% !important; color: white !important; font-family: monospace !important; font-size: 18px !important; font-weight: bold !important; background: rgb(236, 72, 153) !important; padding: 12px 24px !important; border-radius: 8px !important; border: 2px solid black !important; cursor: pointer !important; transition: all 0.2s !important;" onmouseover="this.style.background='rgb(219, 39, 119)'" onmouseout="this.style.background='rgb(236, 72, 153)'">🏆 View Tournament Results</button>`;
      }
      this.gameEndOverlay.innerHTML = `
        <div style="
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 12px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          padding: 32px !important;
          max-width: 500px !important;
          text-align: center !important;
          border: 4px solid black !important;
        ">
          <div style="margin-bottom: 32px !important;">
            <h1 style="font-family: monospace !important; color: white !important; font-size: 36px !important; font-weight: bold !important; margin-bottom: 16px !important;">
              ${isCurrentPlayerWinner ? '🏆 YOU WON!' : '💔 YOU LOST!'}
            </h1>
            <p style="font-family: monospace !important; color: white !important; font-size: 18px !important; font-weight: bold !important;">
              ${this.tournamentRound === 'final' ?
          (isCurrentPlayerWinner ? 'You are the Tournament Champion!' : `${winner} is the Tournament Champion!`) :
          (isCurrentPlayerWinner ? 'You won 3rd place!' : `${winner} takes 3rd place!`)
        }
            </p>
          </div>

          <div style="font-family: monospace !important; color: rgb(249, 115, 22) !important; font-size: 16px !important;">
            ${this.tournamentState === 'finished' ? '' : '<div id="waitingForFinalResults">⏳ Waiting for the other game to end...</div>'}
          </div>
          <div style="margin-top: 24px;">
            ${resultsButtonHtml}
          </div>
          <div style="margin-top: 12px;">
            <button id="returnToMenuBtn" style="width: 100% !important; color: white !important; font-family: monospace !important; font-size: 16px !important; font-weight: bold !important; background: rgb(107, 114, 128) !important; padding: 10px 20px !important; border-radius: 8px !important; border: 2px solid black !important; cursor: pointer !important; transition: all 0.2s !important;" onmouseover="this.style.background='rgb(75, 85, 99)'" onmouseout="this.style.background='rgb(107, 114, 128)'">🏠 Return to Menu</button>
          </div>
        </div>
      `;

      this.gameEndOverlay.style.display = "flex";
      // Add go to results button handler if present
      const goToResultsBtn = this.gameEndOverlay.querySelector('#goToResultsBtn');
      goToResultsBtn?.addEventListener('click', () => {
        this.poolScene?.dispose();
        this.gameEndOverlay!.style.display = 'none';
        if (this.tournamentLobbyOverlay) {
          this.tournamentLobbyOverlay.style.display = 'block';
        }
      });
      // Add return to menu button handler
      const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
      returnToMenuBtn?.addEventListener('click', async () => {
        await this.returnToMainMenu();
      });

      this.gameEndOverlay.style.display = "flex";
      return;
    }

    // After first round:
    // Show waiting if no room ID, continue if room ID is present
    let overlayContent = '';
    if (this.tournamentRoomId) {
      overlayContent = `<button id="continueTournamentBtn" style="width: 100% !important; color: white !important; font-family: monospace !important; font-size: 18px !important; font-weight: bold !important; background: rgb(34, 197, 94) !important; padding: 12px 24px !important; border-radius: 8px !important; border: 2px solid black !important; cursor: pointer !important; transition: background 0.2s, transform 0.2s !important;">🎮 CONTINUE TO MATCH</button>`;
    } else {
      overlayContent = `<div id="waitingForOtherGame" class="animate-pulse" style="width: 100%; color: #333; font-family: monospace; font-size: 18px; font-weight: bold; background: #f3f4f6; padding: 12px 24px; border-radius: 8px; border: 2px solid #aaa; margin-bottom: 8px;">⏳ Waiting for the other game to finish...</div>`;
    }

    

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
            ${isCurrentPlayerWinner ? '🏆 You Won!!' : '💔 You Lost!'}
          <p style="font-family: monospace !important; color: rgb(249, 115, 22) !important; font-size: 16px !important; margin-top: 8px !important;">
            ${isCurrentPlayerWinner ? 'You advance to the Final!' : 'You can still fight for 3rd place!'}
          </p>
        </div>

        <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          ${overlayContent}
          <button id="returnToMenuBtn" style="
            width: 100% !important;
            color: white !important;
            font-family: monospace !important;
            font-size: 16px !important;
            font-weight: bold !important;
            background: rgb(107, 114, 128) !important;
            padding: 10px 20px !important;
            border-radius: 8px !important;
            border: 2px solid black !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          " onmouseover="this.style.background='rgb(75, 85, 99)'" onmouseout="this.style.background='rgb(107, 114, 128)'">
            🏠 Return to Menu
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const continueBtn = this.gameEndOverlay.querySelector('#continueTournamentBtn');
    if (continueBtn) {
      const btn = continueBtn as HTMLElement;
      btn.addEventListener('click', async () => {
        if (this.tournamentRoomId) {
          await this.startTournamentGame(this.tournamentRoomId);
        }
      });
      // Add onmouseover/onmouseout for hover effect
      btn.onmouseover = function() {
        btn.style.background = 'rgb(22, 163, 74)';
        btn.style.transform = 'scale(1.04)';
      };
      btn.onmouseout = function() {
        btn.style.background = 'rgb(34, 197, 94)';
        btn.style.transform = 'scale(1)';
      };
    }

    const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
    returnToMenuBtn?.addEventListener('click', async () => {
      await this.returnToMainMenu();
    });

    // Show the overlay
    this.gameEndOverlay.style.display = "flex";
  }


  // DISCONNECT OVERLAY
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


  // QUIT BUTTON AND CONFIRMATION
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


  // ============================================================================
  // TOURNAMENT CALLBACKS
  // ============================================================================


  // Handle when a new player joins the tournament
  public onTournamentPlayerJoined(playerNumber: number, playerName: string, state: string): void {
    this.tournamentState = state;
    // Always normalize to 4 slots
    while (this.tournamentPlayers.length < 4) this.tournamentPlayers.push('');
    this.tournamentPlayers[playerNumber - 1] = playerName;
    this.updateTournamentLobby([...this.tournamentPlayers], this.tournamentState);
  }

  // Handle when a player leaves the tournament lobby
  public onTournamentPlayerLeft(playerName: string, state: string): void {
    this.tournamentState = state;
    const playerIndex = this.tournamentPlayers.indexOf(playerName);
    if (playerIndex !== -1) {
      this.tournamentPlayers[playerIndex] = '';
    }
    this.tournamentPlayers = Array.from({ length: 4 }, (_, i) => this.tournamentPlayers[i] || "");
    this.updateTournamentLobby([...this.tournamentPlayers], this.tournamentState);
  }

  // Handle when tournament game invite is received from server
  // First round will show lobby with start button
  // Second round will show Continue button in the game end overlay
  public async onTournamentGameInvite(roomId: string): Promise<void> {

    // Store the room ID
    this.tournamentRoomId = roomId;

    // Check if tournament lobby is visible (first round)
    const isLobbyVisible = this.tournamentLobbyOverlay && this.tournamentLobbyOverlay.style.display !== 'none';

    if (isLobbyVisible) {

      // Update the tournament status to lighter green
      const statusElement = document.getElementById('tournamentStatus');
      if (statusElement) {
        statusElement.textContent = 'ONGOING';
        statusElement.style.color = '#00dd00';
        statusElement.style.fontWeight = 'bold';
      }

      // Show the start tournament button in the existing lobby
      this.showStartTournamentButton();
    } else {
      // If game end overlay is showing, swap waiting for continue
      if (this.gameEndOverlay && this.gameEndOverlay.style.display === 'flex') {
        const waitingDiv = this.gameEndOverlay.querySelector('#waitingForOtherGame');
        if (waitingDiv) {
          waitingDiv.outerHTML = `<button id="continueTournamentBtn" style="width: 100% !important; color: white !important; font-family: monospace !important; font-size: 18px !important; font-weight: bold !important; background: rgb(34, 197, 94) !important; padding: 12px 24px !important; border-radius: 8px !important; border: 2px solid black !important; cursor: pointer !important; transition: all 0.2s !important;">🎮 CONTINUE TO MATCH</button>`;
          const continueBtn = this.gameEndOverlay.querySelector('#continueTournamentBtn');
          continueBtn?.addEventListener('click', async () => {
            if (this.tournamentRoomId) {
              await this.startTournamentGame(this.tournamentRoomId);
            }
          });
        }
      }
    }
  }

  // Handle tournament round completion (e.g., semifinals, finals)
  public onTournamentRoundFinished(results: any): void {

    // Parse and update match results in the lobby
    if (results.matchA && results.matchB) {
      // Update semifinals match cards
      const semi1Player1 = document.getElementById('semi1Player1');
      const semi1Player2 = document.getElementById('semi1Player2');
      const semi1Status = document.getElementById('semi1Status');
      if (semi1Player1) semi1Player1.textContent = results.matchA.player1;
      if (semi1Player2) semi1Player2.textContent = results.matchA.player2;
      if (semi1Status) {
        semi1Status.textContent = `${results.matchA.score[0]} - ${results.matchA.score[1]} | Winner: ${results.matchA.winner}`;
        semi1Status.style.background = '#bbf7d0';
        semi1Status.style.color = '#166534';
      }

      const semi2Player1 = document.getElementById('semi2Player1');
      const semi2Player2 = document.getElementById('semi2Player2');
      const semi2Status = document.getElementById('semi2Status');
      if (semi2Player1) semi2Player1.textContent = results.matchB.player1;
      if (semi2Player2) semi2Player2.textContent = results.matchB.player2;
      if (semi2Status) {
        semi2Status.textContent = `${results.matchB.score[0]} - ${results.matchB.score[1]} | Winner: ${results.matchB.winner}`;
        semi2Status.style.background = '#bbf7d0';
        semi2Status.style.color = '#166534';
      }
    }

    // Keep the lobby hidden until final sequence is complete
    if (this.tournamentLobbyOverlay) {
      this.tournamentLobbyOverlay.style.display = 'none';
      // Hide the start tournament button
      const startTournamentBtn = this.tournamentLobbyOverlay.querySelector('#startTournamentBtn') as HTMLButtonElement;
      if (startTournamentBtn) {
        startTournamentBtn.style.display = 'none';
        startTournamentBtn.disabled = true;
      }
      // Hide the Player list
      const playersListContainers = this.tournamentLobbyOverlay.querySelectorAll('.container-white.p-6.mb-6');
      playersListContainers.forEach(container => {
        const heading = container.querySelector('h2');
        if (heading && heading.textContent?.trim().toUpperCase() === 'PLAYERS') {
          (container as HTMLElement).style.display = 'none';
        }
      });
    }
  }

  // Handle final tournament results from server 
  public onTournamentResults(tournamentResults: any): void {
    // If we are in the final sequence, swap waiting for a button
    this.tournamentState = 'finished';
    if (this.tournamentState === 'finished' && this.gameEndOverlay) {
      const waitingDiv = this.gameEndOverlay.querySelector('#waitingForFinalResults');
      if (waitingDiv) {
        waitingDiv.outerHTML = `<button id="goToResultsBtn" style="width: 100% !important; color: white !important; font-family: monospace !important; font-size: 18px !important; font-weight: bold !important; background: rgb(236, 72, 153) !important; padding: 12px 24px !important; border-radius: 8px !important; border: 2px solid black !important; cursor: pointer !important; transition: all 0.2s !important;">🏆 View Tournament Results</button>`;
        const goToResultsBtn = this.gameEndOverlay.querySelector('#goToResultsBtn');
        goToResultsBtn?.addEventListener('click', () => {
          this.poolScene?.dispose();
          this.gameEndOverlay!.style.display = 'none';
          if (this.tournamentLobbyOverlay) {
            this.tournamentLobbyOverlay.style.display = 'block';
          }
        });
      }
    }

    // Update final match card
    if (tournamentResults.finalMatch) {
      const finalPlayer1 = document.getElementById('finalPlayer1');
      const finalPlayer2 = document.getElementById('finalPlayer2');
      const finalStatus = document.getElementById('finalStatus');
      if (finalPlayer1) finalPlayer1.textContent = tournamentResults.finalMatch.player1;
      if (finalPlayer2) finalPlayer2.textContent = tournamentResults.finalMatch.player2;
      if (finalStatus) {
        finalStatus.textContent = `${tournamentResults.finalMatch.score[0]} - ${tournamentResults.finalMatch.score[1]} | Winner: ${tournamentResults.finalMatch.winner}`;
        finalStatus.style.background = '#fef9c3';
        finalStatus.style.color = '#ca8a04';
      }
    }

    // Update bronze match card
    if (tournamentResults.thirdPlaceMatch) {
      const bronzePlayer1 = document.getElementById('bronzePlayer1');
      const bronzePlayer2 = document.getElementById('bronzePlayer2');
      const bronzeStatus = document.getElementById('bronzeStatus');
      if (bronzePlayer1) bronzePlayer1.textContent = tournamentResults.thirdPlaceMatch.player1;
      if (bronzePlayer2) bronzePlayer2.textContent = tournamentResults.thirdPlaceMatch.player2;
      if (bronzeStatus) {
        bronzeStatus.textContent = `${tournamentResults.thirdPlaceMatch.score[0]} - ${tournamentResults.thirdPlaceMatch.score[1]} | Winner: ${tournamentResults.thirdPlaceMatch.winner}`;
        bronzeStatus.style.background = '#fed7aa';
        bronzeStatus.style.color = '#c2410c';
      }
    }

    // Update tournament status
    const statusElement = document.getElementById('tournamentStatus');
    if (statusElement) {
      statusElement.textContent = 'FINISHED';
      statusElement.style.color = '#00dd00';
      statusElement.style.fontWeight = 'bold';
    }

    // Update main status message 
    const statusMessageElement = document.getElementById('tournamentStatusMessage');
    if (statusMessageElement) {
        statusMessageElement.textContent = 'TOURNAMENT FINISHED!';
    }
    // Ensure tournament lobby is hidden
    if (this.tournamentLobbyOverlay) {
      this.tournamentLobbyOverlay.style.display = 'none';
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
        if (this.tournamentRound === 'final' || this.tournamentRound === 'bronze') {
          console.log('Showing tournament final/bronze match end overlay');
          this.showTournamentGameEndOverlay(finalState, true); // true = isSecondRound
        } else {
          console.log('Showing tournament first match end overlay');
          this.showTournamentGameEndOverlay(finalState);
        }
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

    // Game start callback - hide tournament lobby when actual game begins
    this.poolScene.setOnGameStartCallback(() => {
      if (this.tournamentLobbyOverlay) this.tournamentLobbyOverlay.style.display = "none";
      if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
      this.showQuitButton();
    });

    // Tournament registered callback - receives complete player list from server
    this.poolScene.setOnTournamentRegisteredCallback((tournamentId, players, state) => {

      // Use the authoritative player list from server
      this.tournamentPlayers = [...players];
      this.tournamentState = state;
      // Now hide connecting screen and show tournament lobby with complete data
      this.hideTournamentConnectingScreen();
      this.showTournamentLobbyScreen(tournamentId);
      // Update lobby with complete player information
      this.updateTournamentLobby(this.tournamentPlayers, this.tournamentState);
    });

    // Tournament player joined callback
    this.poolScene.setOnTournamentPlayerJoinedCallback((playerNumber, playerName, state) => {
      // Update tournament lobby with new player information
      this.onTournamentPlayerJoined(playerNumber, playerName, state);
    });

    // Tournament player left callback
    this.poolScene.setOnTournamentPlayerLeftCallback((playerNumber) => {
      // Update tournament lobby to remove player information
      this.onTournamentPlayerLeft(playerNumber, this.tournamentState);
    });

    // Tournament game invite callback - when server assigns players to tournament matches
    this.poolScene.setOnTournamentGameInviteCallback((roomId: string) => {
      this.onTournamentGameInvite(roomId);
    });

    // Tournament round finished callback - when a round completes
    this.poolScene.setOnTournamentRoundFinishedCallback((results: any, round: number) => {
      this.onTournamentRoundFinished(results);
    });

    // Tournament finished callback - receives complete tournament results
    this.poolScene.setOnTournamentFinishedCallback((results: any) => {
      this.onTournamentResults(results);
    });
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
    if (this.tournamentLobbyOverlay && this.tournamentLobbyOverlay.parentElement) {
      this.tournamentLobbyOverlay.parentElement.removeChild(this.tournamentLobbyOverlay);
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
    console.log('Game3D disposed.');
  }
}


