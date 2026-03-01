import { Component, TemplateManager, AppRouter, ApiService, App } from '../core'
import { LoginScreen } from './LoginScreen'
import { StartPageScreen } from './StartPageScreen'

/**
 * User Settings Screen
 */
export class UserSettingsScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('userSettingsTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Show user menu for authenticated users
      App.getInstance().setUserLoggedIn(true)
    }
    return div
  }

  async setupEvents(): Promise<void> {
    // Load initial 2FA status
    await this.load2FAStatus()

    const updatePasswordForm = this.element?.querySelector('#updatePasswordForm') as HTMLFormElement
    const updateEmailForm = this.element?.querySelector('#updateEmailForm') as HTMLFormElement
    const updateUsernameForm = this.element?.querySelector('#updateUsernameForm') as HTMLFormElement
    const deleteAccountForm = this.element?.querySelector('#deleteAccountForm') as HTMLFormElement

    // 2FA controls
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement
    const verify2FABtn = this.element?.querySelector('#verify2FABtn') as HTMLButtonElement
    const confirmEnable2FABtn = this.element?.querySelector('#confirmEnable2FABtn') as HTMLButtonElement
    const cancelEnable2FABtn = this.element?.querySelector('#cancelEnable2FABtn') as HTMLButtonElement

    // Handle password update
    if (updatePasswordForm) {
      updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const passwordResponseDiv = this.element?.querySelector('#passwordResponse') as HTMLElement
        await this.handlePasswordUpdate(updatePasswordForm, passwordResponseDiv)
      })
    }

    // Handle email update
    if (updateEmailForm) {
      updateEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const emailResponseDiv = this.element?.querySelector('#emailResponse') as HTMLElement
        await this.handleEmailUpdate(updateEmailForm, emailResponseDiv)
      })
    }

    // Handle username update
    if (updateUsernameForm) {
      updateUsernameForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const usernameResponseDiv = this.element?.querySelector('#usernameResponse') as HTMLElement
        await this.handleUsernameUpdate(updateUsernameForm, usernameResponseDiv)
      })
    }

    // Handle account deletion
    if (deleteAccountForm) {
      deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.')
        if (confirmDelete) {
          const deleteResponseDiv = this.element?.querySelector('#deleteResponse') as HTMLElement
          await this.handleAccountDeletion(deleteAccountForm, deleteResponseDiv)
        }
      })
    }

    // Handle Enable 2FA
    if (enable2FABtn) {
      enable2FABtn.addEventListener('click', async () => {
        this.showPasswordConfirmation2FA()
      })
    }

    // Handle 2FA password confirmation
    if (confirmEnable2FABtn) {
      confirmEnable2FABtn.addEventListener('click', async () => {
        await this.handleConfirmEnable2FA()
      })
    }

    // Handle 2FA enable cancellation
    if (cancelEnable2FABtn) {
      cancelEnable2FABtn.addEventListener('click', () => {
        this.hidePasswordConfirmation2FA()
      })
    }

    // Handle 2FA disable
    if (disable2FABtn) {
      disable2FABtn.addEventListener('click', async () => {
        // Invoke disable 2FA functionality
        await this.handleDisable2FA()
      })
    }

    // Handle 2FA verify
    if (verify2FABtn) {
      verify2FABtn.addEventListener('click', async () => {
        const codeInput = this.element?.querySelector('#verificationCode') as HTMLInputElement
        if (codeInput) {
          await this.handleVerify2FA(codeInput.value)
        }
      })
    }

  }

  private async handlePasswordUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('password') as string

    // Validate that both fields are filled
    if (!currentPassword || !newPassword) {
      responseDiv.textContent = 'Please fill in both current and new password fields'
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      responseDiv.textContent = 'New password must be different from current password'
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Show loading state
    responseDiv.textContent = 'Verifying current password...'
    responseDiv.className = 'text-info'
    responseDiv.classList.remove('hidden')

    // First verify the current password using login endpoint
    const verificationResult = await this.apiService.verifyCurrentPassword(currentPassword)

    if (!verificationResult.success) {
      responseDiv.textContent = `Error: ${verificationResult.message || 'Current password is incorrect'}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Current password is correct, proceed with password update
    responseDiv.textContent = 'Updating password...'
    responseDiv.className = 'text-info'

    const result = await this.apiService.updatePassword(newPassword, currentPassword)

    if (result.success) {
      responseDiv.textContent = 'Password updated successfully! You have been logged out for security. Redirecting to login...'
      responseDiv.className = 'text-success'
      responseDiv.classList.remove('hidden')
      form.reset()

      // User is logged out after password change for security
      setTimeout(() => {
        this.router.navigateTo(LoginScreen)
      }, 2000)
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleEmailUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const currentEmail = formData.get('currentEmail') as string
    const newEmail = formData.get('email') as string
    const currentPassword = formData.get('currentPassword') as string

    // Validate input
    if (!currentEmail || !newEmail || !currentPassword) {
      responseDiv.textContent = 'All fields are required'
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Check that new email is different from current
    if (currentEmail === newEmail) {
      responseDiv.textContent = 'New email must be different from current email'
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Verify current email matches user's actual email
    const user = await this.apiService.getCurrentUser()
    if (!user || user.email !== currentEmail) {
      responseDiv.textContent = 'Current email is incorrect'
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Show loading state
    responseDiv.textContent = 'Verifying current password...'
    responseDiv.className = 'text-info'
    responseDiv.classList.remove('hidden')

    // Verify current password using login endpoint
    const verificationResult = await this.apiService.verifyCurrentPassword(currentPassword)

    if (!verificationResult.success) {
      responseDiv.textContent = `Error: ${verificationResult.message || 'Current password is incorrect'}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
      return
    }

    // Password verified, proceed with email update
    responseDiv.textContent = 'Updating email...'
    responseDiv.className = 'text-info'

    const result = await this.apiService.updateEmail(newEmail)

    if (result.success) {
      responseDiv.textContent = 'Email updated successfully! You have been logged out for security. Redirecting to login...'
      responseDiv.className = 'text-success'
      responseDiv.classList.remove('hidden')
      form.reset()

      // User is logged out after email change for security
      setTimeout(() => {
        this.router.navigateTo(LoginScreen)
      }, 2000)
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleUsernameUpdate(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const username = formData.get('username') as string

    const result = await this.apiService.updateUsername(username)

    if (result.success) {
      responseDiv.textContent = 'Username updated successfully!'
      responseDiv.className = 'text-success'
      responseDiv.classList.remove('hidden')
      form.reset()
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
    }
  }

  private async handleAccountDeletion(form: HTMLFormElement, responseDiv: HTMLElement): Promise<void> {
    const formData = new FormData(form)
    const password = formData.get('password') as string

    const result = await this.apiService.deleteAccount(password)

    if (result.success) {
      responseDiv.textContent = 'Account deleted successfully. Redirecting...'
      responseDiv.className = 'text-success'
      responseDiv.classList.remove('hidden')

      // Redirect to start page after successful deletion
      setTimeout(() => {
        this.router.navigateTo(StartPageScreen)
      }, 2000)
    } else {
      responseDiv.textContent = `Error: ${result.message}`
      responseDiv.className = 'text-error'
      responseDiv.classList.remove('hidden')
    }
  }

  private async load2FAStatus(): Promise<void> {
    const statusResult = await this.apiService.get2FAStatus()
    const statusElement = this.element?.querySelector('#twoFAStatus') as HTMLElement
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement

    if (statusElement && enable2FABtn && disable2FABtn) {
      if (statusResult.success) {
        if (statusResult.enabled) {
          statusElement.textContent = 'Enabled'
          statusElement.className = 'text-green-600 font-bold font-mono'
          enable2FABtn.classList.add('hidden')
          disable2FABtn.classList.remove('hidden')
        } else {
          statusElement.textContent = 'Disabled'
          statusElement.className = 'text-red-600 font-bold font-mono'
          enable2FABtn.classList.remove('hidden')
          disable2FABtn.classList.add('hidden')
        }
      } else {
        statusElement.textContent = 'Error loading status'
        statusElement.className = 'text-red-600 font-bold font-mono'
      }
    }
  }

  private async handleEnable2FA(): Promise<void> {
    const result = await this.apiService.enable2FA()
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement
    const qrCodeSection = this.element?.querySelector('#qrCodeSection') as HTMLElement
    const qrCodeContainer = this.element?.querySelector('#qrCodeContainer') as HTMLElement
    const manualSecret = this.element?.querySelector('#manualSecret') as HTMLElement

    if (result.success && result.qrCode && result.secret) {
      // Show QR code setup
      if (qrCodeContainer && manualSecret && qrCodeSection) {
        qrCodeContainer.innerHTML = `<img src="${result.qrCode}" alt="2FA QR Code" class="max-w-full" />`
        manualSecret.textContent = result.secret
        qrCodeSection.classList.remove('hidden')
      }

      this.showResponse(responseDiv, 'Scan the QR code with your authenticator app and enter the verification code.', 'success')
    } else {
      this.showResponse(responseDiv, result.message || 'Failed to enable 2FA', 'error')
    }
  }

  private async handleVerify2FA(code: string): Promise<void> {
    if (!code || code.length !== 6) {
      const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement
      this.showResponse(responseDiv, 'Please enter a valid 6-digit code', 'error')
      return
    }

    const result = await this.apiService.verify2FA(code)
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (result.success) {
      this.showResponse(responseDiv, '2FA has been successfully enabled!', 'success')

      // Hide QR code section and show disable button
      const qrCodeSection = this.element?.querySelector('#qrCodeSection') as HTMLElement
      const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
      const disable2FABtn = this.element?.querySelector('#disable2FABtn') as HTMLButtonElement
      const statusElement = this.element?.querySelector('#twoFAStatus') as HTMLElement

      if (qrCodeSection) qrCodeSection.classList.add('hidden')
      if (enable2FABtn) enable2FABtn.classList.add('hidden')
      if (disable2FABtn) disable2FABtn.classList.remove('hidden')
      if (statusElement) {
        statusElement.textContent = 'Enabled'
        statusElement.className = 'text-green-600 font-bold font-mono'
      }
    } else {
      this.showResponse(responseDiv, result.message || 'Verification failed', 'error')
    }
  }

  private async handleDisable2FA(): Promise<void> {
    const result = await this.apiService.disable2FA()
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (result.success) {
      await this.load2FAStatus() // Refresh status display
      this.showResponse(responseDiv, '2FA has been disabled successfully!', 'success')
    } else {
      this.showResponse(responseDiv, result.message || 'Failed to disable 2FA', 'error')
    }
  }

  private showPasswordConfirmation2FA(): void {
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const passwordSection = this.element?.querySelector('#twoFAPasswordSection') as HTMLElement
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (enable2FABtn) enable2FABtn.classList.add('hidden')
    if (passwordSection) passwordSection.classList.remove('hidden')
    if (responseDiv) responseDiv.classList.add('hidden')

    // Clear password field
    const passwordInput = this.element?.querySelector('#twoFAPassword') as HTMLInputElement
    if (passwordInput) passwordInput.value = ''
  }

  // When hiding the password confirmation section, optionally restore the enable button.
  // If restoreEnable is false, the enable button remains hidden (used when proceeding to QR setup).
  private hidePasswordConfirmation2FA(restoreEnable: boolean = true): void {
    const enable2FABtn = this.element?.querySelector('#enable2FABtn') as HTMLButtonElement
    const passwordSection = this.element?.querySelector('#twoFAPasswordSection') as HTMLElement
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (enable2FABtn && restoreEnable) enable2FABtn.classList.remove('hidden')
    if (passwordSection) passwordSection.classList.add('hidden')
    if (responseDiv) responseDiv.classList.add('hidden')

    // Clear password field
    const passwordInput = this.element?.querySelector('#twoFAPassword') as HTMLInputElement
    if (passwordInput) passwordInput.value = ''
  }

  private async handleConfirmEnable2FA(): Promise<void> {
    const passwordInput = this.element?.querySelector('#twoFAPassword') as HTMLInputElement
    const responseDiv = this.element?.querySelector('#twoFAResponse') as HTMLElement

    if (!passwordInput || !passwordInput.value.trim()) {
      this.showResponse(responseDiv, 'Please enter your password', 'error')
      return
    }

    const password = passwordInput.value.trim()

    // Show loading state
    responseDiv.textContent = 'Verifying password...'
    responseDiv.className = 'text-info'
    responseDiv.classList.remove('hidden')

    // Verify current password
    const verificationResult = await this.apiService.verifyCurrentPassword(password)

    if (!verificationResult.success) {
      this.showResponse(responseDiv, verificationResult.message || 'Password is incorrect', 'error')
      return
    }

  // Password verified, hide confirmation (do NOT restore the enable button) and enable 2FA
  this.hidePasswordConfirmation2FA(false)
    responseDiv.textContent = 'Password verified. Setting up 2FA...'
    responseDiv.className = 'text-info'
    responseDiv.classList.remove('hidden')

    // Proceed with 2FA enablement
    await this.handleEnable2FA()
  }

  private showResponse(responseDiv: HTMLElement, message: string, type: 'success' | 'error'): void {
    if (!responseDiv) return

    responseDiv.textContent = message
    responseDiv.className = type === 'success' ?
      'text-success' :
      'text-error'
    responseDiv.classList.remove('hidden')

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        responseDiv.classList.add('hidden')
      }, 5000)
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}