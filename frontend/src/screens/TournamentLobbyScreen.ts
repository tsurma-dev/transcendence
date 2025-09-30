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
  private refreshInterval: number | null = null

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
    // User is now in Tournament Lobby - you can add any logic here
    console.log('User is currently visiting TournamentLobbyScreen!')
    this.onTournamentLobbyVisit()

    const leaveTournamentBtn = this.element?.querySelector('#leaveTournamentBtn') as HTMLButtonElement

    if (leaveTournamentBtn) {
      leaveTournamentBtn.addEventListener('click', () => {
        // Navigate back to logged-in landing page
        this.router.navigateTo(LoggedInLandingScreen)
      })
    }

    // Load initial tournament state
    this.loadTournamentData()
    
    // Set up auto-refresh to keep player list updated
    this.startAutoRefresh()
  }

  private startAutoRefresh(): void {
    // Refresh tournament data every 5 seconds to keep player list current
    this.refreshInterval = window.setInterval(() => {
      console.log('Auto-refreshing tournament data...')
      this.loadTournamentData()
    }, 5000)
  }

  private onTournamentLobbyVisit(): void {
    // This method is called whenever user visits the tournament lobby
    console.log('Tournament lobby visited at:', new Date().toISOString())
  }

  private async loadTournamentData(): Promise<void> {
    console.log('Loading tournament data...')

    try {
      // Load online users to populate tournament slots
      await this.loadTournamentPlayers()
      
      // Set tournament configuration
      this.updateTournamentInfo()
      
    } catch (error) {
      console.error('Failed to load tournament data:', error)
      this.showTournamentError()
    }
  }

  private async loadTournamentPlayers(): Promise<void> {
    try {
      // Get online users who could join the tournament
      const onlineUsers = await this.apiService.getOnlineUsersList()
      console.log('Online users for tournament:', onlineUsers)

      // Get current user to include them
      const currentUser = await this.apiService.getCurrentUser()
      
      if (currentUser) {
        // Make sure current user is included in the tournament
        const usersInTournament = [currentUser, ...onlineUsers.filter(u => u.username !== currentUser.username)]
        this.populateTournamentSlots(usersInTournament.slice(0, 4)) // Max 4 players for tournament
      } else {
        // Fallback to online users only
        this.populateTournamentSlots(onlineUsers.slice(0, 4))
      }
      
    } catch (error) {
      console.error('Failed to load tournament players:', error)
      this.showNoPlayersMessage()
    }
  }

  private populateTournamentSlots(users: any[]): void {
    const tournamentPlayersList = this.element?.querySelector('#tournamentPlayersList')
    if (!tournamentPlayersList) return

    // Clear existing slots
    tournamentPlayersList.innerHTML = ''

    const maxSlots = 4
    
    // Create slots for actual users
    for (let i = 0; i < Math.min(users.length, maxSlots); i++) {
      const user = users[i]
      const playerSlot = this.createPlayerSlot(user.username, 'Ready', true)
      tournamentPlayersList.appendChild(playerSlot)
    }
    
    // Fill remaining slots with "waiting" placeholders
    for (let i = users.length; i < maxSlots; i++) {
      const emptySlot = this.createEmptySlot()
      tournamentPlayersList.appendChild(emptySlot)
    }
  }

  private createPlayerSlot(username: string, status: string, isOnline: boolean): HTMLElement {
    const playerSlot = document.createElement('div')
    playerSlot.className = 'player-slot flex items-center p-4 container-shadowed bg-gradient-to-r from-green-100 to-green-200'

    // Online/offline indicator
    const indicator = document.createElement('div')
    indicator.className = isOnline ? 'indicator-online' : 'indicator-offline'

    // Player info container
    const playerInfo = document.createElement('div')
    playerInfo.className = 'flex-1'

    // Username
    const usernameEl = document.createElement('div')
    usernameEl.className = 'text-black font-bold font-mono'
    usernameEl.textContent = username

    // Status
    const statusEl = document.createElement('div')
    statusEl.className = 'text-content'
    statusEl.textContent = status

    // Ready indicator
    const readyIcon = document.createElement('div')
    readyIcon.className = 'text-green-600 font-bold text-2xl'
    readyIcon.textContent = '✓'

    // Assemble the slot
    playerInfo.appendChild(usernameEl)
    playerInfo.appendChild(statusEl)
    playerSlot.appendChild(indicator)
    playerSlot.appendChild(playerInfo)
    playerSlot.appendChild(readyIcon)

    return playerSlot
  }

  private createEmptySlot(): HTMLElement {
    const emptySlot = document.createElement('div')
    emptySlot.className = 'player-slot flex items-center p-4 container-shadowed bg-gradient-to-r from-gray-100 to-gray-200'

    // Offline indicator
    const indicator = document.createElement('div')
    indicator.className = 'indicator-offline'

    // Empty slot info
    const slotInfo = document.createElement('div')
    slotInfo.className = 'flex-1'

    // Waiting message
    const waitingMsg = document.createElement('div')
    waitingMsg.className = 'text-gray-500 font-bold font-mono'
    waitingMsg.textContent = 'Waiting for player...'

    // Empty status
    const emptyStatus = document.createElement('div')
    emptyStatus.className = 'text-content'
    emptyStatus.textContent = 'Empty slot'

    // Waiting icon
    const waitingIcon = document.createElement('div')
    waitingIcon.className = 'text-gray-400 font-bold text-2xl'
    waitingIcon.textContent = '⏳'

    // Assemble the empty slot
    slotInfo.appendChild(waitingMsg)
    slotInfo.appendChild(emptyStatus)
    emptySlot.appendChild(indicator)
    emptySlot.appendChild(slotInfo)
    emptySlot.appendChild(waitingIcon)

    return emptySlot
  }

  private updateTournamentInfo(): void {
    // Count actual players (not empty slots)
    const playerSlots = this.element?.querySelectorAll('.player-slot')
    const actualPlayers = Array.from(playerSlots || []).filter(slot => 
      !slot.textContent?.includes('Waiting for player')
    )

    const tournamentPlayers = this.element?.querySelector('#tournamentPlayers')
    const tournamentMaxPlayers = this.element?.querySelector('#tournamentMaxPlayers')
    const tournamentStatus = this.element?.querySelector('#tournamentStatus')

    if (tournamentPlayers) tournamentPlayers.textContent = actualPlayers.length.toString()
    if (tournamentMaxPlayers) tournamentMaxPlayers.textContent = '4'
    
    // Update status based on player count
    if (tournamentStatus) {
      if (actualPlayers.length >= 4) {
        tournamentStatus.textContent = 'Ready to Start'
      } else if (actualPlayers.length >= 2) {
        tournamentStatus.textContent = 'Waiting for More Players'
      } else {
        tournamentStatus.textContent = 'Waiting for Players'
      }
    }
  }

  private showNoPlayersMessage(): void {
    const tournamentPlayersList = this.element?.querySelector('#tournamentPlayersList')
    if (tournamentPlayersList) {
      tournamentPlayersList.innerHTML = `
        <div class="col-span-2 text-center text-gray-500 font-mono p-8">
          No online players found. Tournament requires at least 2 players.
        </div>
      `
    }
  }

  private showTournamentError(): void {
    const tournamentPlayersList = this.element?.querySelector('#tournamentPlayersList')
    if (tournamentPlayersList) {
      tournamentPlayersList.innerHTML = `
        <div class="col-span-2 text-center text-red-500 font-mono p-8">
          Failed to load tournament data. Please try again.
        </div>
      `
    }
  }

  cleanup(): void {
    // Clear the refresh interval to prevent memory leaks
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    // Other cleanup handled automatically by unmount
  }
}