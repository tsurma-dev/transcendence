import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'
import { Game3DComponent } from '../components/Game3D'

/**
 * Remote Game Screen
 * This screen displays options for remote multiplayer games:
 * - Create Room: Create a private room for another player to join
 * - Join Room: Join an existing room using a room ID
 */
export class RemoteGameScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private game3D: Game3DComponent | null = null

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('remoteGameTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const createRoomBtn = this.element?.querySelector('#createRoomBtn') as HTMLButtonElement
    const joinRoomBtn = this.element?.querySelector('#joinRoomBtn') as HTMLButtonElement
    const backToLandingBtn = this.element?.querySelector('#backToLandingBtn') as HTMLButtonElement

    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', async () => {
        try {
          const currentUser = await this.apiService.getCurrentUser()
          if (!currentUser) {
            console.error('No current user found')
            return
          }
          
          await this.startRemoteGame('createRoom', currentUser.username)
        } catch (error) {
          console.error('Failed to create room:', error)
        }
      })
    }

    if (joinRoomBtn) {
      joinRoomBtn.addEventListener('click', async () => {
        try {
          const currentUser = await this.apiService.getCurrentUser()
          if (!currentUser) {
            console.error('No current user found')
            return
          }
        
          await this.startRemoteGame('joinRoom', currentUser.username)
        } catch (error) {
          console.error('Failed to join room:', error)
        }
      })
    }

    if (backToLandingBtn) {
      backToLandingBtn.addEventListener('click', () => {
        console.log('Navigating back to Logged In Landing screen')
        this.router.navigateTo(LoggedInLandingScreen)
      })
    }
  }

  cleanup(): void {
    // Clean up any event listeners or resources if needed
    if (this.game3D) {
      this.game3D.dispose()
      this.game3D = null
    }
  }

  private async startRemoteGame(gameMode: 'createRoom' | 'joinRoom', playerName: string): Promise<void> {
    // Create fullscreen container for the game
    const game3DContainer = document.createElement('div')
    game3DContainer.id = 'game3DContainer'
    game3DContainer.style.position = 'fixed'
    game3DContainer.style.top = '0'
    game3DContainer.style.left = '0'
    game3DContainer.style.width = '100vw'
    game3DContainer.style.height = '100vh'
    game3DContainer.style.backgroundColor = '#000'
    game3DContainer.style.zIndex = '1000'

    document.body.appendChild(game3DContainer)

    // Create Game3D instance with the specified mode
    this.game3D = new Game3DComponent(
      game3DContainer,
      playerName,
      gameMode,
      undefined, // player2Name not needed for remote games
      undefined, // roomId will be handled by Game3D (input screen for joinRoom)
      () => {
        // Return to menu callback
        this.returnToRemoteGameScreen()
      }
    )
    
    this.game3D.initialize()
  }

  private returnToRemoteGameScreen(): void {
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

    // Stay on current screen (RemoteGameScreen is still active)
    console.log('Returned to Remote Game Screen')
  }
}