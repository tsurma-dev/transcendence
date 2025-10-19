import type { ServerToClient, ClientToServer } from "@shared/protocol";
import type { GameState } from "@shared/types";

export class GameClient {
  private ws?: WebSocket;
  private serverUrl: string;

  public playerName: string; // current player's name
  public roomId: string;
  private gameMode?: string;

  // Player data received from server
  private player1Name?: string; // PlayerID "first"
  private player2Name?: string; // PlayerID "second"

  // Event handlers
  private onRoomJoined?: (roomId: string) => void;
  private onRoomReady?: (player1Name: string, player2Name: string) => void;
  private onStartCountdown?: () => void;
  private onGameStart?: () => void;
  private onGameState?: (state: GameState) => void;
  private onGameOver?: (result: { player1Score: number; player2Score: number; winner: string }) => void;
  private onGameFailed?: (message: string) => void;

  // Tournament-specific event handlers
  private onTournamentRegistered?: (tournamentId: string, players: string[], state: string) => void;
  private onTournamentPlayerJoined?: (playerNumber: number, playerName: string, state: string) => void;
  private onTournamentGameInvite?: (roomId: string) => void;
  private onTournamentRoundFinished?: (results: any, round: number) => void;
  private onTournamentFinished?: (results: any) => void;


  constructor(serverUrl: string, playerName: string, roomId?: string, gameMode?: string) {
    this.serverUrl = serverUrl;
    this.playerName = playerName;
    this.roomId = roomId || '';
    this.gameMode = gameMode;
  }

  public connect(): void {
    this.ws = new WebSocket(this.serverUrl);

    this.ws.onopen = () => {
      console.log(`✅ Connected to server ${this.serverUrl}`);
      if (this.gameMode === 'tournament') {
        this.joinTournament();
      } else if (this.roomId) {
        this.joinRoom(this.roomId);
      } else if (this.gameMode === 'AI') {
        this.createAiRoom();
      } else {
        this.createRoom();
      }
    };

    this.ws.onmessage = (event) => {
      const message: ServerToClient = JSON.parse(event.data);
      this.handleServerMessage(message);
    };

    this.ws.onclose = () => console.log("❌ Disconnected from server");
    this.ws.onerror = (error) => console.error("WebSocket error:", error);
  }

