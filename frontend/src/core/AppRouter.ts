import { Component } from './Component';
import { ApiService } from './ApiService';
import { GameMode } from '../components/Game3D';
import { 
  StartPageScreen, 
  QuickPlaySetupScreen, 
  LoginScreen, 
  RegisterScreen, 
  LoggedOutScreen, 
  AuthErrorScreen, 
  LoggedInLandingScreen, 
  RemoteGameLobbyScreen,
  ServerGameScreen,
  TournamentLobbyScreen, 
  QuickPlayScreen, 
  UserProfileScreen, 
  UserSettingsScreen, 
  MatchHistoryScreen,
  JoinRoomInputScreen
} from '../screens';

/**
 * App Router for screen navigation with browser history support
 */
export class AppRouter {
  private static instance: AppRouter
  private currentComponent: Component | null = null
  private appContainer: HTMLElement
  // Map to hold routes and their corresponding components, to enable browser history navigation
  private routes: Map<string, { component: new(...args: any[]) => Component, args?: any[] }> = new Map()
  private isNavigating: boolean = false

  constructor() {
    this.appContainer = document.getElementById('app')!
    this.setupRoutes()
    this.setupHistoryListener()
  }

  static getInstance(): AppRouter {
    if (!AppRouter.instance) {
      AppRouter.instance = new AppRouter()
    }
    return AppRouter.instance
  }

  getCurrentComponent(): Component | null {
    return this.currentComponent
  }

  isCurrentScreen(componentClass: new(...args: any[]) => Component): boolean {
    return this.currentComponent instanceof componentClass
  }

  private setupRoutes(): void {
    // Define URL routes mapping to components
    this.routes.set('/', { component: StartPageScreen })
    this.routes.set('/start', { component: StartPageScreen })
    this.routes.set('/login', { component: LoginScreen })
    this.routes.set('/register', { component: RegisterScreen })
    this.routes.set('/landing', { component: LoggedInLandingScreen })
    this.routes.set('/remote-game', { component: RemoteGameLobbyScreen })
    this.routes.set('/join', { component: JoinRoomInputScreen })
    this.routes.set('/profile', { component: UserProfileScreen })
    this.routes.set('/settings', { component: UserSettingsScreen })
    this.routes.set('/match-history', { component: MatchHistoryScreen })
    this.routes.set('/quick-play', { component: QuickPlaySetupScreen })
    this.routes.set('/tournament-lobby', { component: TournamentLobbyScreen })
    this.routes.set('/game/local', { component: QuickPlayScreen })
    this.routes.set('/game/ai', { component: ServerGameScreen })
    this.routes.set('/game/tournament', { component: ServerGameScreen })
    this.routes.set('/game/create-room', { component: ServerGameScreen })
    this.routes.set('/game/join-room', { component: ServerGameScreen })
    this.routes.set('/logged-out', { component: LoggedOutScreen })
    this.routes.set('/auth-error', { component: AuthErrorScreen })
  }

  private setupHistoryListener(): void {
    // Listen for browser back/forward button events
    window.addEventListener('popstate', (event) => {
      if (!this.isNavigating) {
        this.handlePopState(event)
      }
    })
  }

  private async handlePopState(event: PopStateEvent): Promise<void> {
    const path = window.location.pathname
    const search = window.location.search
    const state = event.state

    console.log('PopState event:', { path, search, state })

    // Redirect logged-in users from /start to /landing
    if (path === '/start' || path === '/') {
      const apiService = new ApiService()
      try {
        const user = await apiService.getCurrentUser()
        if (user && user.username) {
          // User is logged in, redirect to landing
          window.history.replaceState({ componentName: 'LoggedInLandingScreen' }, '', '/landing')
          this.renderComponent(LoggedInLandingScreen)
          return
        }
      } catch (error) {
        // User not logged in, continue to start page
      }
    }

    // Handle navigation based on current URL
    const routeInfo = this.routes.get(path)
    if (routeInfo) {
      // Parse URL parameters and use them as component arguments
      const args = this.parseArgumentsFromUrl(path, search, state)
      // Check authentication for protected routes
      this.renderComponentWithAuthCheck(routeInfo.component, ...args)
    } else {
      // Fallback to start page for unknown routes
      this.renderComponent(StartPageScreen)
    }
  }

