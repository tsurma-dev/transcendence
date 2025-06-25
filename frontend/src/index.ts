// ===========================
// SCALABLE SPA ARCHITECTURE
// ===========================

/**
 * Simple API Service for backend communication
 */
class ApiService {
  private baseUrl: string

  constructor() {
    // Backend runs on HTTPS
    this.baseUrl = 'https://localhost:8443'
  }

  async getOnlineUsersCount(): Promise<number> {
    try {
      console.log('Fetching online users from:', `${this.baseUrl}/loggedinusers`)
      const response = await fetch(`${this.baseUrl}/loggedinusers`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      })
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const users = await response.json()
        console.log('Users data:', users)
        const count = Array.isArray(users) ? users.length : 0
        console.log('Users count:', count)
        return count
      } else {
        console.error('Response not ok:', response.status, response.statusText)
        return 0
      }
    } catch (error) {
      console.error('Failed to fetch online users count:', error)
      return 0
    }
  }
}

/**
 * Base Component class for scalable SPA structure
 */
abstract class Component {
  protected element: HTMLElement | null = null

  abstract render(): HTMLElement
  abstract setupEvents(): void
  abstract cleanup(): void

  mount(parent: HTMLElement): void {
    if (this.element) {
      this.unmount()
    }
    
    this.element = this.render()
    parent.appendChild(this.element)
    this.setupEvents()
  }

  unmount(): void {
    if (this.element) {
      this.cleanup()
      this.element.remove()
      this.element = null
    }
  }
}

/**
 * Template Manager for handling HTML templates
 */
class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, HTMLTemplateElement> = new Map()

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  cloneTemplate(templateId: string): DocumentFragment | null {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!.content.cloneNode(true) as DocumentFragment
    }

    const template = document.getElementById(templateId) as HTMLTemplateElement
    if (template) {
      this.templates.set(templateId, template)
      return template.content.cloneNode(true) as DocumentFragment
    }

    return null
  }
}

/**
 * App Router for screen navigation
 */
class AppRouter {
  private static instance: AppRouter
  private currentComponent: Component | null = null
  private appContainer: HTMLElement

  constructor() {
    this.appContainer = document.getElementById('app')!
  }

  static getInstance(): AppRouter {
    if (!AppRouter.instance) {
      AppRouter.instance = new AppRouter()
    }
    return AppRouter.instance
  }

  navigateTo(componentClass: new(...args: any[]) => Component, ...args: any[]): void {
    if (this.currentComponent) {
      this.currentComponent.unmount()
    }

    this.currentComponent = new componentClass(...args)
    this.currentComponent.mount(this.appContainer)
  }
}

// =================
// PONG GAME CLASS
// =================

class PongGame {
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupEventListeners()
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
    if (this.keys['ArrowUp'] && this.rightPaddleY > 0) this.rightPaddleY -= this.paddleSpeed
    if (this.keys['ArrowDown'] && this.rightPaddleY + this.paddleHeight < this.HEIGHT) this.rightPaddleY += this.paddleSpeed

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

// ===================
// SCREEN COMPONENTS
// ===================

/**
 * Login Screen
 */
class LoginScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('loginTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const form = this.element?.querySelector('#loginForm') as HTMLFormElement
    const errorDiv = this.element?.querySelector('#loginError') as HTMLElement
    const showRegisterBtn = this.element?.querySelector('#showRegisterBtn') as HTMLButtonElement

    if (!form || !errorDiv) return

    // Navigate to register screen
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => {
        this.router.navigateTo(RegisterScreen)
      })
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errorDiv.classList.add('hidden')
      errorDiv.textContent = ''

      const formData = new FormData(form)
      const loginData = {
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }

      try {
        // Replace with your actual login endpoint
        const response = await fetch(`${this.apiService['baseUrl']}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
          credentials: 'include'
        })

        if (response.ok) {
          // Login successful, navigate to player setup
          this.router.navigateTo(PlayerSetupScreen)
        } else {
          const error = await response.text()
          errorDiv.textContent = error || 'Login failed'
          errorDiv.classList.remove('hidden')
        }
      } catch (error) {
        console.error('Login error:', error)
        errorDiv.textContent = 'Network error. Please try again.'
        errorDiv.classList.remove('hidden')
      }
    })
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}


/**
 * Register Screen
 */
class RegisterScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('registerTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const form = this.element?.querySelector('#registerForm') as HTMLFormElement
    const errorDiv = this.element?.querySelector('#registerError') as HTMLElement
    const showLoginBtn = this.element?.querySelector('#showLoginBtn') as HTMLButtonElement

    if (!form || !errorDiv) return

    // Navigate to login screen
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        this.router.navigateTo(LoginScreen)
      })
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errorDiv.classList.add('hidden')
      errorDiv.textContent = ''

      const formData = new FormData(form)
      const registerData = {
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }

      try {
        const response = await fetch(`${this.apiService['baseUrl']}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
          credentials: 'include'
        })

