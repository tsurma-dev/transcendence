import { Component, TemplateManager, AppRouter } from '../core'
import { RemoteGameScreen } from './RemoteGameScreen'

/**
 * Join Room Screen
 * This screen allows users to join an existing room by entering a room ID.
 * It renders the joinRoomTemplate and handles form submission and navigation.
 */
export class JoinRoomScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('joinRoomTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const joinRoomForm = this.element?.querySelector('#joinRoomForm') as HTMLFormElement
    const roomIdInput = this.element?.querySelector('#roomIdInput') as HTMLInputElement
    const joinRoomSubmitBtn = this.element?.querySelector('#joinRoomSubmitBtn') as HTMLButtonElement
    const backToRemoteOptionsBtn = this.element?.querySelector('#backToRemoteOptionsBtn') as HTMLButtonElement
    const joinRoomError = this.element?.querySelector('#joinRoomError') as HTMLElement
    const joinRoomStatus = this.element?.querySelector('#joinRoomStatus') as HTMLElement

    // Handle form submission
    if (joinRoomForm) {
      joinRoomForm.addEventListener('submit', (e) => {
        e.preventDefault()
        this.handleJoinRoom()
      })
    }

    // Handle back to remote options button
    if (backToRemoteOptionsBtn) {
      backToRemoteOptionsBtn.addEventListener('click', () => {
        console.log('Navigating back to Remote Game options')
        this.router.navigateTo(RemoteGameScreen)
      })
    }

    // Auto-format room ID input (uppercase)
    if (roomIdInput) {
      roomIdInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        target.value = target.value.toUpperCase()
      })
    }
  }

  private async handleJoinRoom(): Promise<void> {
    const roomIdInput = this.element?.querySelector('#roomIdInput') as HTMLInputElement
    const joinRoomError = this.element?.querySelector('#joinRoomError') as HTMLElement
    const joinRoomStatus = this.element?.querySelector('#joinRoomStatus') as HTMLElement
    const joinRoomSubmitBtn = this.element?.querySelector('#joinRoomSubmitBtn') as HTMLButtonElement

    if (!roomIdInput || !joinRoomError || !joinRoomStatus || !joinRoomSubmitBtn) {
      console.error('Required elements not found')
      return
    }

    const roomId = roomIdInput.value.trim()

    // Clear previous messages
    joinRoomError.classList.add('hidden')
    joinRoomStatus.classList.add('hidden')

    // Validate room ID
    if (!roomId) {
      this.showError('Please enter a room ID')
      return
    }

    // Disable submit button and show loading state
    joinRoomSubmitBtn.disabled = true
    joinRoomSubmitBtn.textContent = 'Joining...'

    try {
      // Show status message
      this.showStatus('Connecting to room...')

      // TODO: Implement actual room joining logic with API call
      console.log('Attempting to join room:', roomId)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Replace this simulation with actual API logic
      // For now, simulate success or failure
      const simulateSuccess = Math.random() > 0.3 // 70% success rate for testing
      
      if (simulateSuccess) {
        this.showStatus('Room found! Joining...')
        
        // Simulate additional loading
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // TODO: Navigate to game screen or waiting room
        console.log('Successfully joined room:', roomId)
        this.showStatus('Successfully joined room! Starting game...')
        
        // TODO: Navigate to actual game screen when implemented
        // this.router.navigateTo(GameScreen, roomId, 'remote')
        
      } else {
        throw new Error('Room not found or is full')
      }
      
    } catch (error) {
      console.error('Error joining room:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room. Please try again.'
      this.showError(errorMessage)
    } finally {
      // Re-enable submit button
      joinRoomSubmitBtn.disabled = false
      joinRoomSubmitBtn.textContent = '🚪 Join Room'
    }
  }

  private showError(message: string): void {
    const joinRoomError = this.element?.querySelector('#joinRoomError') as HTMLElement
    const joinRoomStatus = this.element?.querySelector('#joinRoomStatus') as HTMLElement
    
    if (joinRoomError) {
      joinRoomError.textContent = message
      joinRoomError.classList.remove('hidden')
    }
    
    if (joinRoomStatus) {
      joinRoomStatus.classList.add('hidden')
    }
  }

  private showStatus(message: string): void {
    const joinRoomError = this.element?.querySelector('#joinRoomError') as HTMLElement
    const joinRoomStatus = this.element?.querySelector('#joinRoomStatus') as HTMLElement
    
    if (joinRoomStatus) {
      joinRoomStatus.textContent = message
      joinRoomStatus.classList.remove('hidden')
    }
    
    if (joinRoomError) {
      joinRoomError.classList.add('hidden')
    }
  }

  cleanup(): void {
    // Clean up any event listeners or resources if needed
    // This implementation doesn't require specific cleanup
  }
}