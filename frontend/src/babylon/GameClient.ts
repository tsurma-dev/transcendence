import type { ServerToClient, ClientToServer, Snapshot, InputMessage, RoomCreatedPayload, RoomJoinedPayload, GameOverPayload, GameStartPayload, GameStatePayload} from "@shared/protocol";
import { GameState } from "@shared/types";

export class GameClient {
  private ws?: WebSocket;
  private serverUrl: string;
  private snapshotHandler: (snap: Snapshot) => void = () => {};
  private clientId: string | null = null;
  public playerName: string | null = null;
  public opponentName: string | null = null;
  public playerId: string | null = null;
  public playerPosition: 1 | 2 | null = null;
  private pingInterval: number | null = null;
  public roomId: string | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    // Don't connect immediately
  }

  // Connect when ready**
  public connect(): void {
    if (this.ws) return; // Already connected

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
      this.ws.send(JSON.stringify({ type: "play", roomId: this.roomId, playerId: this.playerId }));
    }
  }

  private onOpen(): void {
    console.log("Connected to game server. Waiting for handshake...");
    this.joinRoom(this.playerName, this.roomId);
  }

  private onClose(): void {
    console.log("Disconnected from server");
  }

  public createRoom(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    const msg = { type: "create" };
    this.ws.send(JSON.stringify(msg));
  }

  public joinRoom(playerName: string | null, roomId: string | null): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    const msg = {
      type: "join",
      roomId: roomId,
      name: playerName
    };
    this.ws.send(JSON.stringify(msg));
  }

  public leaveRoom(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    const msg = { type: "leave-room" };
    this.ws.send(JSON.stringify(msg));
  }

  public setReady(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    const msg = { type: "ready" };
    this.ws.send(JSON.stringify(msg));
  }

  private onMessage(event: MessageEvent): void {
    let message : ServerToClient;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse server message:", event.data);
      return;
    }

    switch (message.type) {
      case "hello":
        this.clientId = message.payload.yourId;
        console.log(`Handshake complete. ${this.clientId} has joined!`);
        // Start sending pings to measure latency
        this.startPingLoop();
        break;

      case "room-created":
        this.handleRoomCreated(message.payload);
        break;
      case "room-joined":
        this.handleRoomJoined(message.payload);
        break;
      case "room-error":
        this.handleRoomError(message.payload);
        break;
      case "game-start":
        this.handleGameStart(message.payload);
        break;
      case "game-over":
        this.handleGameOver(message.payload);
        break;

      case 'playerAssignment':
          this.playerName = message.payload.playerName;
          this.playerPosition = message.payload.position;
          console.log(`Paddle ${this.playerPosition} assigned to ${this.playerName}`);
          break;

      case "state":
        // The payload is the snapshot. Pass it to the handler.
        // convert message.payload to Snapshot type
        const snapshot = this.makeSnapshot(message.payload);
        this.snapshotHandler(snapshot);
        break;

      case "pong":
        // Calculate latency if needed
        const latency = Date.now() - message.payload.t;
        console.log(`Pong received. Latency: ${latency}ms`);
        break;
    }
  }

  /**
   * Sends a ping to the server every 2 seconds to keep the connection alive
   * and measure latency.
   */
  private startPingLoop(): void {
    this.pingInterval = setInterval(() => {
      const message: ClientToServer = {
        type: "ping",
        payload: { t: Date.now() }
      };
      this.ws?.send(JSON.stringify(message));
    }, 2000);
  }

    private handleRoomCreated(payload: RoomCreatedPayload): void {
    this.roomId = payload.roomId;
    this.playerPosition = payload.position;
    console.log(`✅ Room created: ${this.roomId}, you are player ${payload.position}`);
  }

  private handleRoomJoined(payload: RoomJoinedPayload): void {
    //console.log("Room joined:", payload);
    this.roomId = payload.room;
    this.playerId = payload.playerId;
    if (payload.playerId === "first")
    this.playerPosition = 1;
    else if (payload.playerId === "second")
      this.playerPosition = 2;
    console.log(`✅ Joined room: ${this.roomId}, you are player ${this.playerPosition}`);
  }

  private handleGameStart(payload: GameStartPayload): void {
    console.log(`🎮 Game starting! ${payload.player1Name} vs ${payload.player2Name}`);
    // Notify UI that game is starting
  }

  private handleGameOver(payload: GameOverPayload): void {
    console.log(`🏁 Game over! Winner: ${payload.winner}`);
    console.log(`Final score: ${payload.player1Score} - ${payload.player2Score}`);
    // Notify UI of game results
  }

  private handleRoomError(payload: { message: string }): void {
    console.error(`❌ Room error: ${payload.message}`);
    // Notify UI of error
  }

  private makeSnapshot(payload: GameStatePayload): Snapshot {
    const state: GameState = {
      players: { 
        ["Player 1"]: { x: payload.paddle1X, position: 1 }, 
        ["Player 2"]: { x: payload.paddle2X, position: 2 } 
      },
      //roomId: this.roomId,
      scores: { 
        ["Player 1"]: payload.player1Score, 
        ["Player 2"]: payload.player2Score 
      },
      duck: {
        x: payload.ballPosX, 
        z: payload.ballPosZ, 
        dir: 0
      },
      gameType: 'online',
      status: payload.gameState, // 'waiting' | 'playing' | 'finished';
      //winner: payload.winner, // present if status === 'finished'
      events: [{ type: 'collision', collisionType: payload.collision }],
    }
    console.log("Snapshot received:", state);
    return {state};
  }

  /** Register a callback to be invoked for each game state snapshot */
  setSnapshotHandler(handler: (snap: Snapshot) => void): void {
    this.snapshotHandler = handler;
  }

  /** Call this on key press/release to send input to the server */
  sendInput(key: string, pressed: boolean): void {
    // Construct the message according to the protocol
  //   const inputPayload: InputMessage = {
  //     at: Date.now(),
  //     key: key,
  //     pressed: pressed
  //   };

  let direction: number = 0;

  if (key === "ArrowLeft" && pressed){
    if (this.playerPosition === 1)
      direction = 1;
    else if (this.playerPosition === 2)
      direction = -1;
  }
  else if (key === "ArrowRight" && pressed){
    if (this.playerPosition === 1)
      direction = -1;
    else if (this.playerPosition === 2)
      direction = 1;
  }
  
    const message = {
      type: "input",
      roomId: this.roomId,
      playerId: this.playerId,
      direction: direction  
   };
    this.ws?.send(JSON.stringify(message));
  }

  /** Clean up WebSocket connection and resources */
  dispose(): void {
    // Stop ping loop
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

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
    this.snapshotHandler = () => {}; // Reset to empty function
    this.clientId = null;
    this.playerName = null;
    this.playerPosition = null;

    console.log("GameClient disposed");
  }
}