import type { ServerToClient, ClientToServer, Snapshot, InputMessage} from "@shared/protocol";

export class GameClient {
  private ws: WebSocket;
  private snapshotHandler: (snap: Snapshot) => void = () => {};
  private clientId: string | null = null;
  public playerName: string | null = null;
  public playerPosition: 1 | 2 | null = null;
  private pingInterval: number | null = null;

  constructor(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);
    this.ws.onopen = () => this.onOpen();
    this.ws.onmessage = (event) => this.onMessage(event);
    this.ws.onclose = () => this.onClose();
    this.ws.onerror = (error) => console.error("WebSocket Error:", error);
  }

  private onOpen(): void {
    console.log("Connected to game server. Waiting for handshake...");
  }

  private onClose(): void {
    console.log("Disconnected from server");
  }

  private onMessage(event: MessageEvent): void {
    let message: ServerToClient;
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

      case 'playerAssignment':
          this.playerName = message.payload.playerName;
          this.playerPosition = message.payload.position;
          console.log(`Paddle ${this.playerPosition} assigned to ${this.playerName}`);
          break;

      case "state":
        // The payload is the snapshot. Pass it to the handler.
        this.snapshotHandler(message.payload);
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
      this.ws.send(JSON.stringify(message));
    }, 2000);
  }

  /** Register a callback to be invoked for each game state snapshot */
  setSnapshotHandler(handler: (snap: Snapshot) => void): void {
    this.snapshotHandler = handler;
  }

  /** Call this on key press/release to send input to the server */
  sendInput(key: string, pressed: boolean): void {
    // Construct the message according to the protocol
    const inputPayload: InputMessage = {
      at: Date.now(),
      key: key,
      pressed: pressed
    };

    const message: ClientToServer = {
      type: "input",
      payload: inputPayload
    };

    this.ws.send(JSON.stringify(message));
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