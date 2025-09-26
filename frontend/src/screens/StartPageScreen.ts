import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { QuickPlaySetupScreen } from './QuickPlaySetupScreen'
import { LoginScreen } from './LoginScreen'
import { RegisterScreen } from './RegisterScreen'

/**
 * Start Page Screen
 */
export class StartPageScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('startPageTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Hide the user menu wrapper entirely on the start page
      const wrapper = document.getElementById('userMenuWrapper')
      if (wrapper) wrapper.style.display = 'none'
    }
    return div
  }

  setupEvents(): void {
    const quickPlayBtn = this.element?.querySelector('#quickPlayBtn') as HTMLButtonElement
    const loginBtn = this.element?.querySelector('#loginBtn') as HTMLButtonElement
    const registerBtn = this.element?.querySelector('#registerBtn') as HTMLButtonElement

    if (quickPlayBtn) {
      quickPlayBtn.addEventListener('click', () => {
        this.router.navigateTo(QuickPlaySetupScreen)
      })
    }

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