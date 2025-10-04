import { Component, AppRouter, ApiService } from '../core'
// ApiService imported from core
import { Game3DComponent, GameMode } from '../components/Game3D'

/**
 * Game Screen with Player Names
 */
export class  QuickPlayScreen extends Component {
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private game3D: Game3DComponent | null = null
  private player1Name: string
  private player2Name: string
  private gameMode: GameMode = 'local'

  constructor(player1Name: string, player2Name: string, gameMode: GameMode = 'local') {
    super()
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.gameMode = gameMode
  }

  render(): HTMLElement {
    return document.createElement('div')
  }

  setupEvents(): void {
    // Initialize and start the Pong game
    const host = this.element!

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
      this.player1Name,
      this.gameMode,
      this.player2Name
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