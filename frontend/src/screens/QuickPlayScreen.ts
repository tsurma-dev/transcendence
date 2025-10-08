import { Component, AppRouter, ApiService } from '../core'
import { StartPageScreen } from './StartPageScreen'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'
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

  constructor(player1Name: string, player2Name: string) {
    super()
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.gameMode = 'local' // QuickPlayScreen is only for local games
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
      this.player2Name,
      undefined, // roomId not needed for quick play
      () => {
        // Return to menu callback
        this.returnToAppropriateScreen()
      }
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

  private async returnToAppropriateScreen(): Promise<void> {
    // Clean up game
    if (this.game3D) {
      this.game3D.dispose()
      this.game3D = null
    }

    // Remove fullscreen container
    const game3DContainer = document.getElementById('game3DContainer')
    if (game3DContainer && game3DContainer.parentElement === document.body) {
      document.body.removeChild(game3DContainer)
    }

    // Navigate back to appropriate screen (QuickPlayScreen is only for local games)
    try {
      const user = await this.apiService.getCurrentUser()
      if (user) {
        // User is logged in - return to landing screen for local games
        this.router.navigateTo(LoggedInLandingScreen)
      } else {
        // User is not logged in - go to StartPageScreen
        this.router.navigateTo(StartPageScreen)
      }
    } catch (error) {
      console.error('Error checking auth state, falling back to StartPageScreen:', error)
      // Fallback to start page if we can't determine auth state
      this.router.navigateTo(StartPageScreen)
    }
  }
}