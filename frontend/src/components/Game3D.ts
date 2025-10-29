import { PoolScene } from "../babylon/PoolScene";
import { Game3DOverlays } from "./Game3DOverlays";
import { TournamentManager } from "./TournamentManager";
import type { GameMode } from "./types";

export class Game3DComponent {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private poolScene?: PoolScene;

  // Game parameters
  private gameMode: GameMode;
  private player1Name: string; // current user
  private player2Name?: string; // opponent (optional - only provided for local games)
  private roomId?: string; // room ID for joinRoom

  // Full screen overlays
  private overlays: Game3DOverlays;

  // Tournament management
  private tournament?: TournamentManager;

  private returnToMenuCallback?: () => void;

  constructor(
    container: HTMLElement,
    player1Name: string, // current user (required)
    gameMode: GameMode, // game mode (required)
    player2Name?: string, // opponent (optional, only for local)
    roomId?: string, // room ID (optional, only for joinRoom)
    returnToMenuCallback?: () => void // callback for returning to menu
  ) {
    this.container = container;
    this.player1Name = player1Name;
    this.gameMode = gameMode;
    this.player2Name = player2Name;
    this.roomId = roomId;
    this.returnToMenuCallback = returnToMenuCallback;
    this.overlays = new Game3DOverlays(this.container);
    this.overlays.onReturnToMenu = async () => {
      if (this.returnToMenuCallback) {
        this.returnToMenuCallback();
      }
    }
    if (gameMode === 'tournament') {
      this.tournament = new TournamentManager();
    };
  }

