import { Component, TemplateManager, AppRouter } from '../core'
import { RemoteGameScreen } from './RemoteGameScreen'

/**
 * Random Match Screen (Matchmaking)
 * This screen displays the matchmaking interface with:
 * - Matchmaking status and search progress
 * - Queue information (players in queue, estimated wait time)
 * - Loading animation during search
 * - Match found notification
 * - Cancel matchmaking functionality
 */
export class RandomMatchScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private searchTimer: number | null = null
  private searchStartTime: number = 0
  private isSearching: boolean = false

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('randomMatchTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    this.startMatchmaking()
    this.setupBackButton()
    this.startSearchTimer()
  }

  cleanup(): void {
    this.stopMatchmaking()
    console.log('Cleaning up RandomMatchScreen')
  }

  /**
   * Start the matchmaking process
   */
  private startMatchmaking(): void {
    this.isSearching = true
    this.searchStartTime = Date.now()
    
    console.log('Starting matchmaking...')
    
    // Update UI to show searching state
    this.updateMatchmakingStatus('🔍', 'Searching for opponent...', 'You will be matched with another player looking for a game')
    
    // TODO: In a real implementation, this would:
    // 1. Send a request to the backend to join matchmaking queue
    // 2. Establish WebSocket connection for real-time updates
    // 3. Handle queue position updates
    // 4. Receive match found notifications
    
    // Simulate finding a match after a random time (for demo purposes)
    this.simulateMatchmaking()
  }

  /**
   * Stop the matchmaking process
   */
  private stopMatchmaking(): void {
    this.isSearching = false
    
    if (this.searchTimer) {
      window.clearInterval(this.searchTimer)
      this.searchTimer = null
    }
    
    console.log('Stopping matchmaking...')
    
    // TODO: In a real implementation, this would:
    // 1. Send a request to the backend to leave matchmaking queue
    // 2. Close WebSocket connections
    // 3. Clean up any ongoing processes
  }

  /**
   * Set up the back to options button functionality
   */
  private setupBackButton(): void {
    const backBtn = this.element?.querySelector('#backToRemoteOptionsFromMatchBtn') as HTMLButtonElement
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.goBackToRemoteOptions()
      })
    }
  }

  /**
   * Start the search timer to update elapsed time
   */
  private startSearchTimer(): void {
    this.searchTimer = window.setInterval(() => {
      if (this.isSearching) {
        this.updateSearchTime()
      }
    }, 1000)
  }

  /**
   * Update the search elapsed time display
   */
  private updateSearchTime(): void {
    const elapsed = Math.floor((Date.now() - this.searchStartTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    const searchTimeElement = this.element?.querySelector('#searchTime')
    if (searchTimeElement) {
      searchTimeElement.textContent = timeString
    }
  }

  /**
   * Update matchmaking status display
   */
  private updateMatchmakingStatus(icon: string, statusText: string, subtext: string): void {
    const statusIcon = this.element?.querySelector('#matchmakingStatusIcon')
    const statusTextElement = this.element?.querySelector('#matchmakingStatusText')
    const subtextElement = this.element?.querySelector('#matchmakingSubtext')
    
    if (statusIcon) statusIcon.textContent = icon
    if (statusTextElement) statusTextElement.textContent = statusText
    if (subtextElement) subtextElement.textContent = subtext
  }

  /**
   * Update queue information
   */
  private updateQueueInfo(playersInQueue: number): void {
    const playersElement = this.element?.querySelector('#playersInQueue')
    
    if (playersElement) playersElement.textContent = playersInQueue.toString()
  }

  /**
   * Show match found state
   */
  private showMatchFound(opponentName: string): void {
    // Hide the regular matchmaking sections
    const statusSection = this.element?.querySelector('.container-white:nth-of-type(1)') as HTMLElement
    const queueSection = this.element?.querySelector('.container-white:nth-of-type(2)') as HTMLElement
    const loadingSection = this.element?.querySelector('.container-white:nth-of-type(3)') as HTMLElement
    
    if (statusSection) statusSection.style.display = 'none'
    if (queueSection) queueSection.style.display = 'none'
    if (loadingSection) loadingSection.style.display = 'none'
    
    // Show match found section
    const matchFoundSection = this.element?.querySelector('#matchFoundSection')
    const opponentNameElement = this.element?.querySelector('#opponentName')
    
    if (matchFoundSection) {
      matchFoundSection.classList.remove('hidden')
    }
    
    if (opponentNameElement) {
      opponentNameElement.textContent = opponentName
    }
    
    // Start countdown to game start
    this.startGameCountdown()
  }

  /**
   * Start countdown to game start
   */
  private startGameCountdown(): void {
    let countdown = 3
    const countdownElement = this.element?.querySelector('#gameStartCountdown')
    
    const countdownInterval = setInterval(() => {
      if (countdownElement) {
        countdownElement.textContent = countdown.toString()
      }
      
      countdown--
      
      if (countdown < 0) {
        clearInterval(countdownInterval)
        // TODO: Navigate to game screen
        console.log('Starting game...')
      }
    }, 1000)
  }

  /**
   * Go back to remote game options
   */
  private goBackToRemoteOptions(): void {
    this.stopMatchmaking()
    this.router.navigateTo(RemoteGameScreen)
  }

  /**
   * Simulate matchmaking process for demo purposes
   * TODO: Replace with real WebSocket integration
   */
  private simulateMatchmaking(): void {
    // Simulate varying queue size
    setTimeout(() => {
      if (this.isSearching) {
        this.updateQueueInfo(2)
      }
    }, 3000)
    
    setTimeout(() => {
      if (this.isSearching) {
        this.updateQueueInfo(3)
      }
    }, 8000)
    
    // Simulate finding a match after 15 seconds
    setTimeout(() => {
      if (this.isSearching) {
        this.showMatchFound('PongMaster42')
      }
    }, 15000)
  }

  /**
   * Handle real-time matchmaking updates (for future WebSocket integration)
   */
  public onMatchmakingUpdate(data: any): void {
    // TODO: Handle real-time updates from WebSocket
    console.log('Matchmaking update received:', data)
    
    if (data.type === 'queue_update') {
      this.updateQueueInfo(data.playersInQueue)
    } else if (data.type === 'match_found') {
      this.showMatchFound(data.opponentName)
    }
  }
}