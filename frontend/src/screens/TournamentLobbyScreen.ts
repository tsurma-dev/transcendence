import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'

/**
 * Tournament Lobby Screen
 * This screen is shown when users join a tournament
 * It displays the lobby with waiting players, chat, and tournament status
 */
export class TournamentLobbyScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('tournamentLobbyTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Show user menu for authenticated users
      // App.getInstance().setUserLoggedIn(true)
    }
    return div
  }

  setupEvents(): void {
    const leaveTournamentBtn = this.element?.querySelector('#leaveTournamentBtn') as HTMLButtonElement

    if (leaveTournamentBtn) {
      leaveTournamentBtn.addEventListener('click', () => {
        // Navigate back to logged-in landing page
        this.router.navigateTo(LoggedInLandingScreen)
      })
    }

    // Load initial tournament state
    this.loadTournamentData()
  }

  private loadTournamentData(): void {
    // TODO: Load real tournament data from backend
    // For now, use placeholder data
    console.log('Loading tournament data...')

    // Update tournament info with sample data
    const tournamentPlayers = this.element?.querySelector('#tournamentPlayers')
    const tournamentMaxPlayers = this.element?.querySelector('#tournamentMaxPlayers')
    const tournamentStatus = this.element?.querySelector('#tournamentStatus')

    if (tournamentPlayers) tournamentPlayers.textContent = '2'
    if (tournamentMaxPlayers) tournamentMaxPlayers.textContent = '4'
    if (tournamentStatus) tournamentStatus.textContent = 'Waiting'
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}