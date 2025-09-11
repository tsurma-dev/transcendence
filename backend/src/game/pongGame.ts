class Game {
// better to have these as constants or configurable parameters
  private readonly WIDTH = 800
  private readonly HEIGHT = 400

  // Ball settings
  private ballX: number = this.WIDTH / 2
  private ballY: number = this.HEIGHT / 2
  private ballRadius: number = 10
  private ballSpeedX: number = 5
  private ballSpeedY: number = 3

  // Paddles settings
  private readonly paddleWidth = 10
  private readonly paddleHeight = 100
  private readonly paddleSpeed = 6

  private paddle1Y: number = this.HEIGHT / 2 - this.paddleHeight / 2
  private paddle2Y: number = this.HEIGHT / 2 - this.paddleHeight / 2

  private paddleMove: Record<string, boolean> = {
	'p1Up':   false,
	'p1Down': false,
	'p2Up':   false,
	'p2Down': false
  }

  private isRunning: boolean = false

  // Score tracking
  private player1Score: number = 0
  private player2Score: number = 0
  private onScoreUpdate?: (player1Score: number, player2Score: number) => void

  constructor() {

  }

  start(): void {
    this.isRunning = true
    this.gameLoop()
  }

  stop(): void {
    this.isRunning = false
  }

  setScoreCallback(callback: (player1Score: number, player2Score: number) => void): void {
    this.onScoreUpdate = callback
  }

  private update(): void {
    // Move paddles
    if (this.paddleMove['p1Up'] && this.paddle1Y > 0) this.paddle1Y -= this.paddleSpeed
    if (this.paddleMove['p1Down'] && this.paddle1Y + this.paddleHeight < this.HEIGHT) this.paddle1Y += this.paddleSpeed
    if (this.paddleMove['p2Up'] && this.paddle2Y > 0) this.paddle2Y -= this.paddleSpeed

    if (this.paddleMove['p2Down'] && this.paddle2Y + this.paddleHeight < this.HEIGHT) this.paddle2Y += this.paddleSpeed


    // Move ball
    this.ballX += this.ballSpeedX
    this.ballY += this.ballSpeedY

    // Bounce top/bottom
    if (this.ballY < 0 || this.ballY > this.HEIGHT) this.ballSpeedY *= -1

    // Bounce paddles
    if (
      (this.ballX - this.ballRadius < this.paddleWidth &&
       this.ballY > this.paddle1Y &&
       this.ballY < this.paddle1Y + this.paddleHeight)
      ||
      (this.ballX + this.ballRadius > this.WIDTH - this.paddleWidth &&
       this.ballY > this.paddle2Y &&
       this.ballY < this.paddle2Y + this.paddleHeight)
    ) {
      this.ballSpeedX *= -1
    }

    // Reset if out of bounds and update score
    if (this.ballX < 0) {
      // Player 2 scores
      this.player2Score++
      this.resetBall()
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.player1Score, this.player2Score)
      }
    } else if (this.ballX > this.WIDTH) {
      // Player 1 scores
      this.player1Score++
      this.resetBall()
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.player1Score, this.player2Score)
      }
    }
  }

  private resetBall(): void {
    this.ballX = this.WIDTH / 2
    this.ballY = this.HEIGHT / 2
    this.ballSpeedX *= -1 // Change direction
  }

  private gameLoop(): void {
    if (this.isRunning) {
      this.update()
    }
  }

  cleanup(): void {
    this.stop()

  }
}

