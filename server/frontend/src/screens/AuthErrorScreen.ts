import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'
// ApiService imported from core

/**
 * Authentication Error Screen
 * This screen is shown when users try to access protected pages without being logged in
 * It provides options to log in, register, or go back to the start page
 */
export class AuthErrorScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('authErrorTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Reset to logged-out state (back button shows automatically)
      // App.getInstance().setUserLoggedIn(false)
    }
    return div
  }

  setupEvents(): void {
    const loginBtn = this.element?.querySelector('#authErrorLoginBtn') as HTMLButtonElement
    const registerBtn = this.element?.querySelector('#authErrorRegisterBtn') as HTMLButtonElement

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.router.navigateTo(LoginScreen)
      })
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this.router.navigateTo(RegisterScreen)
      })
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}