/**
* =================================
* FILE STRUCTURE AND EXECUTION FLOW
* =================================
*
* This file is located in the `src` directory of the frontend. This is where you can make
* changes to the Typescript used in the application.
*
* The file is structured to support a scalable Single Page Application (SPA) architecture
* and follows the common Js/Ts module pattern where:
*
* - Imports at to the top of the file
* - Classes and functions in the middle
* - Initialization/execution code at the bottom
*
* "What" (class definitions, function declarations etc.)is separated from "How" (execution logic).
* When the browser loads the script, it needs all classes and functions to be defined before it
* can execute the initialization code.
*
* Current file structure:
* 1. ApiService: Handles backend communication
* 2. Component: Base abstract class for all components
* 3. TemplateManager: Infrastructure singleton, manages HTML templates
* 4. AppRouter: Infrastructure singleton, manages navigation between screens
* 5. PongGame: Game logic and rendering (placeholder for now)
* 6. Screen Components: UI components - Individual screens for the app (StartPage, QuickPlaySetup, Login, Register, PlayerSetup, GameScreen etc)
* 7. App: Main application class that initializes everything and manages the global state
* 8. Initialization code: Sets up the app when the DOM (Document Object Model) is ready
*
* When running the application, this file is transpiled to JavaScript and bundled with other files in
* the dist directory. The output file is then linked in the index.html file.
*
* Do not edit index.js in the dist directory directly, as it is a generated file.
*/

import './index.css'
import { Game3DComponent, GameMode } from './components/Game3D'
import { Component, TemplateManager, AppRouter, App, ApiService } from './core'
import {
  StartPageScreen,
  QuickPlaySetupScreen,
  LoginScreen,
  RegisterScreen,
  LoggedOutScreen,
  AuthErrorScreen,
  LoggedInLandingScreen,
  TournamentLobbyScreen,

  GameScreen,
  UserProfileScreen,
  UserSettingsScreen,
  MatchHistoryScreen
} from './screens'

// =================================
// LEGACY CODE REMOVED
// =================================
// All screen components have been moved to separate files in /screens directory
// and are now imported at the top of this file.
// 
// The PongGame class has also been removed as it's been replaced by the 3D game component.

// ============================
// APPLICATION INITIALIZATION
// ============================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = App.getInstance()
  app.init()
})