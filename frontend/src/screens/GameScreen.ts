import { Component, TemplateManager, AppRouter, ApiService } from '../core'
// ApiService imported from core
import { Game3DComponent, GameMode } from '../components/Game3D'

/**
 * Game Screen with Player Names
 */
export class GameScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private game3D: Game3DComponent | null = null
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
        // App.getInstance().setUserLoggedIn(false)
      } else {
        // App.getInstance().setUserLoggedIn(true)
      }
      // Menu/back toggle handled by setUserLoggedIn

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
    const oldCanvas = this.element?.querySelector('#pongCanvas') as HTMLCanvasElement | null
    const host = oldCanvas?.parentElement || this.element!
    if (oldCanvas) oldCanvas.remove()

    const game3DContainer = document.createElement('div')
    game3DContainer.id = 'game3DContainer'

    // ---FULL SCREEN---
    game3DContainer.style.position = 'fixed'
    game3DContainer.style.top = '0'
    game3DContainer.style.left = '0'
    game3DContainer.style.width = '100vw'
    game3DContainer.style.height = '100vh'
    game3DContainer.style.backgroundColor = '#000'
    game3DContainer.style.zIndex = '1000'

    host.appendChild(game3DContainer)

    this.game3D = new Game3DComponent(
      game3DContainer,
      this.isQuickPlay ? 'local' : 'online',
      this.player1Name,
      this.player2Name,
    );
    this.game3D.initialize();
  }

  cleanup(): void {
    if (this.game3D) {
      this.game3D.dispose()
    }
    // **REMOVE FULLSCREEN CONTAINER:**
    const game3DContainer = document.getElementById('game3DContainer')
    if (game3DContainer && game3DContainer.parentElement === document.body) {
      document.body.removeChild(game3DContainer)
    }
  }
}