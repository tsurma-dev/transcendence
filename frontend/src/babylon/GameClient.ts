import type { ServerToClient, ClientToServer, Snapshot, InputMessage } from "@shared/protocol";

export class GameClient {
  private ws: WebSocket;
  private snapshotHandler: (snap: Snapshot) => void = () => {};
  private myId: string | null = null;

  public get playerId(): string | null {
    return this.myId;
  }

  constructor(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);
    this.ws.onopen = () => this.onOpen();
    this.ws.onmessage = (event) => this.onMessage(event);
    this.ws.onclose = () => this.onClose();
    this.ws.onerror = (error) => console.error("WebSocket Error:", error);
  }

  private onOpen(): void {
    console.log("Connected to game server. Waiting for handshake...");
    // The client doesn't send anything first. It waits for the server's "hello".
  }

  private onClose(): void {
    console.log("Disconnected from server");
    // TODO: Show a "Disconnected" message on the UI?
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
        this.myId = message.payload.yourId;
        console.log(`Handshake complete. My player ID is ${this.myId}`);
        // Now that we're connected, we can start a ping loop
        this.startPingLoop();
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
    setInterval(() => {
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
}