  private parseArgumentsFromUrl(path: string, search: string, state: any): any[] {
    const urlParams = new URLSearchParams(search)

    // Use stored state if available, otherwise parse from URL
    if (state?.args) {
      return state.args
    }

    // Parse arguments based on the route
    switch (path) {
      case '/profile':
        const profileUsername = urlParams.get('user') ? decodeURIComponent(urlParams.get('user')!) : undefined
        return profileUsername ? [profileUsername] : []

      case '/match-history':
        const historyUsername = urlParams.get('user') ? decodeURIComponent(urlParams.get('user')!) : undefined
        return historyUsername ? [historyUsername] : []

      case '/join':
        return [] // JoinRoomInputScreen takes no parameters

      case '/game/local':
        const localPlayer1 = urlParams.get('p1') ? decodeURIComponent(urlParams.get('p1')!) : 'Player 1'
        const localPlayer2 = urlParams.get('p2') ? decodeURIComponent(urlParams.get('p2')!) : 'Player 2'
        return [localPlayer1, localPlayer2, 'local']

      case '/game/ai':
        const aiPlayer1 = urlParams.get('p1') ? decodeURIComponent(urlParams.get('p1')!) : 'Player 1'
        return [aiPlayer1, 'AI', 'AI']

      case '/game/create-room':
        const createRoomPlayer = urlParams.get('p1') ? decodeURIComponent(urlParams.get('p1')!) : 'Player 1'
        return [createRoomPlayer, '', 'createRoom']

      case '/game/join-room':
        const joinRoomPlayer = urlParams.get('p1') ? decodeURIComponent(urlParams.get('p1')!) : 'Player 1'
        const roomId = urlParams.get('roomId') ? decodeURIComponent(urlParams.get('roomId')!) : ''
        return [joinRoomPlayer, roomId, 'joinRoom']

      case '/logged-out':
        const username = urlParams.get('user') ? decodeURIComponent(urlParams.get('user')!) : 'User'
        return [username]

      default:
        return []
    }
  }

  navigateTo(componentClass: new(...args: any[]) => Component, ...args: any[]): void {
    this.isNavigating = true

    // Determine the URL path for this component
    const path = this.getPathForComponent(componentClass, ...args)

    // Update browser history
    const state = {
      componentName: componentClass.name,
      args: args.length > 0 ? args : undefined
    }

    // Push new state to history
    window.history.pushState(state, '', path)

    // Render the component
    this.renderComponent(componentClass, ...args)

    this.isNavigating = false
  }

  private renderComponent(componentClass: new(...args: any[]) => Component, ...args: any[]): void {
    if (this.currentComponent) {
      this.currentComponent.unmount()
    }

    this.currentComponent = new componentClass(...args)
    this.currentComponent.mount(this.appContainer)
  }

  // Method to render component with authentication check for protected routes
  private async renderComponentWithAuthCheck(componentClass: new(...args: any[]) => Component, ...args: any[]): Promise<void> {
    if (this.requiresAuthentication(componentClass)) {
      // Check if user is authenticated
      const apiService = new ApiService()
      try {
        const user = await apiService.getCurrentUser()
        if (!user || !user.username) {
          // User not authenticated, render auth error page
          this.renderComponent(AuthErrorScreen)
          return
        }
      } catch (error) {
        // Authentication check failed, render auth error page
        console.error('Authentication check failed:', error)
        this.renderComponent(AuthErrorScreen)
        return
      }
    }

    // User is authenticated or route doesn't require auth, proceed with rendering
    this.renderComponent(componentClass, ...args)
  }

