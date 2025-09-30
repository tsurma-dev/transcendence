import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { UserProfileScreen } from './UserProfileScreen'
// ApiService imported from core

/**
 * Match History Screen
 * Shows user's match history with statistics
 */
export class MatchHistoryScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private targetUsername?: string  // Username of the profile that was being viewed

  constructor(username?: string) {
    super()
    this.targetUsername = username
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('matchHistoryTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const backToProfileBtn = this.element?.querySelector('#backToProfileBtn') as HTMLButtonElement

    // Handle back to profile button
    if (backToProfileBtn) {
      backToProfileBtn.addEventListener('click', () => {
        if (this.targetUsername) {
          // Go back to specific user's profile
          this.router.navigateTo(UserProfileScreen, this.targetUsername)
        } else {
          // Go back to current user's profile
          this.router.navigateTo(UserProfileScreen)
        }
      })
    }

    // Load match history data (placeholder)
    this.loadMatchHistory()
  }

  private async loadMatchHistory(): Promise<void> {
    try {
      // Get the username to fetch matches for
      const username = this.targetUsername || (await this.apiService.getCurrentUser())?.username
      
      if (!username) {
        console.error('No username available to load match history')
        return
      }

      console.log('Loading match history for user:', username)
      const matches = await this.apiService.getUserMatches(username)
      
      if (matches && matches.length > 0) {
        this.populateMatchHistory(matches, username)
      } else {
        this.showNoMatchesMessage()
      }
    } catch (error) {
      console.error('Failed to load match history:', error)
      this.showErrorMessage()
    }
  }

  private populateMatchHistory(matches: any[], currentUsername: string): void {
    const totalMatchesEl = this.element?.querySelector('#totalMatches')
    const matchesWonEl = this.element?.querySelector('#matchesWon')
    const winPercentageEl = this.element?.querySelector('#winPercentage')
    const matchHistoryList = this.element?.querySelector('#matchHistoryList')

    if (!matchHistoryList) return

    // Calculate statistics
    const totalMatches = matches.length
    const matchesWon = matches.filter(match => match.winner === currentUsername).length
    const winPercentage = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0

    // Update statistics display
    if (totalMatchesEl) totalMatchesEl.textContent = totalMatches.toString()
    if (matchesWonEl) matchesWonEl.textContent = matchesWon.toString()
    if (winPercentageEl) winPercentageEl.textContent = `${winPercentage}%`

    // Clear existing match entries and populate with real data
    matchHistoryList.innerHTML = ''
    
    matches.forEach(match => {
      const matchRow = this.createMatchRow(match, currentUsername)
      matchHistoryList.appendChild(matchRow)
    })
  }

  private createMatchRow(match: any, currentUsername: string): HTMLElement {
    const matchRow = document.createElement('div')
    matchRow.className = 'grid grid-cols-1 md:grid-cols-5 gap-4 p-3 border-2 border-gray-300 rounded-none hover:bg-gray-50'
    
    // Determine opponent name
    const opponent = match.player1 === currentUsername ? match.player2 : match.player1
    
    // Determine if current user won
    const isWinner = match.winner === currentUsername
    const userScore = match.player1 === currentUsername ? match.player1Score : match.player2Score
    const opponentScore = match.player1 === currentUsername ? match.player2Score : match.player1Score
    
    // Create date column
    const dateCol = document.createElement('div')
    dateCol.className = 'text-content'
    const dateLabel = document.createElement('span')
    dateLabel.className = 'md:hidden font-bold'
    dateLabel.textContent = 'Date: '
    dateCol.appendChild(dateLabel)
    dateCol.appendChild(document.createTextNode(match.playedAt))
    
    // Create opponent column
    const opponentCol = document.createElement('div')
    opponentCol.className = 'text-content'
    const opponentLabel = document.createElement('span')
    opponentLabel.className = 'md:hidden font-bold'
    opponentLabel.textContent = 'Opponent: '
    opponentCol.appendChild(opponentLabel)
    opponentCol.appendChild(document.createTextNode(opponent))
    
    // Create score column
    const scoreCol = document.createElement('div')
    scoreCol.className = 'text-content'
    const scoreLabel = document.createElement('span')
    scoreLabel.className = 'md:hidden font-bold'
    scoreLabel.textContent = 'Score: '
    scoreCol.appendChild(scoreLabel)
    scoreCol.appendChild(document.createTextNode(`${userScore}-${opponentScore}`))
    
    // Create result column
    const resultCol = document.createElement('div')
    resultCol.className = `${isWinner ? 'text-green-600' : 'text-red-600'} font-mono text-sm font-bold`
    const resultLabel = document.createElement('span')
    resultLabel.className = 'md:hidden text-black font-bold'
    resultLabel.textContent = 'Result: '
    resultCol.appendChild(resultLabel)
    resultCol.appendChild(document.createTextNode(isWinner ? 'WIN' : 'LOSS'))
    
    // Append all columns to the row
    matchRow.appendChild(dateCol)
    matchRow.appendChild(opponentCol)
    matchRow.appendChild(scoreCol)
    matchRow.appendChild(resultCol)
    
    return matchRow
  }

  private showNoMatchesMessage(): void {
    const matchHistoryList = this.element?.querySelector('#matchHistoryList')
    if (matchHistoryList) {
      // Clear existing content
      matchHistoryList.innerHTML = ''
      
      // Create no matches message
      const messageDiv = document.createElement('div')
      messageDiv.className = 'text-center text-gray-500 font-mono p-8'
      messageDiv.textContent = 'No matches found. Play some games to see your match history!'
      matchHistoryList.appendChild(messageDiv)
    }
    
    // Reset statistics to 0
    const totalMatchesEl = this.element?.querySelector('#totalMatches')
    const matchesWonEl = this.element?.querySelector('#matchesWon')
    const winPercentageEl = this.element?.querySelector('#winPercentage')
    
    if (totalMatchesEl) totalMatchesEl.textContent = '0'
    if (matchesWonEl) matchesWonEl.textContent = '0'
    if (winPercentageEl) winPercentageEl.textContent = '0%'
  }

  private showErrorMessage(): void {
    const matchHistoryList = this.element?.querySelector('#matchHistoryList')
    if (matchHistoryList) {
      // Clear existing content
      matchHistoryList.innerHTML = ''
      
      // Create error message
      const errorDiv = document.createElement('div')
      errorDiv.className = 'text-center text-red-500 font-mono p-8'
      errorDiv.textContent = 'Failed to load match history. Please try again later.'
      matchHistoryList.appendChild(errorDiv)
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}