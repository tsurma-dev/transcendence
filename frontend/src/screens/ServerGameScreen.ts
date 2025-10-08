import { Component, AppRouter, ApiService } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'
import { RemoteGameLobbyScreen } from './RemoteGameLobbyScreen'
import { Game3DComponent, GameMode } from '../components/Game3D'

/**
 * Server Game Screen
 * Handles all game modes that require server-side logic:
 * - AI games (single player vs AI)
 * - Remote multiplayer games (createRoom, joinRoom)
 */
export class ServerGameScreen extends Component {
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private game3D: Game3DComponent | null = null
  private player1Name: string
  private player2Name: string
  private gameMode: GameMode
  private roomId?: string

  constructor(player1Name: string, player2Name: string, gameMode: GameMode, roomId?: string) {
    super()
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.gameMode = gameMode
    this.roomId = roomId
  }

  render(): HTMLElement {
    // Empty container since game renders in fullscreen overlay
    return document.createElement('div')
  }

  setupEvents(): void {
    // Create fullscreen game container attached to document.body for proper z-index
    const game3DContainer = document.createElement('div')
    game3DContainer.id = 'serverGame3DContainer'

    // Fullscreen overlay styles
    game3DContainer.style.position = 'fixed'
    game3DContainer.style.top = '0'
    game3DContainer.style.left = '0'
    game3DContainer.style.width = '100vw'
    game3DContainer.style.height = '100vh'
    game3DContainer.style.backgroundColor = '#000'
    game3DContainer.style.zIndex = '1000'

    // Attach to body for proper overlay behavior
    document.body.appendChild(game3DContainer)

    // Create Game3D with server-side game mode
    this.game3D = new Game3DComponent(
      game3DContainer,
      this.player1Name,
      this.gameMode,
      this.player2Name,
      this.roomId,
      () => {
        // Return to appropriate screen based on game mode
        this.returnToAppropriateScreen()
      }
    )

    this.game3D.initialize()
  }

  cleanup(): void {
    // Clean up game resources
    if (this.game3D) {
      this.game3D.dispose()
      this.game3D = null
    }

    // Remove fullscreen container from body
    const game3DContainer = document.getElementById('serverGame3DContainer')
    if (game3DContainer && game3DContainer.parentElement === document.body) {
      document.body.removeChild(game3DContainer)
    }
  }

  private async returnToAppropriateScreen(): Promise<void> {
    // Clean up first
    this.cleanup()

    // Navigate based on game mode and auth state
    try {
      const user = await this.apiService.getCurrentUser()
      if (user) {
        // Determine return screen based on game mode
        switch (this.gameMode) {
          case 'createRoom':
          case 'joinRoom':
            // Return to RemoteGameLobbyScreen for multiplayer
            this.router.navigateTo(RemoteGameLobbyScreen)
            break
          case 'AI':
            // Return to LoggedInLandingScreen for single player
            this.router.navigateTo(LoggedInLandingScreen)
            break
          default:
            // Fallback to landing
            this.router.navigateTo(LoggedInLandingScreen)
        }
      } else {
        // Not authenticated, go to start
        this.router.navigateTo(LoggedInLandingScreen) // Or StartPageScreen
      }
    } catch (error) {
      console.error('Error during return navigation:', error)
      this.router.navigateTo(LoggedInLandingScreen)
    }
  }
}