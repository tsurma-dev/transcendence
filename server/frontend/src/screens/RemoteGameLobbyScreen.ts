import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'
import { ServerGameScreen } from './ServerGameScreen'
import { JoinRoomInputScreen } from './JoinRoomInputScreen'

/**
 * Remote Game Lobby Screen
 * This screen displays options for remote multiplayer games:
 * - Create Room: Create a private room for another player to join
 * - Join Room: Join an existing room using a room ID
 */
export class RemoteGameLobbyScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

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
          
          // Navigate to create room server game
          this.router.navigateTo(ServerGameScreen, currentUser.username, '', 'createRoom')
        } catch (error) {
          console.error('Failed to create room:', error)
        }
      })
    }

    if (joinRoomBtn) {
      joinRoomBtn.addEventListener('click', () => {
        // Navigate to room input screen first
        this.router.navigateTo(JoinRoomInputScreen)
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
    // No direct Game3D management since navigation is handled by router
  }
}