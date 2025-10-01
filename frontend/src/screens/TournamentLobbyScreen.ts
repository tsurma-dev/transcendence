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
  private tournamentPlayers: any[] = []
  private tournamentBracket: any = null

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

    // Set up tournament start button (will be added dynamically)
    this.setupTournamentStartButton()
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
      // TODO: Implement proper tournament lobby management with backend support
      // PLACEHOLDER SIMULATION: Simulating 4 players joining tournament lobby over time
      // This is a temporary simulation for testing tournament bracket functionality
      
      // Get current user
      const currentUser = await this.apiService.getCurrentUser()
      
      if (currentUser) {
        // Start with just the current user
        console.log('Current user joined tournament lobby:', currentUser.username)
        this.populateTournamentSlots([currentUser])
        this.addSimulationIndicator()
        
        // Wait 5 seconds, then simulate other players joining
        setTimeout(() => {
          this.simulatePlayersJoining(currentUser)
        }, 5000)
        
      } else {
        console.error('Could not get current user for tournament lobby')
        this.showNoPlayersMessage()
      }
      
    } catch (error) {
      console.error('Failed to load tournament players:', error)
      this.showNoPlayersMessage()
    }
  }

  private populateTournamentSlots(users: any[]): void {
    const tournamentPlayersList = this.element?.querySelector('#tournamentPlayersList')
    if (!tournamentPlayersList) {
      console.error('Tournament players list element not found')
      return
    }

    // Store tournament players
    this.tournamentPlayers = users.slice(0, 4)
    console.log('Populating tournament slots with users:', this.tournamentPlayers)

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

    console.log('Tournament slots populated, player count:', this.tournamentPlayers.length)

    // Check if we have 4 players and generate tournament bracket
    if (this.tournamentPlayers.length >= 4) {
      console.log('4 players found, generating tournament bracket')
      this.generateTournamentBracket()
      this.displayTournamentBracket()
    } else {
      // Show placeholder when we don't have enough players
      console.log('Not enough players, showing placeholder')
      this.showPlaceholder()
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
        tournamentStatus.textContent = 'Bracket Generated - Ready to Start!'
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

  private addSimulationIndicator(): void {
    // Add a visual indicator that this is a simulation
    const tournamentHeader = this.element?.querySelector('.text-4xl')
    if (tournamentHeader) {
      tournamentHeader.innerHTML = `
        🏆 Tournament Lobby 
        <span class="text-lg bg-yellow-500 text-black px-2 py-1 rounded ml-2 font-mono">
          SIMULATION MODE
        </span>
      `
    }

    // Also update the tournament status to indicate simulation
    const tournamentStatus = this.element?.querySelector('#tournamentStatus')
    if (tournamentStatus) {
      tournamentStatus.innerHTML = `
        <span class="text-orange-600">Waiting for players to join...</span>
      `
    }
  }

  private simulatePlayersJoining(currentUser: any): void {
    console.log('Simulating other players joining...')
    
    // Create simulated players
    const additionalPlayers = [
      { id: 2, username: 'Player2', email: 'player2@example.com' },
      { id: 3, username: 'Player3', email: 'player3@example.com' },
      { id: 4, username: 'Player4', email: 'player4@example.com' }
    ]

    let currentPlayers = [currentUser]
    
    // Add players one by one with a delay between each
    additionalPlayers.forEach((player, index) => {
      setTimeout(() => {
        currentPlayers.push(player)
        console.log(`Player ${player.username} joined the lobby`)
        this.populateTournamentSlots([...currentPlayers])
        
        // Update status message
        const tournamentStatus = this.element?.querySelector('#tournamentStatus')
        if (tournamentStatus) {
          if (currentPlayers.length === 4) {
            tournamentStatus.innerHTML = `
              <span class="text-green-600">Simulation: 4 Players Connected - Ready!</span>
            `
          } else {
            tournamentStatus.innerHTML = `
              <span class="text-orange-600">Simulation: ${currentPlayers.length}/4 Players Connected</span>
            `
          }
        }
      }, (index + 1) * 1500) // 1.5 second delay between each player
    })
  }

  private generateTournamentBracket(): void {
    if (this.tournamentPlayers.length < 4) return

    // Shuffle players randomly for fair matchmaking
    const shuffledPlayers = [...this.tournamentPlayers].sort(() => Math.random() - 0.5)

    // Create tournament bracket structure
    this.tournamentBracket = {
      semifinals: [
        {
          id: 'semi1',
          player1: shuffledPlayers[0],
          player2: shuffledPlayers[1],
          winner: null,
          status: 'pending'
        },
        {
          id: 'semi2', 
          player1: shuffledPlayers[2],
          player2: shuffledPlayers[3],
          winner: null,
          status: 'pending'
        }
      ],
      final: {
        id: 'final',
        player1: null, // Winner of semi1
        player2: null, // Winner of semi2
        winner: null,
        status: 'waiting'
      }
    }

    console.log('Tournament bracket generated:', this.tournamentBracket)
  }

  private displayTournamentBracket(): void {
    if (!this.tournamentBracket) {
      console.error('No tournament bracket to display')
      return
    }

    console.log('Displaying tournament bracket')

    // Hide the placeholder
    const placeholder = this.element?.querySelector('#tournamentPlaceholder')
    if (placeholder) {
      console.log('Hiding tournament matches placeholder')
      ;(placeholder as HTMLElement).style.display = 'none'
    }

    // Show the tournament bracket container
    const bracketContainer = this.element?.querySelector('#tournamentBracketContainer')
    if (bracketContainer) {
      console.log('Showing tournament bracket container')
      ;(bracketContainer as HTMLElement).style.display = 'block'
      
      // Update the bracket with actual player data
      this.populateBracketData()
    } else {
      console.error('Tournament bracket container not found')
    }
  }

  private populateBracketData(): void {
    if (!this.tournamentBracket) return

    const { semifinals, final } = this.tournamentBracket

    // Populate Semifinal 1
    const semi1Player1 = this.element?.querySelector('#semi1Player1')
    const semi1Player2 = this.element?.querySelector('#semi1Player2')
    const semi1Status = this.element?.querySelector('#semi1Status')
    
    if (semi1Player1) semi1Player1.textContent = semifinals[0].player1.username
    if (semi1Player2) semi1Player2.textContent = semifinals[0].player2.username
    if (semi1Status) semi1Status.textContent = semifinals[0].status.toUpperCase()

    // Populate Semifinal 2
    const semi2Player1 = this.element?.querySelector('#semi2Player1')
    const semi2Player2 = this.element?.querySelector('#semi2Player2')
    const semi2Status = this.element?.querySelector('#semi2Status')
    
    if (semi2Player1) semi2Player1.textContent = semifinals[1].player1.username
    if (semi2Player2) semi2Player2.textContent = semifinals[1].player2.username
    if (semi2Status) semi2Status.textContent = semifinals[1].status.toUpperCase()

    // Populate Final (initially shows placeholders)
    const finalPlayer1 = this.element?.querySelector('#finalPlayer1')
    const finalPlayer2 = this.element?.querySelector('#finalPlayer2')
    const finalStatus = this.element?.querySelector('#finalStatus')
    
    if (finalPlayer1) finalPlayer1.textContent = 'Winner of SF1'
    if (finalPlayer2) finalPlayer2.textContent = 'Winner of SF2'
    if (finalStatus) finalStatus.textContent = final.status.toUpperCase()

    console.log('Tournament bracket data populated')
  }



  private showPlaceholder(): void {
    console.log('Restoring placeholder')
    
    // Hide the tournament bracket container
    const bracketContainer = this.element?.querySelector('#tournamentBracketContainer')
    if (bracketContainer) {
      console.log('Hiding tournament bracket container')
      ;(bracketContainer as HTMLElement).style.display = 'none'
    }

    // Show the placeholder
    const placeholder = this.element?.querySelector('#tournamentPlaceholder')
    if (placeholder) {
      console.log('Showing tournament matches placeholder')
      ;(placeholder as HTMLElement).style.display = 'block'
    } else {
      console.error('Tournament matches placeholder not found for restoration')
    }
  }

  private setupTournamentStartButton(): void {
    // Use event delegation to handle dynamically added button
    this.element?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target?.id === 'startTournamentBtn') {
        this.startTournament()
      }
    })
  }

  private startTournament(): void {
    if (!this.tournamentBracket) {
      console.error('Tournament bracket not generated')
      return
    }

    console.log('Starting tournament with bracket:', this.tournamentBracket)
    
    // Update tournament status
    const tournamentStatus = this.element?.querySelector('#tournamentStatus')
    if (tournamentStatus) {
      tournamentStatus.textContent = 'Tournament Started!'
    }

    // Here you would typically:
    // 1. Start the first semifinal matches
    // 2. Navigate to game screens
    // 3. Handle match progression
    // For now, we'll just log the action
    alert('Tournament is starting! First matches: ' + 
          this.tournamentBracket.semifinals[0].player1.username + ' vs ' + this.tournamentBracket.semifinals[0].player2.username + 
          ' and ' + 
          this.tournamentBracket.semifinals[1].player1.username + ' vs ' + this.tournamentBracket.semifinals[1].player2.username)
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