  initialize(): void {
    console.log('🎮 Initializing 3D Game - Mode:', this.gameMode, 'Player1:', this.player1Name, 'Player2:', this.player2Name, 'RoomID:', this.roomId);
    this.createCanvas();
    this.overlays.setupUI();
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

  // ============================================================================
  // GAME FLOW METHODS
  // ============================================================================

  private async startGameFlow(): Promise<void> {

    switch (this.gameMode) {
      case 'local':
        this.overlays.showLoadingScreen();
        await this.startLocalGame();
        break;
      case 'createRoom':
        this.overlays.showLoadingScreen();
        await this.startCreateRoomGame();
        break;
      case 'joinRoom':
        this.overlays.showLoadingScreen();
        await this.startJoinRoomGame();
        break;
      case 'AI':
        this.overlays.showLoadingScreen();
        await this.startAIGame();
        break;
      case 'tournament':
        this.overlays.showLoadingScreen();
        await this.startTournamentMode();
        break;
    }
  }

  private async startLocalGame(): Promise<void> {
    console.log('🎮 Setting up local game');

    try {
      this.poolScene = new PoolScene(this.canvas, 'local', this.player1Name, this.player2Name);
      this.setupCallbacks();
      await this.waitForAssetsToLoadLocal();
      await this.poolScene.startAnimation();
    } catch (error) {
      console.error('Failed to initialize local game:', error);

    }
  }

  private restartLocalGame(): void {
    if (this.gameMode !== 'local' || !this.poolScene) return;
    this.overlays.hideGameEndOverlay();
    this.poolScene.restartQuick();
    this.overlays.showQuitButton();
  }

  private async startCreateRoomGame(): Promise<void> {
    console.log('🌐 Setting up createRoom game');

    try {
      this.poolScene = new PoolScene(this.canvas, 'online', this.player1Name);
      this.setupCallbacks();
      this.overlays.showRoomCreatedScreen();
      await this.waitForAssetsToLoad();
    } catch (error) {
      console.error('Failed to initialize createRoom game:', error);
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
      this.setupCallbacks();
      await this.waitForAssetsToLoad();
    } catch (error) {
      console.error('Failed to initialize joinRoom game:', error);
    }
  }

  private async startAIGame(): Promise<void> {
    console.log('🤖 Setting up AI game');
    try {
      this.poolScene = new PoolScene(this.canvas, 'AI', this.player1Name, 'AI');
      this.setupCallbacks();
      await this.waitForAssetsToLoadLocal();
    } catch (error) {
      console.error('Failed to initialize AI game:', error);
    }
  }

  private async startTournamentMode(): Promise<void> {
    console.log('🏆 Setting up tournament mode');
    try {
      this.overlays.showTournamentConnectingScreen();
      this.poolScene = new PoolScene(this.canvas, 'tournament', this.player1Name);
      this.setupCallbacks();
      this.overlays.poolScene = this.poolScene; // Link for disposal
    } catch (error) {
      console.error('Failed to initialize tournament:', error);
    }
  }

  // Start the tournament game with the given room ID
  private async startTournamentGame(tournamentRoomId: string): Promise<void> {
    console.log("🏆 Starting game in room:", tournamentRoomId);
    this.overlays.hideTournamentLobbyScreen();
    this.overlays.hideGameEndOverlay();
    this.overlays.showLoadingScreen();
    if (this.tournament!.getRound() === 'final' || this.tournament!.getRound() === 'bronze') {
      if (this.poolScene) {
        await this.poolScene.resetTournamentVisualState();
      }
    }
    this.poolScene?.updateRoomIdandSendJoin(tournamentRoomId);
    this.tournament?.setTournamentRoomId(''); //reset tournamentRoomId after use
    await this.waitForAssetsToLoad();
  }

  // ============================================================================
  // GAME HELPER METHODS
  // ============================================================================

  private async waitForAssetsToLoad(): Promise<void> {
    if (!this.poolScene) throw new Error('PoolScene not initialized');

    return new Promise<void>((resolve) => {
      this.poolScene!.setOnLoadedCallback(() => {
        this.overlays.hideLoadingScreen();
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
    this.overlays.hideRoomCreatedScreen();
    this.overlays.hideLoadingScreen();

    // Show the disconnect overlay with the message
    this.overlays.showDisconnectOverlay(message);
  }



  public updateRoomId(roomId: string): void {
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    if (roomIdDisplay) {
      roomIdDisplay.textContent = roomId;
    }
  }



  // ============================================================================
  // CALLBACK SETUP METHODS
  // ============================================================================

  private setupCallbacks(): void {
    if (!this.poolScene) return;

    // GAME END CALLBACK
    this.poolScene.setOnGameEndCallback((finalState) => {
      this.overlays.hideQuitButton();
      const winner = finalState.winner;
      const isLocalGame = this.gameMode === 'local';

      if (this.gameMode !== 'tournament') {
        this.overlays.showGameEndOverlay(winner!, isLocalGame);
        return;
      }
      if (this.tournament?.getRound() === 'semifinals') {
        this.tournament!.setAfterRound(1);
      }
      else {
        this.tournament!.setAfterRound(2);
      }
      const round = this.tournament?.getRound();
      const state = this.tournament?.getState();
      const isCurrentPlayerWinner = winner === this.player1Name;
      const roomId = this.tournament?.getTournamentRoomId();
      const currentRound = this.tournament!.getRound();
      if (currentRound === 'semifinals') {
        if (this.player1Name === finalState.winner) {
          this.tournament!.setRound('final');
          console.log('🏆 Advancing to FINAL round');
        } else {
          this.tournament!.setRound('bronze');
          console.log('🏆 Advancing to BRONZE round');
        }
      }

      this.overlays.showTournamentGameEndOverlay(round!, state!, isCurrentPlayerWinner, winner!, roomId!, this.tournament!.getAfterRound());
    });

    // RESTART LOCAL GAME CALLBACK
    this.overlays.onRestartLocalGame = () => {
      this.restartLocalGame();
    };

    // GAME FAILED CALLBACK
    this.poolScene.setOnGameFailedCallback((message) => {
      this.overlays.hideQuitButton();
      this.handleGameFailure(message);
    });

    // SCREEN CALLBACKS
    if (this.gameMode === 'local' || this.gameMode === 'AI') {
      // For local games, hide loading screen when camera intro starts
      this.poolScene.setOnGameStartCallback(() => {
        this.overlays.hideLoadingScreen();
        this.overlays.showQuitButton();
      });
    } else if (this.gameMode === 'createRoom' || this.gameMode === 'joinRoom') {
      // Only set up multiplayer callbacks for online modes
      this.setupOnlineCallbacks();
    } else if (this.gameMode === 'tournament') {
      // Set up tournament callbacks
      this.setupTournamentCallbacks();
    }
  }

  // REMOTE SPECIFIC CALLBACKS
  private setupOnlineCallbacks(): void {
    if (!this.poolScene) return;

    // Game start callback to hide waiting screens
    this.poolScene.setOnGameStartCallback(() => {
      this.overlays.hideRoomCreatedScreen();
      // this.overlays.hideLoadingScreen();
      this.overlays.showQuitButton();
    });

    // Room ID callback for createRoom mode
    if (this.gameMode === 'createRoom') {
      this.poolScene.setOnRoomIdCallback((roomId) => {
        this.updateRoomId(roomId);
      });
    }
  }

  // TOURNAMENT SPECIFIC CALLBACKS
  private setupTournamentCallbacks(): void {
    if (!this.poolScene) return;

    // Tournament registered callback - initialize tournament lobby with current players
    this.poolScene.setOnTournamentRegisteredCallback((players) => {
      this.tournament!.registerPlayer(players);
      this.overlays.hideTournamentConnectingScreen();
      this.overlays.showTournamentLobbyScreen();
      this.overlays.updateTournamentLobby(this.tournament!.getPlayers(), this.tournament!.getState());
    });

    // New player joins tournament
    this.poolScene.setOnTournamentPlayerJoinedCallback((playerNumber, playerName) => {
      this.tournament!.addPlayer(playerNumber, playerName);
      this.overlays.updateTournamentLobby(this.tournament!.getPlayers(), this.tournament!.getState());
    });

    // Tournament player left callback
    this.poolScene.setOnTournamentPlayerLeftCallback((playerName) => {
      this.tournament!.removePlayer(playerName);
      this.overlays.updateTournamentLobby(this.tournament!.getPlayers(), this.tournament!.getState());
    });

    // Tournament game invite callback - when server assigns players to tournament matches
    this.poolScene.setOnTournamentGameInviteCallback((roomId: string) => {
      this.tournament!.onGameInvite(roomId);
      if (this.tournament!.getRound() === 'semifinals') {
        this.overlays.updateTournamentLobby(this.tournament!.getPlayers(), this.tournament!.getState());
        this.overlays.showStartTournamentButton(roomId);
      }
      else {
        this.tournament!.setTournamentRoomId(roomId);
        this.overlays.updateGameEndOverlayMessage(roomId);
      }
    });

    // Game start callback - hide tournament lobby when actual game begins
    this.poolScene.setOnGameStartCallback(() => {
      this.overlays.hideTournamentLobbyScreen();
      // this.overlays.hideLoadingScreen();
      this.overlays.showQuitButton();
    });

    // Tournament round finished callback - when a round completes
    this.poolScene.setOnTournamentRoundFinishedCallback((results: any, round: number) => {
      this.overlays.updateTournamentFirstRoundResults(results);
    });

    // Tournament finished callback - receives complete tournament results
    this.poolScene.setOnTournamentFinishedCallback((results: any) => {
      this.tournament!.setState('finished');
      this.overlays.updateTournamentFinalResults(results);
      this.overlays.updateSeeResultsButton();
    });

    // Start tournament game (triggered by start button or continue button)
    this.overlays.onStartTournamentGame = async (roomId: string) => {
      await this.startTournamentGame(roomId);
    };
  }


  // ===========================================================================
  // DISPOSE METHOD
  // ===========================================================================
  dispose(): void {
    if (this.poolScene) {
      this.poolScene.dispose();
    }

    // Remove UI elements
    if (this.overlays) {
      this.overlays.dispose();
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
    console.log('🧹 Game3D disposed.');
  }
}


