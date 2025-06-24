
// Built-in methods of the CanvasRenderingContext2D interface
const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement
// Method getContext() returns a drawing context on the canvas, '2d' for 2D rendering
// the exclamation mark asserts that the value is not null
const ctx = canvas.getContext('2d')!

const WIDTH = canvas.width
const HEIGHT = canvas.height

// Ball settings, initial position, speed, and radius
let ballX = WIDTH / 2
let ballY = HEIGHT / 2
let ballRadius = 10
let ballSpeedX = 5
let ballSpeedY = 3

// Paddles settings, width, height, speed
const paddleWidth = 10
const paddleHeight = 100
const paddleSpeed = 6

// Initial positions of the paddles, centered vertically
let leftPaddleY = HEIGHT / 2 - paddleHeight / 2
let rightPaddleY = HEIGHT / 2 - paddleHeight / 2

// Keys object to track pressed keys
let keys: Record<string, boolean> = {}

/** Draws a rectangle, used for background and paddles. fillRect() is a built-in method
* of the CanvasRenderingContext2D interface 
*/
function drawRect(x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

/** Draws a circle, used for the ball. arc() is a built-in method of the CanvasRenderingContext2D
* interface
*/
function drawCircle(x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** Handles the game logic, moving paddles and ball, checking for collisions,
 * bouncing off walls and paddles, and resetting the ball if it goes out of bounds.
* This function is called on each frame of the game loop.
 */
function update() {
  // Move paddles
  if (keys['w'] && leftPaddleY > 0) leftPaddleY -= paddleSpeed
  if (keys['s'] && leftPaddleY + paddleHeight < HEIGHT) leftPaddleY += paddleSpeed
  if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= paddleSpeed
  if (keys['ArrowDown'] && rightPaddleY + paddleHeight < HEIGHT) rightPaddleY += paddleSpeed

  // Move ball, updating its position based on speed
  ballX += ballSpeedX
  ballY += ballSpeedY

  // Bounce top/bottom, reversing the Y speed if the ball hits the top or bottom of the canvas
  if (ballY < 0 || ballY > HEIGHT) ballSpeedY *= -1

  // Bounce paddles, reversing the X speed if the ball hits a paddle
  // Check if the ball is within the paddle's vertical range and on the left or right
  // side of the canvas, and reverse the X speed if it is
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

/** Draws the game elements on the canvas. This function is called on each frame of the game loop.
 * clearRect() is a built-in method of the CanvasRenderingContext2D interface that clears
 * the specified rectangle area. 
 */
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  // Background
  drawRect(0, 0, WIDTH, HEIGHT, 'black')

  // Paddles
  drawRect(0, leftPaddleY, paddleWidth, paddleHeight, 'white')
  drawRect(WIDTH - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, 'white')

  // Ball
  drawCircle(ballX, ballY, ballRadius, 'white')
}

/** Main function that runs the game loop. It calls the update and draw functions on each frame.
* requestAnimationFrame() is a built-in method that tells the browser to call the specified function.
 */
function gameLoop() {
  update()
  draw()
  requestAnimationFrame(gameLoop)
}

window.addEventListener('keydown', e => keys[e.key] = true)
window.addEventListener('keyup', e => keys[e.key] = false)

gameLoop()
