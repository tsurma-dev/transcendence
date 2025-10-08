import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import {  QuickPlayScreen } from './QuickPlayScreen'

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
    }
    return div
  }

  setupEvents(): void {
    const player1Input = this.element?.querySelector('#player1Name') as HTMLInputElement
    const player2Input = this.element?.querySelector('#player2Name') as HTMLInputElement
    const startBtn = this.element?.querySelector('#startGameBtn') as HTMLButtonElement
    const player1Error = this.element?.querySelector('#player1Error') as HTMLElement
    const player2Error = this.element?.querySelector('#player2Error') as HTMLElement
    const form = this.element?.querySelector('#playerSetupForm') as HTMLFormElement

    if (!player1Input || !player2Input || !startBtn || !player1Error || !player2Error || !form) return

    const updateStartButton = () => {
      const hasPlayer1 = player1Input.value.trim().length > 0
      const hasPlayer2 = player2Input.value.trim().length > 0
      
      // Enable button always so users can click to see validation errors
      startBtn.disabled = false
      
      // Hide error messages when typing
      if (hasPlayer1) {
        player1Error.classList.add('hidden')
      }
      if (hasPlayer2) {
        player2Error.classList.add('hidden')
      }
    }

    // Initial call to set up the button state
    updateStartButton()

    player1Input.addEventListener('input', updateStartButton)
    player2Input.addEventListener('input', updateStartButton)

    const handleSubmit = () => {
      const player1Name = player1Input.value.trim()
      const player2Name = player2Input.value.trim()
      let hasErrors = false

      // Show error messages for empty fields
      if (!player1Name) {
        player1Error.classList.remove('hidden')
        hasErrors = true
      } else {
        player1Error.classList.add('hidden')
      }

      if (!player2Name) {
        player2Error.classList.remove('hidden')
        hasErrors = true
      } else {
        player2Error.classList.add('hidden')
      }

      // Only navigate if both fields are filled
      if (!hasErrors && player1Name && player2Name) {
        this.router.navigateTo(QuickPlayScreen, player1Name, player2Name, 'local')
      }
    }

    // Handle form submission (preventDefault to avoid page reload)
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      handleSubmit()
    })

    // Handle direct button click (even when disabled)
    startBtn.addEventListener('click', (e) => {
      e.preventDefault()
      handleSubmit()
    })

    // Enter key support
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
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