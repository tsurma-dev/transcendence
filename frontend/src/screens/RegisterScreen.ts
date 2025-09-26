import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { LoginScreen } from './LoginScreen'

/**
 * Register Screen
 */
export class RegisterScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('registerTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    // Back button toggle now handled by setUserLoggedIn
    // App.getInstance().setUserLoggedIn(false)
    return div
  }

  setupEvents(): void {
    const form = this.element?.querySelector('#registerForm') as HTMLFormElement
    const errorDiv = this.element?.querySelector('#registerError') as HTMLElement
    const showLoginBtn = this.element?.querySelector('#showLoginBtn') as HTMLButtonElement

    if (!form || !errorDiv) return

    // Navigate to login screen
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        this.router.navigateTo(LoginScreen)
      })
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      errorDiv.classList.add('hidden')
      errorDiv.textContent = ''

      const formData = new FormData(form)
      const registerData = {
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }

      try {
        const response = await fetch(`${this.apiService['baseUrl']}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
          credentials: 'include'
        })

        if (response.ok) {
          // Registration successful, showing success message with login link
          errorDiv.className = 'text-green-500 text-center mt-4'
          errorDiv.innerHTML = `
            <div class="mb-2">✅ New user registered successfully!</div>
            <button class="text-blue-300 hover:text-blue-200 underline cursor-pointer" id="goToLoginBtn">
              Click here to login
            </button>
          `
          errorDiv.classList.remove('hidden')

          // Add click handler for login link
          const goToLoginBtn = errorDiv.querySelector('#goToLoginBtn')
          if (goToLoginBtn) {
            goToLoginBtn.addEventListener('click', () => {
              this.router.navigateTo(LoginScreen)
            })
          }
        } else {
          const error = await response.text()
          errorDiv.textContent = error || 'Registration failed'
          errorDiv.classList.remove('hidden')
        }
      } catch (error) {
        console.error('Registration error:', error)
        errorDiv.textContent = 'Network error. Please try again.'
        errorDiv.classList.remove('hidden')
      }
    })
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}