/*class PongGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number = 0

  private readonly WIDTH = 800
  private readonly HEIGHT = 400

  // Ball settings
  private ballX: number = this.WIDTH / 2
  private ballY: number = this.HEIGHT / 2
  private ballRadius: number = 10
  private ballSpeedX: number = 5
  private ballSpeedY: number = 3

  // Paddles settings
  private readonly paddleWidth = 10
  private readonly paddleHeight = 100
  private readonly paddleSpeed = 6

  private leftPaddleY: number = this.HEIGHT / 2 - this.paddleHeight / 2
  private rightPaddleY: number = this.HEIGHT / 2 - this.paddleHeight / 2

  private keys: Record<string, boolean> = {}
  private isRunning: boolean = false

  // Score tracking
  private player1Score: number = 0
  private player2Score: number = 0
  private onScoreUpdate?: (player1Score: number, player2Score: number) => void

  private socket = new WebSocket("wss://localhost:8443/ws/pong");

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupEventListeners()
    this.setupWS()
  }

  private setupWS(): void {
    this.socket.onopen = () => {
      console.log("Connected to server via wss")
      // TODO: work out logic with rooms
      this.socket.send(JSON.stringify({ action: "join", roomId: "42" }))
    }

    this.socket.onmessage = (event) => {
      console.log("received ws msg: " + event.data)
      const data = JSON.parse(event.data)
      if (data.action == "update") {
        switch (data.object) {
          case "paddle":
            this.leftPaddleY = data.y
            break
          default:
            console.warn("Received an unknown object update:", data.object)
        }
      }
    }
  }

  private setupEventListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => { this.keys[e.key] = true }
    const handleKeyUp = (e: KeyboardEvent) => { this.keys[e.key] = false }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Store references for cleanup
    this.canvas.setAttribute('data-keydown-handler', 'true')
    ;(this.canvas as any).keydownHandler = handleKeyDown
    ;(this.canvas as any).keyupHandler = handleKeyUp
  }

  start(): void {
    this.isRunning = true
    this.gameLoop()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  setScoreCallback(callback: (player1Score: number, player2Score: number) => void): void {
    this.onScoreUpdate = callback
  }

  private update(): void {
    // Move paddles
    if (this.keys['w'] && this.leftPaddleY > 0) this.leftPaddleY -= this.paddleSpeed
    if (this.keys['s'] && this.leftPaddleY + this.paddleHeight < this.HEIGHT) this.leftPaddleY += this.paddleSpeed
    if (this.keys['ArrowUp'] && this.rightPaddleY > 0) {
      this.rightPaddleY -= this.paddleSpeed
      this.socket.send(JSON.stringify({ action: "update", object: "paddle", y: this.rightPaddleY }))
    }
    if (this.keys['ArrowDown'] && this.rightPaddleY + this.paddleHeight < this.HEIGHT) {
      this.rightPaddleY += this.paddleSpeed
      this.socket.send(JSON.stringify({ action: "update", object: "paddle", y: this.rightPaddleY }))
    }

    // Move ball
    this.ballX += this.ballSpeedX
    this.ballY += this.ballSpeedY

    // Bounce top/bottom
    if (this.ballY < 0 || this.ballY > this.HEIGHT) this.ballSpeedY *= -1

    // Bounce paddles
    if (
      (this.ballX - this.ballRadius < this.paddleWidth &&
       this.ballY > this.leftPaddleY &&
       this.ballY < this.leftPaddleY + this.paddleHeight)
      ||
      (this.ballX + this.ballRadius > this.WIDTH - this.paddleWidth &&
       this.ballY > this.rightPaddleY &&
       this.ballY < this.rightPaddleY + this.paddleHeight)
    ) {
      this.ballSpeedX *= -1
    }

    // Reset if out of bounds and update score
    if (this.ballX < 0) {
      // Player 2 scores
      this.player2Score++
      this.resetBall()
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.player1Score, this.player2Score)
      }
    } else if (this.ballX > this.WIDTH) {
      // Player 1 scores
      this.player1Score++
      this.resetBall()
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.player1Score, this.player2Score)
      }
    }
  }

  private resetBall(): void {
    this.ballX = this.WIDTH / 2
    this.ballY = this.HEIGHT / 2
    this.ballSpeedX *= -1 // Change direction
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT)

    // Background
    this.drawRect(0, 0, this.WIDTH, this.HEIGHT, 'black')

    // Paddles
    this.drawRect(0, this.leftPaddleY, this.paddleWidth, this.paddleHeight, 'white')
    this.drawRect(this.WIDTH - this.paddleWidth, this.rightPaddleY, this.paddleWidth, this.paddleHeight, 'white')

    // Ball
    this.drawCircle(this.ballX, this.ballY, this.ballRadius, 'white')
  }

  private drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, w, h)
  }

  private drawCircle(x: number, y: number, r: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private gameLoop(): void {
    if (this.isRunning) {
      this.update()
      this.draw()
      this.animationId = requestAnimationFrame(() => this.gameLoop())
    }
  }

  cleanup(): void {
    this.stop()

    // Remove event listeners
    const canvas = this.canvas as any
    if (canvas.keydownHandler) {
      window.removeEventListener('keydown', canvas.keydownHandler)
      window.removeEventListener('keyup', canvas.keyupHandler)
    }
  }
}
*/