  private sendMessage(message: ClientToServer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public createRoom(): void {
    this.sendMessage({
      type: "create",
      payload: { playerName: this.playerName }
    });
  }

  public createAiRoom(): void {
    this.sendMessage({
      type: "create-ai",
      payload: { playerName: this.playerName }
    });
  }

  public joinRoom(roomId: string): void {
    this.sendMessage({
      type: "join",
      payload: { playerName: this.playerName, roomId }
    });
  }

  public joinTournament(): void {
    this.sendMessage({
      type: "tournament-join",
      payload: { playerName: this.playerName }
    });
  }

  public sendReady(): void {
    const playerId = this.getMyPlayerId();
    if (!playerId) {
      console.error("Cannot send ready - player ID not determined yet");
      return;
    }

    this.sendMessage({
      type: "ready-to-play",
      payload: { roomId: this.roomId, playerId }
    });
  }

  public sendInput(direction: number): void {
    const playerId = this.getMyPlayerId();
    if (!playerId) return;

    this.sendMessage({
      type: "input",
      payload: { roomId: this.roomId, playerId, direction }
    });
  }

  private handleServerMessage(message: ServerToClient): void {
    switch (message.type) {
      case "room-joined":
        this.roomId = message.payload.roomId;
        console.log(`🎯 ${this.playerName} Joined room: ${this.roomId}`);
        this.onRoomJoined?.(this.roomId);
        break;

      case "room-ready":
        this.player1Name = message.payload.player1.name;
        this.player2Name = message.payload.player2.name;
        console.log(`🎮 Room ready! ${this.player1Name} vs ${this.player2Name}`);
        this.onRoomReady?.(this.player1Name, this.player2Name);
        break;

      case "start-countdown":
        console.log("⏰ Starting countdown...");
        this.onStartCountdown?.();
        break;

      case "game-start":
        console.log("🎮 Game starting!");
        this.onGameStart?.();
        break;

      case "game-state":
        // console.log("🔄 Game state update:", message.payload);
        const convertedState = this.convertServerState(message.payload);
        this.onGameState?.(convertedState);
        break;

      case "game-over":
        console.log("🏁 Game over!", message.payload);
        this.onGameOver?.(message.payload);
        break;

      case "game-failed":
        console.log("💥 Game failed!", message.payload);
        this.onGameFailed?.(message.payload.message || "Game failed");
        break;

      case "registered":
        console.log("🏆 Tournament registered:", message.payload);
        this.onTournamentRegistered?.(
          message.payload.tournamentId,
          message.payload.players,
          message.payload.state
        );
        break;

      case "tournament-player-joined":
        console.log("🏆 Tournament player joined:", message.payload);
        this.onTournamentPlayerJoined?.(
          message.payload.playerNumber,
          message.payload.playerName,
          message.payload.state
        );
        break;

      case "join-tournament-room":
        console.log("🏆 Tournament game invitation:", message.payload);
        this.onTournamentGameInvite?.(message.payload.roomId);
        break;

      case "tournament-first-round-finished":
        console.log("🏆 Tournament first round finished:", message.payload);
        this.onTournamentRoundFinished?.(message.payload, 1);
        break;

      case "tournament-finished":
        console.log("🏆 Tournament finished:", message.payload);
        this.onTournamentFinished?.(message.payload);
        break;

      default:
        // Handle error messages from server
        if (message && typeof message === 'object' && 'message' in message) {
          const errorMessage = (message as any).message;
          if (errorMessage === "Room full") {
            alert("This room is already full. Please try creating a new room or joining a different one.");
          } else {
            console.error("Server error:", errorMessage);
          }
        } else {
          console.warn("Unknown message:", message);
        }
    }
  }

  private getMyPlayerId(): "first" | "second" | null {
    if (this.player1Name === this.playerName) return "first";
    if (this.player2Name === this.playerName) return "second";
    return null;
  }

  // Convert server state format to client expected format
  private convertServerState(serverState: any): GameState {
    return {
      duck: {
        x: serverState.ballPosX || 0,
        z: serverState.ballPosZ || 0,
        dir: 0 // Server doesn't track ball rotation
      },
      player1: { x: serverState.paddle1X || 0 },
      player2: { x: serverState.paddle2X || 0 },
      scores: {
        player1: serverState.player1Score || 0,
        player2: serverState.player2Score || 0
      },
      status: serverState.gameState || 'playing',
      winner: serverState.winner || null,
      events: serverState.events || []
      // events: serverState.collision ? [{
      //   type: 'collision',
      //   collisionType: serverState.collision
      // }] : []
    };
  }

  public getMyPosition(): 1 | 2 | null {
    const playerId = this.getMyPlayerId();
    return playerId === "first" ? 1 : playerId === "second" ? 2 : null;
  }

  public updateRoomId(roomId: string): void {
    console.log("🏆 Updating GameClient room ID to:", roomId);
    this.roomId = roomId;
  }

  public switchToGameMode(): void {
    console.log("🏆 Switching GameClient from tournament to game mode");
    this.gameMode = 'online';
  }

  // Callback setters

  public setOnRoomJoined(handler: (roomId: string) => void): void {
    this.onRoomJoined = handler;
  }

  public setOnRoomReady(handler: (player1Name: string, player2Name: string) => void): void {
    this.onRoomReady = handler;
  }

  public setOnStartCountdown(handler: () => void): void {
    this.onStartCountdown = handler;
  }

  public setOnGameStart(handler: () => void): void {
    this.onGameStart = handler;
  }

  public setOnGameState(handler: (state: GameState) => void): void {
    this.onGameState = handler;
  }

  public setOnGameOver(handler: (result: { player1Score: number; player2Score: number; winner: string }) => void): void {
    this.onGameOver = handler;
  }

  public setOnGameFailed(handler: (message: string) => void): void {
    this.onGameFailed = handler;
  }

  // Tournament callback setters
  public setOnTournamentRegistered(handler: (tournamentId: string, players: string[], state: string) => void): void {
    this.onTournamentRegistered = handler;
  }

  public setOnTournamentPlayerJoined(handler: (playerNumber: number, playerName: string, state: string) => void): void {
    this.onTournamentPlayerJoined = handler;
  }

  public setOnTournamentGameInvite(handler: (roomId: string) => void): void {
    this.onTournamentGameInvite = handler;
  }

  public setOnTournamentRoundFinished(handler: (results: any, round: number) => void): void {
    this.onTournamentRoundFinished = handler;
  }

  public setOnTournamentFinished(handler: (results: any) => void): void {
    this.onTournamentFinished = handler;
  }

  public dispose(): void {
    this.ws?.close();
    this.ws = undefined;
  }
}
