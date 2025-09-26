import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { UserProfileScreen } from './UserProfileScreen'
// ApiService imported from core

/**
 * Match History Screen
 * Shows user's match history with statistics
 */
export class MatchHistoryScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private targetUsername?: string  // Username of the profile that was being viewed

  constructor(username?: string) {
    super()
    this.targetUsername = username
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('matchHistoryTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Show user menu for authenticated users
      // App.getInstance().setUserLoggedIn(true)
    }
    return div
  }

  setupEvents(): void {
    const backToProfileBtn = this.element?.querySelector('#backToProfileBtn') as HTMLButtonElement

    // Handle back to profile button
    if (backToProfileBtn) {
      backToProfileBtn.addEventListener('click', () => {
        if (this.targetUsername) {
          // Go back to specific user's profile
          this.router.navigateTo(UserProfileScreen, this.targetUsername)
        } else {
          // Go back to current user's profile
          this.router.navigateTo(UserProfileScreen)
        }
      })
    }

    // Load match history data (placeholder)
    this.loadMatchHistory()
  }

  private async loadMatchHistory(): Promise<void> {
    // TODO: Implement actual match history loading from backend
    console.log('Loading match history - using placeholder data for now')

    // When implemented, fetch data from the backend:
    // const matches = await this.apiService.getMatchHistory()
    // this.populateMatchHistory(matches)
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}