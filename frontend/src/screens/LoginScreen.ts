import { Component, TemplateManager, AppRouter, ApiService, App } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'
import { RegisterScreen } from './RegisterScreen'

/**
 * Login Screen
 */
export class LoginScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private requiresTwoFA: boolean = false
  private loginCredentials: {email: string, password: string} | null = null

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('loginTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Back button toggle now handled by setUserLoggedIn
      // App.getInstance().setUserLoggedIn(false)
    }
    return div
  }

  setupEvents(): void {
    const form = this.element?.querySelector('#loginForm') as HTMLFormElement
    const twoFAForm = this.element?.querySelector('#twoFAVerificationForm') as HTMLFormElement
    const errorDiv = this.element?.querySelector('#loginError') as HTMLElement
    const showRegisterBtn = this.element?.querySelector('#showRegisterBtn') as HTMLButtonElement
    const backToCredentialsBtn = this.element?.querySelector('#backToCredentialsBtn') as HTMLButtonElement

    if (!form || !twoFAForm || !errorDiv) return

    // Navigate to register screen
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => {
        this.router.navigateTo(RegisterScreen)
      })
    }

    // Back to credentials button
    if (backToCredentialsBtn) {
      backToCredentialsBtn.addEventListener('click', () => {
        this.showCredentialsSection()
        this.clearError()
      })
    }

    // Handle initial login form submission (credentials)
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      this.clearError()

      const formData = new FormData(form)
      const loginData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }

      this.loginCredentials = loginData
      await this.attemptLogin(loginData)
    })

    // Handle 2FA verification form submission
    twoFAForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      this.clearError()

      const formData = new FormData(twoFAForm)
      const twoFACode = formData.get('twoFACode') as string

      if (!twoFACode || twoFACode.length !== 6) {
        this.showError('Please enter a valid 6-digit code')
        return
      }

      if (this.loginCredentials) {
        // Retry login with 2FA token
        await this.attemptLogin({
          ...this.loginCredentials,
          TwoFAToken: twoFACode
        })
      }
    })

    // Auto-format 2FA code input (numbers only)
    const twoFAInput = this.element?.querySelector('#twoFACode') as HTMLInputElement
    if (twoFAInput) {
      twoFAInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        target.value = target.value.replace(/\D/g, '').substring(0, 6)
      })
    }
  }

  private async attemptLogin(loginData: {email: string, password: string, TwoFAToken?: string}): Promise<void> {
    try {
      const response = await fetch(`${this.apiService['baseUrl']}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include'
      })

      if (response.ok) {
        // Login successful, navigate to logged-in landing page
        App.getInstance().setUserLoggedIn(true)
        this.router.navigateTo(LoggedInLandingScreen)
      } else {
        const error = await response.json().catch(async () => {
          const text = await response.text()
          return { message: text }
        })

        // Check if the error indicates 2FA is required
        if (response.status === 401 && !loginData.TwoFAToken) {
          // Check if error message suggests 2FA is needed
          const errorMessage = error.message || ''
          if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('2fa')) {
            // Show 2FA verification section
            this.requiresTwoFA = true
            this.showTwoFASection()
            return
          }
        }

        this.showError(error.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showError('Network error. Please try again.')
    }
  }

  private showCredentialsSection(): void {
    const credentialsSection = this.element?.querySelector('#loginCredentialsSection')
    const twoFASection = this.element?.querySelector('#twoFAVerificationSection')

    if (credentialsSection && twoFASection) {
      credentialsSection.classList.remove('hidden')
      twoFASection.classList.add('hidden')
    }

    this.requiresTwoFA = false
  }

  private showTwoFASection(): void {
    const credentialsSection = this.element?.querySelector('#loginCredentialsSection')
    const twoFASection = this.element?.querySelector('#twoFAVerificationSection')
    const twoFAInput = this.element?.querySelector('#twoFACode') as HTMLInputElement

    if (credentialsSection && twoFASection) {
      credentialsSection.classList.add('hidden')
      twoFASection.classList.remove('hidden')

      // Focus on 2FA input
      if (twoFAInput) {
        setTimeout(() => twoFAInput.focus(), 100)
      }
    }
  }

  private showError(message: string): void {
    const errorDiv = this.element?.querySelector('#loginError') as HTMLElement
    if (errorDiv) {
      errorDiv.textContent = message
      errorDiv.classList.remove('hidden')
    }
  }

  private clearError(): void {
    const errorDiv = this.element?.querySelector('#loginError') as HTMLElement
    if (errorDiv) {
      errorDiv.classList.add('hidden')
      errorDiv.textContent = ''
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}