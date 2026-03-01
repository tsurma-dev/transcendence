import { Component, TemplateManager, AppRouter, ApiService } from '../core'
// ApiService imported from core

/**
 * Logged out Screen
 * This screen is shown when the user logs out
 * It displays the username and redirects to the start page
 */
export class LoggedOutScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private username: string

  constructor(username: string = 'User') {
    super()
    this.username = username
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('loggedOutTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Update the message to include the username
      const heading = div.querySelector('h1')
      if (heading) {
        heading.textContent = `${this.username} successfully logged out`
      }
    }
    // Reset to logged-out state (back button shows automatically)
    // App.getInstance().setUserLoggedIn(false)
    return div
  }

  setupEvents(): void {
    // Global button is managed by App class
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}