        if (response.ok) {
          // Registration successful, navigate to player setup
          this.router.navigateTo(PlayerSetupScreen)
        } else {
          const error = await response.text()
          errorDiv.textContent = error || 'Registration failed'
          errorDiv.classList.remove('hidden')
        }
      } catch (error) {
        console.error('Registration error:', error)
        errorDiv.textContent = 'Network error. Please try again.'
        errorDiv.classList.remove('hidden')
      }
    })
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}

/**
 * Player Setup Screen
 */
class PlayerSetupScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('playerSetupTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const player1Input = this.element?.querySelector('#player1Name') as HTMLInputElement
    const player2Input = this.element?.querySelector('#player2Name') as HTMLInputElement
    const startBtn = this.element?.querySelector('#startGameBtn') as HTMLButtonElement

    if (!player1Input || !player2Input || !startBtn) return

    // Load online users count
    this.loadOnlineUsersCount()

    const updateStartButton = () => {
      const hasPlayer1 = player1Input.value.trim().length > 0
      const hasPlayer2 = player2Input.value.trim().length > 0
      startBtn.disabled = !(hasPlayer1 && hasPlayer2)
    }

    player1Input.addEventListener('input', updateStartButton)
    player2Input.addEventListener('input', updateStartButton)

    const handleSubmit = () => {
      const player1Name = player1Input.value.trim()
      const player2Name = player2Input.value.trim()
      
      if (player1Name && player2Name) {
        this.router.navigateTo(GameScreen, player1Name, player2Name)
      }
    }

    startBtn.addEventListener('click', handleSubmit)

    // Enter key support
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !startBtn.disabled) {
        handleSubmit()
      }
    }

    player1Input.addEventListener('keypress', handleEnter)
    player2Input.addEventListener('keypress', handleEnter)
  }

  private async loadOnlineUsersCount(): Promise<void> {
    const onlineUsersElement = this.element?.querySelector('#onlineUsersCount')
    if (!onlineUsersElement) {
      console.error('onlineUsersCount element not found')
      return
    }

    console.log('Starting to load online users count...')
    onlineUsersElement.textContent = 'Loading...'

    try {
      const count = await this.apiService.getOnlineUsersCount()
      const userText = count === 1 ? 'user' : 'users'
      onlineUsersElement.textContent = `${count} ${userText} online`
      console.log('Successfully updated online users count:', count)
    } catch (error) {
      console.error('Error loading online users count:', error)
      onlineUsersElement.textContent = 'Offline mode'
    }
  }

  cleanup(): void {
    // Cleanup will be handled automatically by unmount
  }
}

/**
 * Game Screen with Player Names
 */
class GameScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private pongGame: PongGame | null = null
  private player1Name: string
  private player2Name: string

  constructor(player1Name: string, player2Name: string) {
    super()
    this.player1Name = player1Name
    this.player2Name = player2Name
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('gameScreenTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    // Update player names display
    const player1Display = this.element?.querySelector('#player1Display')
    const player2Display = this.element?.querySelector('#player2Display')
    const player1Controls = this.element?.querySelector('#player1Controls')
    const player2Controls = this.element?.querySelector('#player2Controls')
    const player1Score = this.element?.querySelector('#player1Score')
    const player2Score = this.element?.querySelector('#player2Score')

    if (player1Display) player1Display.textContent = this.player1Name
    if (player2Display) player2Display.textContent = this.player2Name
    if (player1Controls) player1Controls.textContent = `${this.player1Name}:`
    if (player2Controls) player2Controls.textContent = `${this.player2Name}:`

    // Initialize and start the Pong game
    const canvas = this.element?.querySelector('#pongCanvas') as HTMLCanvasElement
    if (canvas) {
      this.pongGame = new PongGame(canvas)
      
      // Set up score update callback
      this.pongGame.setScoreCallback((p1Score: number, p2Score: number) => {
        if (player1Score) player1Score.textContent = p1Score.toString()
        if (player2Score) player2Score.textContent = p2Score.toString()
      })
      
      this.pongGame.start()
    }
  }

  cleanup(): void {
    if (this.pongGame) {
      this.pongGame.cleanup()
    }
  }
}

// ============================
// APPLICATION INITIALIZATION
// ============================

/**
 * Main Application Class
 */
class App {
  private router = AppRouter.getInstance()

  init(): void {
    this.router.navigateTo(LoginScreen)
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.init()
})
