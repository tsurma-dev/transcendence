/**
* =================================
* FILE STRUCTURE AND EXECUTION FLOW
* =================================
* 
* This file is located in the `src` directory of the frontend. This is where you can make
* changes to the Typescript used in the application.
* 
* The file is structured to support a scalable Single Page Application (SPA) architecture
* and follows the common Js/Ts module pattern where:
* 
* - Imports at to the top of the file
* - Classes and functions in the middle
* - Initialization/execution code at the bottom
*
* "What" (class definitions, function declarations etc.)is separated from "How" (execution logic).
* When the browser loads the script, it needs all classes and functions to be defined before it
* can execute the initialization code.
* 
* Current file structure:
* 1. ApiService: Handles backend communication
* 2. Component: Base abstract class for all components
* 3. TemplateManager: Infrastructure singleton, manages HTML templates
* 4. AppRouter: Infrastructure singleton, manages navigation between screens
* 5. PongGame: Game logic and rendering (placeholder for now)
* 6. Screen Components: UI components - Individual screens for the app (StartPage, QuickPlaySetup, Login, Register, PlayerSetup, GameScreen etc)
* 7. App: Main application class that initializes everything and manages the global state
* 8. Initialization code: Sets up the app when the DOM (Document Object Model) is ready
* 
* When running the application, this file is transpiled to JavaScript and bundled with other files in
* the dist directory. The output file is then linked in the index.html file.
* 
* Do not edit index.js in the dist directory directly, as it is a generated file.
*/


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
      console.log('Fetching online users from:', `${this.baseUrl}/api/loggedinusers`)
      const response = await fetch(`${this.baseUrl}/api/loggedinusers`, {
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

  async getCurrentUser(): Promise<{id: number, username: string, email: string, createdAt: string, twoFAEnabled?: boolean} | null> {
    try {
      console.log('Fetching current user from:', `${this.baseUrl}/api/me`)
      const response = await fetch(`${this.baseUrl}/api/me`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      })

      console.log('getCurrentUser response status:', response.status)
      
      if (response.ok) {
        const user = await response.json()
        console.log('getCurrentUser response data:', user)
        return user
      } else {
        console.error('Failed to get current user:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return null
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      return null
    }
  }

  async logout(): Promise<boolean> {
    try {
      console.log('Logging out from:', `${this.baseUrl}/api/logout`)
      const response = await fetch(`${this.baseUrl}/api/logout`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include'
      })

      console.log('Logout response status:', response.status)
      
      if (response.ok) {
        console.log('Logout successful')
        return true
      } else {
        console.error('Failed to logout:', response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  async updatePassword(password: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/password`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update password' }
      }
    } catch (error) {
      console.error('Password update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async updateEmail(email: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/email`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update email' }
      }
    } catch (error) {
      console.error('Email update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async updateUsername(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/username`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update username' }
      }
    } catch (error) {
      console.error('Username update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async get2FAStatus(): Promise<{success: boolean, enabled?: boolean, message?: string}> {
    try {
      // Get 2FA status from current user data
      const user = await this.getCurrentUser()
      
      if (user) {
        return { success: true, enabled: Boolean(user.twoFAEnabled) }
      } else {
        return { success: false, message: 'Failed to get user data' }
      }
    } catch (error) {
      console.error('Get 2FA status error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async enable2FA(): Promise<{success: boolean, qrCode?: string, secret?: string, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/2fa/setup`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true, qrCode: result.qrCodeUrl, secret: result.secret }
      } else {
        return { success: false, message: result.message || 'Failed to enable 2FA' }
      }
    } catch (error) {
      console.error('Enable 2FA error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async verify2FA(code: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ TwoFAToken: code }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to verify 2FA' }
      }
    } catch (error) {
      console.error('Verify 2FA error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async disable2FA(): Promise<{success: boolean, message?: string}> {
    // For now, return not implemented since backend doesn't have disable endpoint
    return { success: false, message: '2FA disable not implemented yet' }
  }

  async deleteAccount(password: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/me/delete`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to delete account' }
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      return { success: false, message: 'Network error. Please try again.' }
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
 * Start Page Screen
 */
class StartPageScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('startPageTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
      
      // Hide the global button on the start page
      App.getInstance().toggleGlobalButton(false)
      // Hide the user profile button on the start page
      App.getInstance().toggleUserProfileButton(false)
    }
    return div
  }

  setupEvents(): void {
    const quickPlayBtn = this.element?.querySelector('#quickPlayBtn') as HTMLButtonElement
    const loginBtn = this.element?.querySelector('#loginBtn') as HTMLButtonElement
    const registerBtn = this.element?.querySelector('#registerBtn') as HTMLButtonElement

    if (quickPlayBtn) {
      quickPlayBtn.addEventListener('click', () => {
        this.router.navigateTo(QuickPlaySetupScreen)
      })
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.router.navigateTo(LoginScreen)
      })
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this.router.navigateTo(RegisterScreen)
      })
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}

/**
 * Quick Play Setup Screen (no authentication required)
 */
class QuickPlaySetupScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('playerSetupTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Remove the online users count and logout button for quick play
      const onlineUsersDiv = div.querySelector('#onlineUsersCount')?.closest('.text-center')
      if (onlineUsersDiv) onlineUsersDiv.remove()
      
      // Show the global button as back button for quick play
      App.getInstance().setUserLoggedIn(false)
      App.getInstance().toggleGlobalButton(true)
    }
    return div
  }

  setupEvents(): void {
    const player1Input = this.element?.querySelector('#player1Name') as HTMLInputElement
    const player2Input = this.element?.querySelector('#player2Name') as HTMLInputElement
    const startBtn = this.element?.querySelector('#startGameBtn') as HTMLButtonElement

    if (!player1Input || !player2Input || !startBtn) return

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
        this.router.navigateTo(GameScreen, player1Name, player2Name, true) // true = isQuickPlay
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

  cleanup(): void {
    // Cleanup will be handled automatically by unmount
  }
}

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
      
      // Show the global button as back button for login screen
      App.getInstance().setUserLoggedIn(false)
      App.getInstance().toggleGlobalButton(true)
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
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }

      try {
        const response = await fetch(`${this.apiService['baseUrl']}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
          credentials: 'include'
        })

        if (response.ok) {
          // Login successful, set user as logged in and navigate to player setup
          App.getInstance().setUserLoggedIn(true)
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
    // Show the global button as back button for register screen
    App.getInstance().setUserLoggedIn(false)
    App.getInstance().toggleGlobalButton(true)
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
        const response = await fetch(`${this.apiService['baseUrl']}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
          credentials: 'include'
        })

        if (response.ok) {
          // Registration successful, showing success message with login link
          errorDiv.className = 'text-green-500 text-center mt-4'
          errorDiv.innerHTML = `
            <div class="mb-2">✅ New user registered successfully!</div>
            <button class="text-blue-300 hover:text-blue-200 underline cursor-pointer" id="goToLoginBtn">
              Click here to login
            </button>
          `
          errorDiv.classList.remove('hidden')
          
          // Add click handler for login link
          const goToLoginBtn = errorDiv.querySelector('#goToLoginBtn')
          if (goToLoginBtn) {
            goToLoginBtn.addEventListener('click', () => {
              this.router.navigateTo(LoginScreen)
            })
          }
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
 * Logged out Screen
 * This screen is shown when the user logs out
 * It displays the username and redirects to the start page
 */
class LoggedOutScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private username: string

  constructor(username: string = 'User') {
    super()
    this.username = username
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('loggedOutTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
      
      // Update the message to include the username
      const heading = div.querySelector('h1')
      if (heading) {
        heading.textContent = `${this.username} successfully logged out`
      }
    }
    // Show the global button as back button for logout screen
    App.getInstance().setUserLoggedIn(false)
    App.getInstance().toggleGlobalButton(true)
    return div
  }

  setupEvents(): void {
    // Global button is managed by App class
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
      
      // Show the global button as logout button for authenticated users
      App.getInstance().setUserLoggedIn(true)
      App.getInstance().toggleGlobalButton(true)
      App.getInstance().toggleUserProfileButton(true)
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

    // Load current user and set as Player 1 default
    this.loadCurrentUser()

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

  private async loadCurrentUser(): Promise<void> {
    const player1Input = this.element?.querySelector('#player1Name') as HTMLInputElement
    if (!player1Input) {
      console.error('Player 1 input not found')
      return
    }

    console.log('Loading current user...')
    try {
      const user = await this.apiService.getCurrentUser()
      console.log('API response:', user)
      
      if (user && user.username) {
        console.log('Setting Player 1 name to:', user.username)
        player1Input.value = user.username
        // Trigger the update button check since we've set a value
        const updateEvent = new Event('input')
        player1Input.dispatchEvent(updateEvent)
        console.log('Player 1 input value set to:', player1Input.value)
      } else {
        console.log('No user data or username found')
      }
    } catch (error) {
      console.error('Error loading current user:', error)
      // Silently fail - user can still enter name manually
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
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private pongGame: PongGame | null = null
  private player1Name: string
  private player2Name: string
  private isQuickPlay: boolean

  constructor(player1Name: string, player2Name: string, isQuickPlay: boolean = false) {
    super()
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.isQuickPlay = isQuickPlay
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('gameScreenTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
      
      // Set the global button state based on quick play or authenticated mode
      if (this.isQuickPlay) {
        App.getInstance().setUserLoggedIn(false)
      } else {
        App.getInstance().setUserLoggedIn(true)
      }
      App.getInstance().toggleGlobalButton(true)
      App.getInstance().toggleUserProfileButton(true)

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

/**
 * User Profile Screen
 */

class UserProfileScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private user: {id: number, username: string, email: string, createdAt: string, twoFAEnabled?: boolean} | null = null

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('userProfileTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
      
      // Show the global button as logout button for authenticated users
      App.getInstance().setUserLoggedIn(true)
      App.getInstance().toggleGlobalButton(true)
    }
    return div
  }

  async setupEvents(): Promise<void> {
    const profileUsername = this.element?.querySelector('#profileUsername') as HTMLElement
    const profileEmail = this.element?.querySelector('#profileEmail') as HTMLElement
    const profileJoinedDate = this.element?.querySelector('#profileJoinedDate') as HTMLElement
    const profileLastLogin = this.element?.querySelector('#profileLastLogin') as HTMLElement
    const profileTotalGames = this.element?.querySelector('#profileTotalGames') as HTMLElement
    const profileGamesWon = this.element?.querySelector('#profileGamesWon') as HTMLElement
    const userSettingsBtn = this.element?.querySelector('#userSettingsBtn') as HTMLButtonElement
    const deleteAccountBtn = this.element?.querySelector('#deleteAccountBtn') as HTMLButtonElement

    // Load current user data
    try {
      this.user = await this.apiService.getCurrentUser()
      if (this.user) {
        // Populate user information
        if (profileUsername) profileUsername.textContent = this.user.username
        if (profileEmail) profileEmail.textContent = this.user.email
        if (profileJoinedDate) profileJoinedDate.textContent = this.user.createdAt || 'Unknown'
        
        // Placeholder values for game stats (not implemented yet)
        if (profileTotalGames) profileTotalGames.textContent = '0'
        if (profileGamesWon) profileGamesWon.textContent = '0'
      } else {
        // Handle case where no user is logged in
        if (profileUsername) profileUsername.textContent = 'Not logged in'
        if (profileEmail) profileEmail.textContent = 'N/A'
        if (profileJoinedDate) profileJoinedDate.textContent = 'N/A'
        if (profileLastLogin) profileLastLogin.textContent = 'N/A'
        if (profileTotalGames) profileTotalGames.textContent = '0'
        if (profileGamesWon) profileGamesWon.textContent = '0'
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Show error state
      if (profileUsername) profileUsername.textContent = 'Error loading profile'
      if (profileEmail) profileEmail.textContent = 'Error'
      if (profileJoinedDate) profileJoinedDate.textContent = 'Error'
      if (profileLastLogin) profileLastLogin.textContent = 'Error'
      if (profileTotalGames) profileTotalGames.textContent = '0'
      if (profileGamesWon) profileGamesWon.textContent = '0'
    }

    // Update online status
    this.updateOnlineStatus()

    // Handle user settings button click (placeholder functionality)
    if (userSettingsBtn) {
      userSettingsBtn.addEventListener('click', () => {
        // Navigate to user settings screen
        this.router.navigateTo(UserSettingsScreen)
      })
    }

    // Handle delete account button click
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.')
        if (confirmDelete) {
          // TODO: Implement account deletion
          console.log('Delete account clicked - functionality not implemented yet')
          alert('Account deletion functionality not implemented yet')
        }
      })
    }
  }

  private async updateOnlineStatus(): Promise<void> {
    const onlineStatusDot = this.element?.querySelector('#onlineStatusDot') as HTMLElement
    const onlineStatusText = this.element?.querySelector('#onlineStatusText') as HTMLElement

    if (!onlineStatusDot || !onlineStatusText) {
      console.error('Online status elements not found')
      return
    }

    try {
      // Check if user is online by trying to get current user data
      const currentUser = await this.apiService.getCurrentUser()
      
      if (currentUser && currentUser.username) {
        // User is online
        onlineStatusDot.className = 'w-3 h-3 rounded-full mr-2 bg-green-400 animate-pulse'
        onlineStatusText.textContent = 'Online'
        onlineStatusText.className = 'text-green-600 font-mono text-sm font-bold'
      } else {
        // User is offline or not authenticated
        onlineStatusDot.className = 'w-3 h-3 rounded-full mr-2 bg-red-400'
        onlineStatusText.textContent = 'Offline'
        onlineStatusText.className = 'text-red-600 font-mono text-sm font-bold'
      }
    } catch (error) {
      console.error('Error checking online status:', error)
      // Assume offline on error
      onlineStatusDot.className = 'w-3 h-3 rounded-full mr-2 bg-red-400'
      onlineStatusText.textContent = 'Offline'
      onlineStatusText.className = 'text-red-600 font-mono text-sm font-bold'
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}

/**
 * User Settings Screen
 */
class UserSettingsScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('userSettingsTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
      
      // Show the global button as logout button for authenticated users
      App.getInstance().setUserLoggedIn(true)
      App.getInstance().toggleGlobalButton(true)
    }
    return div
  }

  async setupEvents(): Promise<void> {
    // Load initial 2FA status
    await this.load2FAStatus()

    const updatePasswordForm = this.element?.querySelector('#updatePasswordForm') as HTMLFormElement
    const updateEmailForm = this.element?.querySelector('#updateEmailForm') as HTMLFormElement
    const updateUsernameForm = this.element?.querySelector('#updateUsernameForm') as HTMLFormElement
    const deleteAccountForm = this.element?.querySelector('#deleteAccountForm') as HTMLFormElement

    // 2FA controls
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement
    const verify2FABtn = this.element?.querySelector('#verify2FABtn') as HTMLButtonElement

    // Handle password update
    if (updatePasswordForm) {
      updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const passwordResponseDiv = this.element?.querySelector('#passwordResponse') as HTMLElement
        await this.handlePasswordUpdate(updatePasswordForm, passwordResponseDiv)
      })
    }

    // Handle email update
    if (updateEmailForm) {
      updateEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const emailResponseDiv = this.element?.querySelector('#emailResponse') as HTMLElement
        await this.handleEmailUpdate(updateEmailForm, emailResponseDiv)
      })
    }

    // Handle username update
    if (updateUsernameForm) {
      updateUsernameForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const usernameResponseDiv = this.element?.querySelector('#usernameResponse') as HTMLElement
        await this.handleUsernameUpdate(updateUsernameForm, usernameResponseDiv)
      })
    }

    // Handle account deletion
    if (deleteAccountForm) {
      deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.')
        if (confirmDelete) {
          const deleteResponseDiv = this.element?.querySelector('#deleteResponse') as HTMLElement
          await this.handleAccountDeletion(deleteAccountForm, deleteResponseDiv)
        }
      })
    }

    // Handle 2FA enable
    if (enable2FABtn) {
      enable2FABtn.addEventListener('click', async () => {
        await this.handleEnable2FA()
      })
    }

    // Handle 2FA disable
    if (disable2FABtn) {
      disable2FABtn.addEventListener('click', async () => {
        // Temporarily disabled since backend doesn't support it yet
        const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement
        this.showResponse(responseDiv, '2FA disable functionality not yet implemented', 'error')
      })
    }

    // Handle 2FA verify
    if (verify2FABtn) {
      verify2FABtn.addEventListener('click', async () => {
        const codeInput = this.element?.querySelector('#verificationCode') as HTMLInputElement
        if (codeInput) {
          await this.handleVerify2FA(codeInput.value)
        }
      })
    }
  }

  private async handlePasswordUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const password = formData.get('password') as string

    const result = await this.apiService.updatePassword(password)
    
    if (result.success) {
      responseDiv.textContent = 'Password updated successfully! You have been logged out for security. Redirecting to login...'
      responseDiv.className = 'text-green-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
      form.reset()
      
      // User is logged out after password change for security
      setTimeout(() => {
        App.getInstance().setUserLoggedIn(false)
        this.router.navigateTo(LoginScreen)
      }, 2000)
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-red-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleEmailUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const email = formData.get('email') as string

    const result = await this.apiService.updateEmail(email)
    
    if (result.success) {
      responseDiv.textContent = 'Email updated successfully!'
      responseDiv.className = 'text-green-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
      form.reset()
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-red-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleUsernameUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const username = formData.get('username') as string

    const result = await this.apiService.updateUsername(username)
    
    if (result.success) {
      responseDiv.textContent = 'Username updated successfully!'
      responseDiv.className = 'text-green-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
      form.reset()
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-red-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleAccountDeletion(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const password = formData.get('password') as string

    const result = await this.apiService.deleteAccount(password)
    
    if (result.success) {
      responseDiv.textContent = 'Account deleted successfully. Redirecting...'
      responseDiv.className = 'text-green-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
      
      // Redirect to start page after successful deletion
      setTimeout(() => {
        App.getInstance().setUserLoggedIn(false)
        this.router.navigateTo(StartPageScreen)
      }, 2000)
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-red-600 text-left mt-2 font-mono'
      responseDiv.classList.remove('hidden')
    }
  }

  private async load2FAStatus(): Promise<void> {
    const statusResult = await this.apiService.get2FAStatus()
    const statusElement = this.element?.querySelector('#twoFAStatus') as HTMLElement
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement

    if (statusElement && enable2FABtn && disable2FABtn) {
      if (statusResult.success) {
        if (statusResult.enabled) {
          statusElement.textContent = 'Enabled'
          statusElement.className = 'text-green-600 font-bold font-mono'
          enable2FABtn.classList.add('hidden')
          disable2FABtn.classList.remove('hidden')
        } else {
          statusElement.textContent = 'Disabled'
          statusElement.className = 'text-red-600 font-bold font-mono'
          enable2FABtn.classList.remove('hidden')
          disable2FABtn.classList.add('hidden')
        }
      } else {
        statusElement.textContent = 'Error loading status'
        statusElement.className = 'text-red-600 font-bold font-mono'
      }
    }
  }

  private async handleEnable2FA(): Promise<void> {
    const result = await this.apiService.enable2FA()
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement
    const qrCodeSection = this.element?.querySelector('#qrCodeSection') as HTMLElement
    const qrCodeContainer = this.element?.querySelector('#qrCodeContainer') as HTMLElement
    const manualSecret = this.element?.querySelector('#manualSecret') as HTMLElement

    if (result.success && result.qrCode && result.secret) {
      // Show QR code setup
      if (qrCodeContainer && manualSecret && qrCodeSection) {
        qrCodeContainer.innerHTML = `<img src="${result.qrCode}" alt="2FA QR Code" class="max-w-full" />`
        manualSecret.textContent = result.secret
        qrCodeSection.classList.remove('hidden')
        
        // Hide enable button
        const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
        if (enable2FABtn) {
          enable2FABtn.classList.add('hidden')
        }
      }
      
      this.showResponse(responseDiv, 'Scan the QR code with your authenticator app and enter the verification code.', 'success')
    } else {
      this.showResponse(responseDiv, result.message || 'Failed to enable 2FA', 'error')
    }
  }

  private async handleVerify2FA(code: string): Promise<void> {
    if (!code || code.length !== 6) {
      const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement
      this.showResponse(responseDiv, 'Please enter a valid 6-digit code', 'error')
      return
    }

    const result = await this.apiService.verify2FA(code)
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (result.success) {
      this.showResponse(responseDiv, '2FA has been successfully enabled!', 'success')
      
      // Hide QR code section and show disable button
      const qrCodeSection = this.element?.querySelector('#qrCodeSection') as HTMLElement
      const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement
      
      if (qrCodeSection) qrCodeSection.classList.add('hidden')
      if (disable2FABtn) disable2FABtn.classList.remove('hidden')
      
      // Update status
      await this.load2FAStatus()
      
      // Clear verification code
      const codeInput = this.element?.querySelector('#verificationCode') as HTMLInputElement
      if (codeInput) codeInput.value = ''
    } else {
      this.showResponse(responseDiv, result.message || 'Invalid verification code', 'error')
    }
  }

  private async handleDisable2FA(): Promise<void> {
    const result = await this.apiService.disable2FA()
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (result.success) {
      this.showResponse(responseDiv, '2FA has been disabled', 'success')
      await this.load2FAStatus()
    } else {
      this.showResponse(responseDiv, result.message || 'Failed to disable 2FA', 'error')
    }
  }

  private showResponse(responseDiv: HTMLElement, message: string, type: 'success' | 'error'): void {
    if (!responseDiv) return
    
    responseDiv.textContent = message
    responseDiv.className = type === 'success' ? 
      'text-green-600 text-left mt-2 font-mono' : 
      'text-red-600 text-left mt-2 font-mono'
    responseDiv.classList.remove('hidden')
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        responseDiv.classList.add('hidden')
      }, 5000)
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}

// ============================
// APPLICATION INITIALIZATION
// ============================

/**
 * Main Application Class, singleton pattern
 * Handles global state and initialization
 * Manages global navigation button (back/logout)
 * Initializes the router with the start page
 */
class App {
  private static instance: App
  private router = AppRouter.getInstance()
  private globalBtn: HTMLElement | null = null
  private userProfileBtn: HTMLElement | null = document.getElementById('userProfileBtn')
  private apiService = new ApiService()
  private isUserLoggedIn: boolean = false

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App()
    }
    return App.instance
  }

  init(): void {
    // Set up global navigation button
    this.globalBtn = document.getElementById('backToStartBtn')
    if (this.globalBtn) {
      this.globalBtn.addEventListener('click', () => {
        this.handleGlobalButtonClick()
      })
    }

    // Set up user profile button
    const userProfileBtn = document.getElementById('userProfileBtn')
    if (this.userProfileBtn) {
      this.userProfileBtn.addEventListener('click', () => {
        this.handleUserProfileClick()
      })
    }
        
   
    // Initialize the router with the start page
    this.router.navigateTo(StartPageScreen)
    console.log('App initialized, navigating to StartPageScreen')
  }

  private async handleGlobalButtonClick(): Promise<void> {
    if (this.isUserLoggedIn) {
      // Get current user before logout to display username
      const currentUser = await this.apiService.getCurrentUser()
      const username = currentUser?.username || 'User'
      
      // Handle logout
      const success = await this.apiService.logout()
      if (success) {
        this.setUserLoggedIn(false)
        this.router.navigateTo(LoggedOutScreen, username)
      } else {
        console.error('Logout failed, redirecting to start page')
        this.setUserLoggedIn(false)
        this.router.navigateTo(StartPageScreen)
      }
    } else {
      // Handle back to start
      this.router.navigateTo(StartPageScreen)
    }
  }

  private async handleUserProfileClick(): Promise<void> {
    if (this.isUserLoggedIn) {
      // Navigate to user profile screen
      this.router.navigateTo(UserProfileScreen)
    } else {
      // Navigate to login screen
      this.router.navigateTo(LoginScreen)
    }
  }

  // Method to show/hide the global navigation button
  toggleGlobalButton(show: boolean): void {
    if (this.globalBtn) {
      this.globalBtn.style.display = show ? 'block' : 'none'
    }
  }

  // Method to show/hide the user profile button
  toggleUserProfileButton(show: boolean): void {
    if (this.userProfileBtn) {
      this.userProfileBtn.style.display = show ? 'block' : 'none'
    }
  }

  // Method to set user login state and update button appearance
  setUserLoggedIn(loggedIn: boolean): void {
    this.isUserLoggedIn = loggedIn
    if (this.globalBtn) {
      if (loggedIn) {
        this.globalBtn.textContent = 'Log out'
      } else {
        this.globalBtn.textContent = '← Back to Start'
      }
    }
  }
  
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = App.getInstance()
  app.init()
})
