import type { Snapshot } from "@shared/protocol";
import type { GameState, GameStatus } from "@shared/types";

export class GameClient {
  private ws?: WebSocket;
  private serverUrl: string;
  private snapshotHandler: (snap: Snapshot) => void = () => {};

  public playerName: string;
  public playerPosition?: 1 | 2; // Will be set by server
  public opponentName: string;
  public roomId: string;
  private stateUpdateCount = 0; // For debugging


  // Event handlers for game flow
  private roomJoinedHandler?: () => void;
  private gameStartHandler?: () => void;

  constructor(
    serverUrl: string,
    playerName: string,
    opponentName: string,
    roomId: string
  ) {
    this.serverUrl = serverUrl;
    this.playerName = playerName;
    this.opponentName = opponentName;
    this.roomId = roomId;
  }

  public connect(): void {
    this.ws = new WebSocket(this.serverUrl);
    console.log(`Connecting to game server at ${this.serverUrl}...`);
    this.ws.onopen = () => this.onOpen();
    this.ws.onmessage = (event) => this.onMessage(event);
    this.ws.onclose = () => this.onClose();
    this.ws.onerror = (error) => console.error("WebSocket Error:", error);
  }

  public sendMsg(msg: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    if (msg === "play") {
      this.ws.send(JSON.stringify({ type: "play", roomId: this.roomId, playerId: this.playerName }));
    }
  }

  private onOpen(): void {
    console.log("✅ Connected to game server");
    // Auto-join room after connection
    this.joinRoom();
  }

   private onClose(): void {
    console.log("Disconnected from server");
  }

  private joinRoom(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    // Server expects type: "join" with roomId and playerName
    // If roomId is the default "42", let server assign us to an available room
    const message = {
      type: "join",
      roomId: this.roomId === "42" ? null : this.roomId, // Let server handle room assignment for default room
      playerName: this.playerName
    };

    console.log(`Joining room ${this.roomId === "42" ? "(auto-assign)" : this.roomId} as ${this.playerName} (position ${this.playerPosition})`);
    this.ws.send(JSON.stringify(message));
  }

  public sendReadyToPlay(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    // Server expects type: "play" with roomId and playerId
    // The server will use "first" or "second" for playerId based on join order
    const playerId = this.playerPosition === 1 ? "first" : "second";
    const message = {
      type: "play",
      roomId: this.roomId,
      playerId: playerId
    };

    console.log(`${this.playerName} is ready to play - sending to room ${this.roomId}`);
    this.ws.send(JSON.stringify(message));
  }

  private onMessage(event: MessageEvent): void {
    let message: any;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse server message:", event.data);
      return;
    }

    console.log("Received from server:", message);

    // Handle error messages that don't have a 'type' property
    if (message.message && !message.type) {
      console.error("❌ Server error:", message.message);
      // You could add error handler callback here if needed
      return;
    }