  private getPathForComponent(componentClass: new(...args: any[]) => Component, ...args: any[]): string {
    // Map component classes to URL paths
    switch (componentClass.name) {
      case 'StartPageScreen':
        return '/start'
      case 'LoginScreen':
        return '/login'
      case 'RegisterScreen':
        return '/register'
      case 'LoggedInLandingScreen':
        return '/landing'
      case 'RemoteGameLobbyScreen':
        return '/remote-game'
      case 'JoinRoomInputScreen':
        return '/join'
      case 'UserProfileScreen':
        // Handle username parameter for viewing other users' profiles
        const profileUser = args[0] ? encodeURIComponent(args[0]) : undefined
        return profileUser ? `/profile?user=${profileUser}` : '/profile'
      case 'UserSettingsScreen':
        return '/settings'
      case 'MatchHistoryScreen':
        // Handle username parameter for viewing specific user's match history
        const historyUser = args[0] ? encodeURIComponent(args[0]) : undefined
        return historyUser ? `/match-history?user=${historyUser}` : '/match-history'
      case 'QuickPlaySetupScreen':
        return '/quick-play'
      case 'TournamentLobbyScreen':
        return '/tournament-lobby'
      case 'QuickPlayScreen':
        // Handle local game parameters: player1Name, player2Name
        const player1 = args[0] ? encodeURIComponent(args[0]) : 'Player1'
        const player2 = args[1] ? encodeURIComponent(args[1]) : 'Player2'
        // QuickPlayScreen is only for local games
        return `/game/local?p1=${player1}&p2=${player2}`
      case 'ServerGameScreen':
        // Handle server game parameters: player1Name, player2Name, gameMode, roomId?
        const serverPlayer1 = args[0] ? encodeURIComponent(args[0]) : 'Player1'
        const serverPlayer2 = args[1] ? encodeURIComponent(args[1]) : 'Player2'
        const serverGameMode: GameMode = args[2] || 'AI'
        const serverRoomId = args[3] ? encodeURIComponent(args[3]) : ''
        
        // Generate URL based on server game mode
        switch (serverGameMode) {
          case 'AI':
            return `/game/ai?p1=${serverPlayer1}`
          case 'createRoom':
            return `/game/create-room?p1=${serverPlayer1}`
          case 'joinRoom':
            return `/game/join-room?p1=${serverPlayer1}${serverRoomId ? `&roomId=${serverRoomId}` : ''}`
          case 'tournament':
            return `/game/tournament?p1=${serverPlayer1}`
          default:
            return `/game/ai?p1=${serverPlayer1}`
        }
      case 'LoggedOutScreen':
        // Handle username parameter
        const username = args[0] ? encodeURIComponent(args[0]) : 'User'
        return `/logged-out?user=${username}`
      case 'AuthErrorScreen':
        return '/auth-error'
      default:
        return '/start'
    }
  }

  // Method to handle initial page load routing
  async handleInitialRoute(): Promise<void> {
    const path = window.location.pathname
    const search = window.location.search
    
    // Redirect logged-in users from /start to /landing
    if (path === '/start' || path === '/') {
      const apiService = new ApiService()
      try {
        const user = await apiService.getCurrentUser()
        if (user && user.username) {
          // User is logged in, redirect to landing
          window.history.replaceState({ componentName: 'LoggedInLandingScreen' }, '', '/landing')
          this.renderComponent(LoggedInLandingScreen)
          return
        }
      } catch (error) {
        // User not logged in, continue to start page
      }
    }
    
    const routeInfo = this.routes.get(path)

    if (routeInfo) {
      const args = this.parseArgumentsFromUrl(path, search, null)
      this.renderComponentWithAuthCheck(routeInfo.component, ...args)
    } else {
      // Default to start page and update URL
      window.history.replaceState({ componentName: 'StartPageScreen' }, '', '/start')
      this.renderComponent(StartPageScreen)
    }
  }

  // Method to get current route info (useful for debugging or state management)
  getCurrentRoute(): { path: string, component: string | null, args: any[] } {
    const path = window.location.pathname
    const search = window.location.search
    const routeInfo = this.routes.get(path)

    return {
      path: path,
      component: routeInfo ? routeInfo.component.name : null,
      args: this.parseArgumentsFromUrl(path, search, null)
    }
  }

  // Method to check if a route requires authentication
  private requiresAuthentication(componentClass: new(...args: any[]) => Component): boolean {
    const protectedRoutes = [
      'LoggedInLandingScreen',
      'RemoteGameLobbyScreen',
      'UserProfileScreen',
      'UserSettingsScreen',
      'MatchHistoryScreen',
      'TournamentLobbyScreen',
      'QuickPlayScreen',
      'ServerGameScreen'
    ]

    return protectedRoutes.includes(componentClass.name)
  }

  // Method to check authentication and redirect to auth error if needed
  async navigateToProtected(componentClass: new(...args: any[]) => Component, ...args: any[]): Promise<void> {
    if (this.requiresAuthentication(componentClass)) {
      // Check if user is authenticated
      const apiService = new ApiService()
      try {
        const user = await apiService.getCurrentUser()
        if (!user || !user.username) {
          // User not authenticated, redirect to auth error page
          this.navigateTo(AuthErrorScreen)
          return
        }
      } catch (error) {
        // Authentication check failed, redirect to auth error page
        console.error('Authentication check failed:', error)
        this.navigateTo(AuthErrorScreen)
        return
      }
    }

    // User is authenticated or route doesn't require auth, proceed with navigation
    this.navigateTo(componentClass, ...args)
  }
}