import { Component, TemplateManager, AppRouter } from '../core'
import { RemoteGameScreen } from './RemoteGameScreen'

/**
 * Create Room Screen
 * This screen displays the room creation interface with:
 * - Generated room ID display
 * - Copy room ID functionality
 * - Waiting for player status
 * - Leave room functionality
 */
export class CreateRoomScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private roomId: string = ''

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('createRoomTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    this.initializeRoomId()
    this.setupCopyRoomIdButton()
    this.setupCancelRoomButton()
  }

  cleanup(): void {
    // Clean up any room-related resources
    console.log('Cleaning up CreateRoomScreen')
  }

  /**
   * Initialize room ID (currently uses HTML template placeholder, will be fetched from backend later)
   */
  private initializeRoomId(): void {
    // Get the placeholder room ID from the HTML template
    const roomIdDisplay = this.element?.querySelector('#roomIdDisplay')
    if (roomIdDisplay) {
      this.roomId = roomIdDisplay.textContent?.trim() || 'ABC123'
    }

    console.log('Using room ID from template:', this.roomId)
    // TODO: Replace with actual room ID retrieved via websocket
  }

  /**
   * Set up the copy room ID button functionality
   */
  private setupCopyRoomIdButton(): void {
    const copyRoomIdBtn = this.element?.querySelector('#copyRoomIdBtn') as HTMLButtonElement
    
    if (copyRoomIdBtn) {
      copyRoomIdBtn.addEventListener('click', () => {
        this.copyRoomIdToClipboard()
      })
    }
  }

  /**
   * Set up the cancel/leave room button functionality
   */
  private setupCancelRoomButton(): void {
    const cancelRoomBtn = this.element?.querySelector('#cancelRoomBtn') as HTMLButtonElement
    
    if (cancelRoomBtn) {
      cancelRoomBtn.addEventListener('click', () => {
        this.leaveRoom()
      })
    }
  }

  /**
   * Copy the room ID to clipboard
   */
  private async copyRoomIdToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.roomId)
      this.showCopySuccessMessage()
    } catch (err) {
      console.error('Failed to copy room ID to clipboard:', err)
      this.showCopyErrorMessage()
    }
  }

  /**
   * Show success message after copying room ID
   */
  private showCopySuccessMessage(): void {
    const copyBtn = this.element?.querySelector('#copyRoomIdBtn') as HTMLButtonElement
    if (copyBtn) {
      const originalText = copyBtn.textContent
      copyBtn.textContent = '✓ Copied!'
      copyBtn.style.backgroundColor = '#10B981' // green
      
      setTimeout(() => {
        copyBtn.textContent = originalText
        copyBtn.style.backgroundColor = '' // reset to original
      }, 2000)
    }
  }

  /**
   * Show error message if copying fails
   */
  private showCopyErrorMessage(): void {
    const copyBtn = this.element?.querySelector('#copyRoomIdBtn') as HTMLButtonElement
    if (copyBtn) {
      const originalText = copyBtn.textContent
      copyBtn.textContent = '❌ Copy Failed'
      copyBtn.style.backgroundColor = '#EF4444' // red
      
      setTimeout(() => {
        copyBtn.textContent = originalText
        copyBtn.style.backgroundColor = '' // reset to original
      }, 2000)
    }
  }

  /**
   * Leave the room and navigate back to remote game options
   */
  private leaveRoom(): void {
    console.log('Leaving room:', this.roomId)
    
    // TODO: In a real implementation, this would:
    // 1. Send a request to the backend to close/leave the room
    // 2. Clean up any WebSocket connections
    // 3. Notify other players
    
    // Navigate back to remote game options
    this.router.navigateTo(RemoteGameScreen)
  }

  /**
   * Simulate a player joining the room
   * This would be called by WebSocket events in a real implementation
   */
  public onPlayerJoined(playerName: string): void {
    console.log('Player joined room:', playerName)
    
    // TODO: In a real implementation, this would:
    // 1. Update the UI to show the joined player
    // 2. Start the game initialization
    // 3. Navigate to the game screen
    
    // For now, just log the event
    const waitingSection = this.element?.querySelector('.container-white:nth-of-type(2)')
    if (waitingSection) {
      waitingSection.innerHTML = `
        <div class="text-green-600 font-mono text-lg mb-2">✅</div>
        <div class="text-black font-mono text-lg font-bold">
          ${playerName} joined the room!
        </div>
        <div class="text-black font-mono text-sm mt-2">
          Starting game...
        </div>
      `
    }
  }
}