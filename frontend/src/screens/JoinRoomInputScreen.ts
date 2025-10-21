import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { RemoteGameLobbyScreen } from './RemoteGameLobbyScreen'
import { ServerGameScreen } from './ServerGameScreen'

/**
 * Join Room Input Screen
 * Allows user to enter a room ID to join an existing room
 */
export class JoinRoomInputScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('joinRoomInputTemplate')
    const div = document.createElement('div')
    div.className = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400'
    
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const joinBtn = this.element?.querySelector('#joinRoomBtn') as HTMLButtonElement
    const backBtn = this.element?.querySelector('#backBtn') as HTMLButtonElement
    const roomInput = this.element?.querySelector('#roomIdInput') as HTMLInputElement
    const errorMessage = this.element?.querySelector('#errorMessage') as HTMLElement

    if (joinBtn && roomInput) {
      const handleJoinRoom = async () => {
        const roomId = roomInput.value.trim().toLowerCase()
        
        // Validate room ID
        if (roomId.length != 6) {
          this.showError('Please enter a valid room ID (exactly 6 characters)', errorMessage)
          return
        }

        try {
          // Get current user
          const currentUser = await this.apiService.getCurrentUser()
          if (!currentUser) {
            this.showError('You must be logged in to join a room', errorMessage)
            return
          }

          // Navigate to game with roomId parameter
          this.router.navigateTo(ServerGameScreen, currentUser.username, '', 'joinRoom', roomId)
          
        } catch (error) {
          console.error('Failed to join room:', error)
          this.showError('Failed to join room. Please try again.', errorMessage)
        }
      }

      joinBtn.addEventListener('click', handleJoinRoom)
      
      // Handle Enter key
      roomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleJoinRoom()
        }
      })
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigateTo(RemoteGameLobbyScreen)
      })
    }

    // Auto-focus the input
    setTimeout(() => {
      const input = this.element?.querySelector('#roomIdInput') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 100)
  }

  private showError(message: string, errorElement: HTMLElement): void {
    if (errorElement) {
      errorElement.textContent = message
      errorElement.classList.remove('hidden')
      
      // Hide error after 5 seconds
      setTimeout(() => {
        errorElement.classList.add('hidden')
      }, 5000)
    }
  }

  cleanup(): void {
    // Clean up any event listeners if needed
  }
}