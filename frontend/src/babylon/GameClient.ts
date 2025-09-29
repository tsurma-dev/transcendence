import type { ServerToClient, ClientToServer, Snapshot, InputMessage} from "@shared/protocol";

export class GameClient {
  private ws?: WebSocket;
  private serverUrl: string;
  private snapshotHandler: (snap: Snapshot) => void = () => {};

  public playerName: string;
  public playerPosition: 1 | 2;
  public opponentName: string;
  public roomId: string;


  // Event handlers for game flow
  private roomJoinedHandler?: () => void;
  private gameStartHandler?: () => void;

  constructor(
    serverUrl: string,
    playerName: string,
    playerPosition: 1 | 2,
    opponentName: string,
    roomId: string
  ) {
    this.serverUrl = serverUrl;
    this.playerName = playerName;
    this.playerPosition = playerPosition;
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

    const message: ClientToServer = {
      type: "join-room",
      payload: {
        playerName: this.playerName,
        roomId: this.roomId,
        playerPosition: this.playerPosition
      }
    };

    console.log(`Joining room ${this.roomId} as ${this.playerName} (position ${this.playerPosition})`);
    this.ws.send(JSON.stringify(message));
  }

  public sendReadyToPlay(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const message: ClientToServer = {
      type: "start-game",
      payload: { playerName: this.playerName }
    };

    console.log(`${this.playerName} is ready to play`);
    this.ws.send(JSON.stringify(message));
  }

  private onMessage(event: MessageEvent): void {
    let message: ServerToClient;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse server message:", event.data);
      return;
    }

    console.log("Received from server:", message);

    switch (message.type) {
      case "room-joined":
        console.log(`✅ Successfully joined room ${this.roomId}`);
        if (this.roomJoinedHandler) {
          this.roomJoinedHandler();
        }
        break;

      case "ready-to-start":
        console.log(`🎮 Both players ready! Game starting...`);
        if (this.gameStartHandler) {
          this.gameStartHandler();
        }
        break;

      case "state":
        // Pass snapshot to game logic
        this.snapshotHandler(message.payload);
        break;

      default:
        console.warn("Unknown message type:", message);
        break;
    }
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
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: ClientToServer = {
      type: "input",
      payload: {
        at: Date.now(),
        key: key,
        pressed: pressed
      }
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