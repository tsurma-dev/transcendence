import { Component, TemplateManager, AppRouter } from '../core'
import { LoggedInLandingScreen } from './LoggedInLandingScreen'

/**
 * Remote Game Screen
 * This screen displays options for remote multiplayer games:
 * - Create Room: Create a private room for another player to join
 * - Join Room: Join an existing room using a room ID
 */
export class RemoteGameScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('remoteGameTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)
    }
    return div
  }

  setupEvents(): void {
    const createRoomBtn = this.element?.querySelector('#createRoomBtn') as HTMLButtonElement
    const joinRoomBtn = this.element?.querySelector('#joinRoomBtn') as HTMLButtonElement
    const getMatchedBtn = this.element?.querySelector('#getMatchedBtn') as HTMLButtonElement
    const backToLandingBtn = this.element?.querySelector('#backToLandingBtn') as HTMLButtonElement

    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', () => {
        // TODO: Implement create room navigation, new instance of GameMode
        console.log('Creating room - new instance of GameMode (not implemented yet)')
      })
    }

    if (joinRoomBtn) {
      joinRoomBtn.addEventListener('click', () => {
        // TODO: Implement join room navigation, new instance of GameMode
        console.log('Joining room - new instance of GameMode (not implemented yet)')
      })
    }

    if (backToLandingBtn) {
      backToLandingBtn.addEventListener('click', () => {
        console.log('Navigating back to Logged In Landing screen')
        this.router.navigateTo(LoggedInLandingScreen)
      })
    }
  }

  cleanup(): void {
    // Clean up any event listeners or resources if needed
    // This implementation doesn't require specific cleanup
  }
}