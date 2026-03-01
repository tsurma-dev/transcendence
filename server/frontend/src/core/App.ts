import { AppRouter } from './AppRouter';
import { ApiService } from './ApiService';
import {
  UserProfileScreen,
  UserSettingsScreen,
  LoggedInLandingScreen,
  LoggedOutScreen,
  StartPageScreen,
  LoginScreen
} from '../screens';

export class App {
  private static instance: App
  private router = AppRouter.getInstance()
  // Back button for non-logged-in users
  private backMenuBtn: HTMLElement | null = document.getElementById('backMenuBtn')
  // Wrapper for user menu dropdown
  private userMenuWrapper: HTMLElement | null = document.getElementById('userMenuWrapper')
  private userMenuDropdown: HTMLElement | null = document.getElementById('userMenuDropdown')
  private apiService = new ApiService()
  private isUserLoggedIn: boolean = false
  private userProfileName: HTMLElement | null = document.getElementById('userProfileName')

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App()
    }
    return App.instance
  }

  init(): void {
    // Determine initial authentication state and populate username/menu
    this.apiService.getCurrentUser().then(user => {
      this.setUserLoggedIn(!!user)
    })
    // Set up back button for non-authenticated users
    this.backMenuBtn = document.getElementById('backMenuBtn')
    if (this.backMenuBtn) {
      this.backMenuBtn.addEventListener('click', () => {
        this.handleGlobalButtonClick()
      })
    }

    // Set up user menu toggle and actions
    const profileBtn = document.getElementById('userProfileBtn')
    if (profileBtn && this.userMenuDropdown) {
      // Toggle dropdown
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.userMenuDropdown!.classList.toggle('hidden')
      })
      // Close when clicking outside
      document.addEventListener('click', () => {
        this.userMenuDropdown!.classList.add('hidden')
      })
      // Prevent closing when clicking inside
      this.userMenuDropdown.addEventListener('click', (e) => e.stopPropagation())
    }
    // Profile, settings and logout menu buttons
    document.getElementById('profileMenuBtn')?.addEventListener('click', () => {
      this.userMenuDropdown?.classList.add('hidden')
      this.router.navigateToProtected(UserProfileScreen)
    })
    document.getElementById('settingsMenuBtn')?.addEventListener('click', () => {
      this.userMenuDropdown?.classList.add('hidden')
      this.router.navigateToProtected(UserSettingsScreen)
    })
    // Start Game menu button
    document.getElementById('startGameMenuBtn')?.addEventListener('click', () => {
      this.userMenuDropdown?.classList.add('hidden')
      this.router.navigateTo(LoggedInLandingScreen)
    })
    document.getElementById('logoutMenuBtn')?.addEventListener('click', () => {
      this.userMenuDropdown?.classList.add('hidden')
      this.handleGlobalButtonClick()
    })
    // Populate username in menu
    if (this.userProfileName) {
      this.apiService.getCurrentUser().then(user => {
        this.userProfileName!.textContent = user?.username || 'User'
      })
    }


    // Initialize the router and handle initial route based on current URL
    this.router.handleInitialRoute()
    console.log('App initialized, handling initial route')
  }

  private async handleGlobalButtonClick(): Promise<void> {
    if (this.isUserLoggedIn) {
      // Get current user before logout to display username
      const currentUser = await this.apiService.getCurrentUser()
      const username = currentUser?.username || 'User'

      // Handle logout
      const success = await this.apiService.logout()
      if (success) {
        this.setUserLoggedIn(false)
        this.router.navigateTo(LoggedOutScreen, username)
      } else {
        console.error('Logout failed, redirecting to start page')
        this.setUserLoggedIn(false)
        this.router.navigateTo(StartPageScreen)
      }
    } else {
      // Handle back to start
      this.router.navigateTo(StartPageScreen)
    }
  }

  private async handleUserProfileClick(): Promise<void> {
    if (this.isUserLoggedIn) {
      // Navigate to user profile screen
      this.router.navigateTo(UserProfileScreen)
    } else {
      // Navigate to login screen
      this.router.navigateTo(LoginScreen)
    }
  }

  // Method to toggle between profile menu and back button inside wrapper
  toggleUserProfileButton(loggedIn: boolean): void {
    if (!this.userMenuWrapper) return
    // Always hide on StartPageScreen
    const path = window.location.pathname
    if (path === '/start' || path === '/') {
      this.userMenuWrapper.style.display = 'none'
      return
    }
    // Ensure wrapper is always visible for other screens
    this.userMenuWrapper.style.display = 'block'
    // Hide dropdown when toggling
    if (this.userMenuDropdown) {
      this.userMenuDropdown.classList.add('hidden')
    }
    // Toggle display of profile button and back button
    const profileBtn = document.getElementById('userProfileBtn')
    const backBtn = document.getElementById('backMenuBtn')
    if (profileBtn && backBtn) {
      profileBtn.style.display = loggedIn ? 'inline-block' : 'none'
      backBtn.style.display = loggedIn ? 'none' : 'block'
    }
  }

  // Method to set user login state, update navigation and profile menu label
  setUserLoggedIn(loggedIn: boolean): void {
    this.isUserLoggedIn = loggedIn
    // Update profile menu visibility
    this.toggleUserProfileButton(loggedIn)
    // Fetch and update username in menu when logged in
    if (loggedIn && this.userProfileName) {
      this.apiService.getCurrentUser().then(user => {
        if (user?.username) {
          this.userProfileName!.textContent = user.username
        }
      })
    }
  }
}