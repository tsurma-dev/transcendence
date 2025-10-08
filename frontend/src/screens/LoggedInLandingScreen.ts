import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { QuickPlaySetupScreen } from './QuickPlaySetupScreen'
import { QuickPlayScreen } from './QuickPlayScreen'
import { RemoteGameLobbyScreen } from './RemoteGameLobbyScreen'
import { ServerGameScreen } from './ServerGameScreen'
import { TournamentLobbyScreen } from './TournamentLobbyScreen'
import { UserProfileScreen } from './UserProfileScreen'

/**
 * Logged-in Landing Page Screen
 * This screen is shown when logged-in users successfully log in
 * It provides options for quick play, remote game, single player game, tournament
 */
export class LoggedInLandingScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private documentClickHandler?: (e: Event) => void

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('loggedInLandingTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {

    this.loadOnlineUsersCount()

    // Load current user and update welcome message
    this.loadCurrentUser()

    this.setupOnlineUsersDropdown()

    // Setup button event listeners
    const startQuickPlayBtn = this.element?.querySelector('#startQuickPlayBtn') as HTMLButtonElement
    const startSinglePlayerBtn = this.element?.querySelector('#startSinglePlayerBtn') as HTMLButtonElement
    const start2PlayerBtn = this.element?.querySelector('#start2PlayerBtn') as HTMLButtonElement
    const startTournamentBtn = this.element?.querySelector('#startTournamentBtn') as HTMLButtonElement

    if (startQuickPlayBtn) {
      startQuickPlayBtn.addEventListener('click', () => {
        this.router.navigateTo(QuickPlaySetupScreen, true) // true = quick play mode
      })
    }

    if (start2PlayerBtn) {
      start2PlayerBtn.addEventListener('click', () => {
        console.log('Navigating to RemoteGameLobbyScreen')
        this.router.navigateTo(RemoteGameLobbyScreen)
      })
    }

     if (startSinglePlayerBtn) {
      startSinglePlayerBtn.addEventListener('click', async () => {
        console.log('Starting AI game...')
        
        try {
          // Get current user for player name
          const currentUser = await this.apiService.getCurrentUser()
          const playerName = currentUser?.username || 'Player'
          
          // Navigate to ServerGameScreen for AI game (server-side logic)
          this.router.navigateTo(ServerGameScreen, playerName, 'AI', 'AI')
          
        } catch (error) {
          console.error('Error starting AI game:', error)
          alert('Failed to start AI game. Please try again.')
        }
      })
    }

    if (startTournamentBtn) {
      startTournamentBtn.addEventListener('click', () => {
        console.log('Navigating to TournamentLobbyScreen')
        this.router.navigateTo(TournamentLobbyScreen)
      })
    }
    // User Profile button removed, access via online users dropdown
  }

  private async loadOnlineUsersCount(): Promise<void> {
    const onlineUsersElement = this.element?.querySelector('#onlineUsersCount')
    if (!onlineUsersElement) {
      console.error('onlineUsersCount element not found')
      return
    }

    console.log('Starting to load online users count...')
    onlineUsersElement.textContent = 'Loading...'

    try {
      const count = await this.apiService.getOnlineUsersCount()
      const userText = count === 1 ? 'user' : 'users'
      onlineUsersElement.textContent = `${count} ${userText} online`
      console.log('Successfully updated online users count:', count)
    } catch (error) {
      console.error('Error loading online users count:', error)
      onlineUsersElement.textContent = 'Offline mode'
    }
  }

  private async loadCurrentUser(): Promise<void> {
    const welcomeUsernameElement = this.element?.querySelector('#welcomeUsername')
    if (!welcomeUsernameElement) {
      console.error('welcomeUsername element not found')
      return
    }

    console.log('Loading current user for welcome message...')
    try {
      const user = await this.apiService.getCurrentUser()
      console.log('Current user for welcome:', user)

      if (user && user.username) {
        console.log('Setting welcome username to:', user.username)
        welcomeUsernameElement.textContent = user.username
      } else {
        console.log('No user data or username found, keeping default')
        welcomeUsernameElement.textContent = 'User'
      }
    } catch (error) {
      console.error('Error loading current user for welcome:', error)
      // Keep the default "User" text if there's an error
      welcomeUsernameElement.textContent = 'User'
    }
  }

  private setupOnlineUsersDropdown(): void {
    const onlineUsersToggle = this.element?.querySelector('#onlineUsersToggle') as HTMLButtonElement
    const onlineUsersDropdown = this.element?.querySelector('#onlineUsersDropdown') as HTMLElement

    if (!onlineUsersToggle || !onlineUsersDropdown) {
      console.error('Online users dropdown elements not found')
      return
    }

    // Toggle dropdown on button click
    onlineUsersToggle.addEventListener('click', async (e) => {
      e.stopPropagation()

      if (onlineUsersDropdown.classList.contains('hidden')) {
        // Show dropdown and load users
        await this.loadOnlineUsersList()
        onlineUsersDropdown.classList.remove('hidden')
      } else {
        // Hide dropdown
        onlineUsersDropdown.classList.add('hidden')
      }
    })

    // Close dropdown when clicking outside
    this.documentClickHandler = (e) => {
      if (!onlineUsersDropdown.contains(e.target as Node) && !onlineUsersToggle.contains(e.target as Node)) {
        onlineUsersDropdown.classList.add('hidden')
      }
    }
    document.addEventListener('click', this.documentClickHandler)

    // Prevent dropdown from closing when clicking inside it
    onlineUsersDropdown.addEventListener('click', (e) => {
      e.stopPropagation()
    })
  }

  private async loadOnlineUsersList(): Promise<void> {
    const onlineUsersListElement = this.element?.querySelector('#onlineUsersList')
    if (!onlineUsersListElement) {
      console.error('onlineUsersList element not found')
      return
    }

    // Show loading state
    onlineUsersListElement.innerHTML = '<div class="text-center text-gray-500 font-mono text-sm">Loading users...</div>'

    try {
      const users = await this.apiService.getOnlineUsersList()
      console.log('Online users list loaded:', users)

      if (users.length === 0) {
        onlineUsersListElement.innerHTML = '<div class="text-center text-gray-500 font-mono text-sm">No users online</div>'
        return
      }

      // Create user list HTML
      const userListHTML = users.map(user => `
        <div class="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
          <div class="flex items-center">
            <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <button class="text-content font-semibold hover:text-blue-600 hover:underline cursor-pointer user-profile-link" data-username="${user.username}">
              ${user.username}
            </button>
          </div>
          <div class="text-green-600 font-mono text-xs font-bold">ONLINE</div>
        </div>
      `).join('')

      onlineUsersListElement.innerHTML = userListHTML

      // Add click event listeners to user profile links
      this.setupUserProfileLinks()
    } catch (error) {
      console.error('Error loading online users list:', error)
      onlineUsersListElement.innerHTML = '<div class="text-center text-red-500 font-mono text-sm">Error loading users</div>'
    }
  }

  private setupUserProfileLinks(): void {
    const userProfileLinks = this.element?.querySelectorAll('.user-profile-link')
    if (!userProfileLinks) return

    userProfileLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const username = (link as HTMLElement).getAttribute('data-username')
        if (username) {
          console.log('Navigating to profile for user:', username)

          // Check if this is the current user's own profile
          try {
            const currentUser = await this.apiService.getCurrentUser()
            if (currentUser && currentUser.username === username) {
              // Navigate to own profile (no username parameter)
              this.router.navigateTo(UserProfileScreen)
            } else {
              // Navigate to other user's profile (with username parameter)
              this.router.navigateTo(UserProfileScreen, username)
            }
          } catch (error) {
            console.error('Error checking current user:', error)
            // Fallback: navigate to other user's profile
            this.router.navigateTo(UserProfileScreen, username)
          }

          // Close the dropdown
          const onlineUsersDropdown = this.element?.querySelector('#onlineUsersDropdown')
          if (onlineUsersDropdown) {
            onlineUsersDropdown.classList.add('hidden')
          }
        }
      })
    })
  }

  cleanup(): void {
    // Remove the document click listener to prevent memory leaks
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler)
      this.documentClickHandler = undefined
    }
    // Other cleanup handled automatically by unmount
  }
}