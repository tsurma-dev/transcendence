import { Component, TemplateManager, AppRouter } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'

/**
 * Tournament Lobby Screen
 * This screen is shown when users join a tournament
 * It displays the lobby with waiting players, chat, and tournament status
 * Only renders template for now, no logic yet
 */
export class TournamentLobbyScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('tournamentLobbyTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    console.log('User is currently visiting TournamentLobbyScreen!')

    const leaveTournamentBtn = this.element?.querySelector('#leaveTournamentBtn') as HTMLButtonElement

    if (leaveTournamentBtn) {
      leaveTournamentBtn.addEventListener('click', () => {
        // Navigate back to logged-in landing page
        console.log('Leaving tournament, navigating back to LoggedInLandingScreen')
        this.router.navigateTo(LoggedInLandingScreen)
      })
    }
  }

  cleanup(): void {
    // No cleanup needed for simple template rendering
  }
}