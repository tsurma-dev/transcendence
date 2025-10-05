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
  private onGameOver?: (result: { player1Score: number; player2Score: number; winner: string}) => void;

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
      if (this.roomId) {
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

      default:
        console.warn("Unknown message:", message);
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
      events: serverState.collision ? [{
        type: 'collision',
        collisionType: serverState.collision
      }] : []
    };
  }

  public getMyPosition(): 1 | 2 | null {
    const playerId = this.getMyPlayerId();
    return playerId === "first" ? 1 : playerId === "second" ? 2 : null;
  }

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

  public dispose(): void {
    this.ws?.close();
    this.ws = undefined;
  }
}
