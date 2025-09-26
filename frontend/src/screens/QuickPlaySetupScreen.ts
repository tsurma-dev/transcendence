import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { GameScreen } from './GameScreen'

/**
 * Quick Play Setup Screen (no authentication required)
 */
export class QuickPlaySetupScreen extends Component {
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

      // Back button toggle now handled by setUserLoggedIn
      // App.getInstance().setUserLoggedIn(false)
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
        this.router.navigateTo(GameScreen, player1Name, player2Name, true)
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