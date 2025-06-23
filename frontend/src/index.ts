
const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

const WIDTH = canvas.width
const HEIGHT = canvas.height

// Ball
let ballX = WIDTH / 2
let ballY = HEIGHT / 2
let ballRadius = 10
let ballSpeedX = 5
let ballSpeedY = 3

// Paddles
const paddleWidth = 10
const paddleHeight = 100
const paddleSpeed = 6

let leftPaddleY = HEIGHT / 2 - paddleHeight / 2
let rightPaddleY = HEIGHT / 2 - paddleHeight / 2

let keys: Record<string, boolean> = {}

function drawRectangle(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function drawCircle(x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function update() {
  // Move paddles
  if (keys['w'] && leftPaddleY > 0) leftPaddleY -= paddleSpeed
  if (keys['s'] && leftPaddleY + paddleHeight < HEIGHT) leftPaddleY += paddleSpeed
  if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= paddleSpeed
  if (keys['ArrowDown'] && rightPaddleY + paddleHeight < HEIGHT) rightPaddleY += paddleSpeed

  // Move ball
  ballX += ballSpeedX
  ballY += ballSpeedY

  // Bounce top/bottom
  if (ballY < 0 || ballY > HEIGHT) ballSpeedY *= -1

  // Bounce paddles
  if (
    (ballX - ballRadius < paddleWidth &&
     ballY > leftPaddleY &&
     ballY < leftPaddleY + paddleHeight)
    ||
    (ballX + ballRadius > WIDTH - paddleWidth &&
     ballY > rightPaddleY &&
     ballY < rightPaddleY + paddleHeight)
  ) {
    ballSpeedX *= -1
  }

  // Reset if out of bounds
  if (ballX < 0 || ballX > WIDTH) {
    ballX = WIDTH / 2
    ballY = HEIGHT / 2
    ballSpeedX *= -1
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  // Background
  drawRectangleangle(0, 0, WIDTH, HEIGHT, 'black')

  // Paddles
  drawRectangle(0, leftPaddleY, paddleWidth, paddleHeight, 'white')
  drawRectangle(WIDTH - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, 'white')

  // Ball
  drawCircle(ballX, ballY, ballRadius, 'white')
}

function gameLoop() {
  update()
  draw()
  requestAnimationFrame(gameLoop)
}

window.addEventListener('keydown', e => keys[e.key] = true)
window.addEventListener('keyup', e => keys[e.key] = false)

gameLoop()
