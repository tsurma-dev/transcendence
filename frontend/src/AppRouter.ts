import { Component } from './Component'
import { ApiService } from './ApiService'

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
    this.setupHistoryListener()
  }

  static getInstance(): AppRouter {
    if (!AppRouter.instance) {
      AppRouter.instance = new AppRouter()
    }
    return AppRouter.instance
  }

  // This method will be called after screen classes are loaded
  setupRoutes(screenClasses: {
    StartPageScreen: new(...args: any[]) => Component,
    LoginScreen: new(...args: any[]) => Component,
    RegisterScreen: new(...args: any[]) => Component,
    LoggedInLandingScreen: new(...args: any[]) => Component,
    UserProfileScreen: new(...args: any[]) => Component,
    UserSettingsScreen: new(...args: any[]) => Component,
    MatchHistoryScreen: new(...args: any[]) => Component,
    QuickPlaySetupScreen: new(...args: any[]) => Component,
    PlayerSetupScreen: new(...args: any[]) => Component,
    TournamentLobbyScreen: new(...args: any[]) => Component,
    GameScreen: new(...args: any[]) => Component,
    LoggedOutScreen: new(...args: any[]) => Component,
    AuthErrorScreen: new(...args: any[]) => Component
  }): void {
    // Define URL routes mapping to components
    this.routes.set('/', { component: screenClasses.StartPageScreen })
    this.routes.set('/start', { component: screenClasses.StartPageScreen })
    this.routes.set('/login', { component: screenClasses.LoginScreen })
    this.routes.set('/register', { component: screenClasses.RegisterScreen })
    this.routes.set('/landing', { component: screenClasses.LoggedInLandingScreen })
    this.routes.set('/profile', { component: screenClasses.UserProfileScreen })
    this.routes.set('/settings', { component: screenClasses.UserSettingsScreen })
    this.routes.set('/match-history', { component: screenClasses.MatchHistoryScreen })
    this.routes.set('/quick-play', { component: screenClasses.QuickPlaySetupScreen })
    this.routes.set('/player-setup', { component: screenClasses.PlayerSetupScreen })
    this.routes.set('/tournament-lobby', { component: screenClasses.TournamentLobbyScreen })
    this.routes.set('/game', { component: screenClasses.GameScreen })
    this.routes.set('/logged-out', { component: screenClasses.LoggedOutScreen })
    this.routes.set('/auth-error', { component: screenClasses.AuthErrorScreen })
  }

  private setupHistoryListener(): void {
    // Listen for browser back/forward button events
    window.addEventListener('popstate', (event) => {
      if (!this.isNavigating) {
        this.handlePopState(event)
      }
    })
  }

  private handlePopState(event: PopStateEvent): void {
    const path = window.location.pathname
    const search = window.location.search
    const state = event.state

    console.log('PopState event:', { path, search, state })

    // Handle navigation based on current URL
    const routeInfo = this.routes.get(path)
    if (routeInfo) {
      // Parse URL parameters and use them as component arguments
      const args = this.parseArgumentsFromUrl(path, search, state)
      // Check authentication for protected routes
      this.renderComponentWithAuthCheck(routeInfo.component, ...args)
    } else {
      // Fallback to start page for unknown routes - need to get it dynamically
      const startRoute = this.routes.get('/start')
      if (startRoute) {
        this.renderComponent(startRoute.component)
      }
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

      case '/game':
        const player1 = urlParams.get('p1') ? decodeURIComponent(urlParams.get('p1')!) : 'Player 1'
        const player2 = urlParams.get('p2') ? decodeURIComponent(urlParams.get('p2')!) : 'Player 2'
        const isQuickPlay = urlParams.get('mode') === 'quick'
        return [player1, player2, isQuickPlay]

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
          const authErrorRoute = this.routes.get('/auth-error')
          if (authErrorRoute) {
            this.renderComponent(authErrorRoute.component)
          }
          return
        }
      } catch (error) {
        // Authentication check failed, render auth error page
        console.error('Authentication check failed:', error)
        const authErrorRoute = this.routes.get('/auth-error')
        if (authErrorRoute) {
          this.renderComponent(authErrorRoute.component)
        }
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
      case 'PlayerSetupScreen':
        return '/player-setup'
      case 'TournamentLobbyScreen':
        return '/tournament-lobby'
      case 'GameScreen':
        // Handle game parameters: player1Name, player2Name, isQuickPlay
        const player1 = args[0] ? encodeURIComponent(args[0]) : 'Player1'
        const player2 = args[1] ? encodeURIComponent(args[1]) : 'Player2'
        const isQuickPlay = args[2] ? 'quick' : 'regular'
        return `/game?p1=${player1}&p2=${player2}&mode=${isQuickPlay}`
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
  handleInitialRoute(): void {
    const path = window.location.pathname
    const search = window.location.search
    const routeInfo = this.routes.get(path)

    if (routeInfo) {
      const args = this.parseArgumentsFromUrl(path, search, null)
      this.renderComponentWithAuthCheck(routeInfo.component, ...args)
    } else {
      // Default to start page and update URL
      window.history.replaceState({ componentName: 'StartPageScreen' }, '', '/start')
      const startRoute = this.routes.get('/start')
      if (startRoute) {
        this.renderComponent(startRoute.component)
      }
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
      'UserProfileScreen',
      'UserSettingsScreen',
      'MatchHistoryScreen',
      'PlayerSetupScreen',
      'TournamentLobbyScreen'
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
          const authErrorRoute = this.routes.get('/auth-error')
          if (authErrorRoute) {
            this.navigateTo(authErrorRoute.component)
          }
          return
        }
      } catch (error) {
        // Authentication check failed, redirect to auth error page
        console.error('Authentication check failed:', error)
        const authErrorRoute = this.routes.get('/auth-error')
        if (authErrorRoute) {
          this.navigateTo(authErrorRoute.component)
        }
        return
      }
    }

    // User is authenticated or route doesn't require auth, proceed with navigation
    this.navigateTo(componentClass, ...args)
  }
}