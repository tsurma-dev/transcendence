import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { GameScreen } from './GameScreen'

/**
 * Player Setup Screen
 */
export class PlayerSetupScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('playerSetupTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Show user menu for authenticated users
      // App.getInstance().setUserLoggedIn(true)
    }
    return div
  }

  setupEvents(): void {
    const player1Input = this.element?.querySelector('#player1Name') as HTMLInputElement
    const player2Input = this.element?.querySelector('#player2Name') as HTMLInputElement
    const startBtn = this.element?.querySelector('#startGameBtn') as HTMLButtonElement

    if (!player1Input || !player2Input || !startBtn) return

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
        this.router.navigateTo(GameScreen, player1Name, player2Name, false)
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