    switch (message.type) {
      case "room-joined":
        // Extract player position and actual room ID from server response
        if (message.payload && message.payload.playerId) {
          this.playerPosition = message.payload.playerId === "first" ? 1 : 2;
          // Update roomId to the actual room assigned by server
          if (message.payload.room) {
            console.log(`🔄 Updating room ID from "${this.roomId}" to "${message.payload.room}"`);
            this.roomId = message.payload.room;
          }
          console.log(`✅ Successfully joined room ${this.roomId} as player ${this.playerPosition}`);
        } else {
          console.log(`✅ Successfully joined room ${this.roomId}`);
        }
        if (this.roomJoinedHandler) {
          this.roomJoinedHandler();
        }
        break;

      case "game-start":
        console.log(`🎮 Both players ready! Game starting...`);
        if (this.gameStartHandler) {
          this.gameStartHandler();
        }
        break;

      case "state":
        // Server sends state directly in payload, but snapshotHandler expects snapshot.state
        // Create a snapshot-like object to match the expected format
        if (message.payload) {
          // Debug: log first few state updates to see the format
          if (!this.stateUpdateCount) this.stateUpdateCount = 0;
          this.stateUpdateCount++;
          if (this.stateUpdateCount <= 3) {
            console.log("Raw state from server #" + this.stateUpdateCount + ":", message.payload);
          }
          
          // Convert server format to client format
          const adaptedState = this.adaptServerState(message.payload);
          if (this.stateUpdateCount <= 3) {
            console.log("Adapted state #" + this.stateUpdateCount + ":", adaptedState);
          }
          
          this.snapshotHandler({ state: adaptedState });
        }
        break;

      case "error":
        console.error("❌ Server error:", message.message || message);
        break;

      default:
        console.warn("Unknown message type:", message);
        break;
    }
  }

  // Adapter to convert server state format to client expected format
  private adaptServerState(serverState: any): GameState {
    // Server format: { ballPosX, ballPosZ, paddle1X, paddle2X, player1Score, player2Score, gameState, winner }
    // Client expects: { players, roomId, scores, duck, status, winner, events }
    
    return {
      players: {
        [this.playerName]: {
          x: this.playerPosition === 1 ? (serverState.paddle1X || 0) : (serverState.paddle2X || 0),
          position: this.playerPosition === 1 ? 1 : 2,
          connected: true,
          ready: true
        },
        [this.opponentName]: {
          x: this.playerPosition === 1 ? (serverState.paddle2X || 0) : (serverState.paddle1X || 0),
          position: this.playerPosition === 1 ? 2 : 1,
          connected: true,
          ready: true
        }
      },
      roomId: this.roomId,
      scores: {
        [this.playerName]: this.playerPosition === 1 ? (serverState.player1Score || 0) : (serverState.player2Score || 0),
        [this.opponentName]: this.playerPosition === 1 ? (serverState.player2Score || 0) : (serverState.player1Score || 0),
      },
      duck: {
        x: serverState.ballPosX || 0,
        z: serverState.ballPosZ || 0,
        dir: 0 // Ball direction - server doesn't provide this yet
      },
      status: (serverState.gameState === 'finished' ? 'finished' : 'playing') as GameStatus,
      winner: serverState.winner,
      events: [] // Server doesn't provide events yet
    };
  }

  // Event handler setters
  public setRoomJoinedHandler(handler: () => void): void {
    this.roomJoinedHandler = handler;
  }

  public setGameStartHandler(handler: () => void): void {
    this.gameStartHandler = handler;
  }

  /** Register a callback to be invoked for each game state snapshot */
  public setSnapshotHandler(handler: (snap: Snapshot) => void): void {
    this.snapshotHandler = handler;
  }

  /** Send input to server */
  public sendInput(key: string, pressed: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerPosition) {
      return;
    }

  let direction: number = 0;

  if (key === "ArrowLeft" && pressed){
    if (this.playerPosition === 1)
      direction = -1;
    else if (this.playerPosition === 2)
      direction = 1;
  }
  else if (key === "ArrowRight" && pressed){
    if (this.playerPosition === 1)
      direction = 1;
    else if (this.playerPosition === 2)
      direction = -1;
  }

    // Server expects playerId to be "first" or "second"
    const playerId = this.playerPosition === 1 ? "first" : "second";
    const message = {
      type: "input",
      roomId: this.roomId,
      playerId: playerId,
      direction: direction  
   };

    this.ws.send(JSON.stringify(message));
  }

  /** Clean up WebSocket connection and resources */
  public dispose(): void {
    // Close WebSocket connection
    if (this.ws) {
      // Remove event listeners to prevent callbacks after disposal
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      // Close connection if still open
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
    }

    // Clear references
    this.snapshotHandler = () => {};
    this.roomJoinedHandler = undefined;
    this.gameStartHandler = undefined;

    console.log("GameClient disposed");
  }
}