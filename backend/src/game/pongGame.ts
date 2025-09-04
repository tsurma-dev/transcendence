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

  public roomId: string = ''

  public player1Id: string = ''
  public player2Id: string = ''

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

  constructor(pl1Id: string, pl2Id: string, roomId: string) {
    this.player1Id = pl1Id
	this.player2Id = pl2Id
	this.roomId = roomId
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
