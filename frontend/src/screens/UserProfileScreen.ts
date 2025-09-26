import { Component, TemplateManager, AppRouter, ApiService } from '../core'
import { UserSettingsScreen } from './UserSettingsScreen'
import { MatchHistoryScreen } from './MatchHistoryScreen'
// ApiService imported from core

/**
 * User Profile Screen
 */
export class UserProfileScreen extends Component {
  private templateManager = TemplateManager.getInstance()
  private router = AppRouter.getInstance()
  private apiService = new ApiService()
  private user: {id: number, username: string, email: string, createdAt: string, twoFAEnabled?: boolean} | null = null
  private hasCustomAvatar: boolean = false
  private targetUsername?: string  // Username of the profile to view (undefined = current user)

  constructor(username?: string) {
    super()
    this.targetUsername = username
  }

  render(): HTMLElement {
    const fragment = this.templateManager.cloneTemplate('userProfileTemplate')
    const div = document.createElement('div')
    if (fragment) {
      div.appendChild(fragment)

      // Show user menu for authenticated users
      // App.getInstance().setUserLoggedIn(true)
    }
    return div
  }

  async setupEvents(): Promise<void> {
    const profileUsername = this.element?.querySelector('#profileUsername') as HTMLElement
    const profileEmail = this.element?.querySelector('#profileEmail') as HTMLElement
    const profileJoinedDate = this.element?.querySelector('#profileJoinedDate') as HTMLElement
    const profileLastLogin = this.element?.querySelector('#profileLastLogin') as HTMLElement
    const profileAvatar = this.element?.querySelector('#profileAvatar') as HTMLImageElement
    const avatarFileInput = this.element?.querySelector('#avatarFileInput') as HTMLInputElement
    const avatarUploadStatus = this.element?.querySelector('#avatarUploadStatus') as HTMLElement
    const avatarUploadProgress = this.element?.querySelector('#avatarUploadProgress') as HTMLProgressElement
    const avatarStatusMessage = this.element?.querySelector('#avatarStatusMessage') as HTMLElement
    const userSettingsBtn = this.element?.querySelector('#userSettingsBtn') as HTMLButtonElement
    const matchHistoryBtn = this.element?.querySelector('#matchHistoryBtn') as HTMLButtonElement

    // Avatar menu elements
    const avatarMenuBtn = this.element?.querySelector('#avatarMenuBtn') as HTMLButtonElement
    const avatarMenuDropdown = this.element?.querySelector('#avatarMenuDropdown') as HTMLElement
    const uploadAvatarBtn = this.element?.querySelector('#uploadAvatarBtn') as HTMLButtonElement
    const deleteAvatarBtn = this.element?.querySelector('#deleteAvatarBtn') as HTMLButtonElement

    // Load user data (either current user or target user)
    try {
      if (this.targetUsername) {
        // Load specific user's profile
        this.user = await this.apiService.getUserProfile(this.targetUsername)
      } else {
        // Load current user's profile
        this.user = await this.apiService.getCurrentUser()
      }

      if (this.user) {
        // Populate user information
        if (profileUsername) profileUsername.textContent = this.user.username
        if (profileEmail) profileEmail.textContent = this.user.email
        if (profileJoinedDate) profileJoinedDate.textContent = this.user.createdAt || 'Unknown'

        // Load user avatar and set up avatar state tracking
        if (profileAvatar && this.user.username) {
          await this.loadUserAvatar(profileAvatar, this.user.username)
        }
      } else {
        // Handle case where user is not found or not logged in
        const errorText = this.targetUsername ? `User "${this.targetUsername}" not found` : 'Not logged in'
        if (profileUsername) profileUsername.textContent = errorText
        if (profileEmail) profileEmail.textContent = 'N/A'
        if (profileJoinedDate) profileJoinedDate.textContent = 'N/A'
        if (profileLastLogin) profileLastLogin.textContent = 'N/A'
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Show error state
      const errorText = this.targetUsername ? `Error loading profile for ${this.targetUsername}` : 'Error loading profile'
      if (profileUsername) profileUsername.textContent = errorText
      if (profileEmail) profileEmail.textContent = 'Error'
      if (profileJoinedDate) profileJoinedDate.textContent = 'Error'
      if (profileLastLogin) profileLastLogin.textContent = 'Error'
    }

    // Hide avatar management and settings for other users' profiles
    const isViewingOtherUser = this.targetUsername !== undefined
    if (isViewingOtherUser) {
      // Hide avatar menu for other users
      if (avatarMenuBtn) avatarMenuBtn.style.display = 'none'

      // Hide settings button for other users (but keep match history visible)
      if (userSettingsBtn) userSettingsBtn.style.display = 'none'

      // Hide friends list for other users
      const friendsListContainer = this.element?.querySelector('#friendsListContainer') as HTMLElement
      if (friendsListContainer) friendsListContainer.style.display = 'none'

      // Hide avatar upload elements
      if (avatarFileInput) avatarFileInput.style.display = 'none'
      if (avatarUploadStatus) avatarUploadStatus.style.display = 'none'

      // Show friend action container and buttons for other users
      this.setupFriendButtons()
    } else {
      // Hide friend action container for own profile
      const friendActionContainer = this.element?.querySelector('#friendActionContainer') as HTMLElement
      if (friendActionContainer) {
        friendActionContainer.style.display = 'none'
      }

      // Setup friends list functionality for own profile
      this.setupFriendsList()
    }

    // Handle avatar menu toggle (only for current user)
    if (avatarMenuBtn && avatarMenuDropdown && !isViewingOtherUser) {
      avatarMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.toggleAvatarMenu()
      })

      // Close menu when clicking outside
      document.addEventListener('click', () => {
        this.closeAvatarMenu()
      })

      avatarMenuDropdown.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    // Handle upload avatar button (only for current user)
    if (uploadAvatarBtn && avatarFileInput && !isViewingOtherUser) {
      uploadAvatarBtn.addEventListener('click', () => {
        avatarFileInput.click()
        this.closeAvatarMenu()
      })
    }

    // Handle delete avatar button (only for current user)
    if (deleteAvatarBtn && !isViewingOtherUser) {
      deleteAvatarBtn.addEventListener('click', async () => {
        await this.handleAvatarDelete(profileAvatar, avatarUploadStatus, avatarStatusMessage)
        this.closeAvatarMenu()
      })
    }

    // Handle avatar upload (only for current user)
    if (avatarFileInput && !isViewingOtherUser) {
      avatarFileInput.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && this.user) {
          await this.handleAvatarUpload(file, profileAvatar, avatarUploadStatus, avatarUploadProgress, avatarStatusMessage)
        }
      })
    }

    this.updateOnlineStatus()

    // Handle user settings button click
    if (userSettingsBtn) {
      userSettingsBtn.addEventListener('click', () => {
        this.router.navigateTo(UserSettingsScreen)
      })
    }

    // Handle match history button click
    if (matchHistoryBtn) {
      matchHistoryBtn.addEventListener('click', () => {
        // Navigate to match history screen, passing the target username
        if (this.targetUsername) {
          // Pass the username of the profile being viewed
          this.router.navigateTo(MatchHistoryScreen, this.targetUsername)
        } else {
          // Current user's profile, no username parameter needed
          this.router.navigateTo(MatchHistoryScreen)
        }
      })
    }

  }

  private async updateOnlineStatus(): Promise<void> {
    const onlineStatusDot = this.element?.querySelector('#onlineStatusDot') as HTMLElement
    const onlineStatusText = this.element?.querySelector('#onlineStatusText') as HTMLElement

    if (!onlineStatusDot || !onlineStatusText) {
      console.error('Online status elements not found')
      return
    }

    try {
      const isViewingOtherUser = this.targetUsername !== undefined
      
      if (isViewingOtherUser && this.targetUsername) {
        // Check if the target user is online by getting the online users list
        const onlineUsers = await this.apiService.getOnlineUsersList()
        const isTargetUserOnline = onlineUsers.some(user => user.username === this.targetUsername)
        
        if (isTargetUserOnline) {
          // Target user is online
          onlineStatusDot.className = 'indicator-online'
          onlineStatusText.textContent = 'Online'
          onlineStatusText.className = 'text-green-600 font-mono text-sm font-bold'
        } else {
          // Target user is offline
          onlineStatusDot.className = 'indicator-offline'
          onlineStatusText.textContent = 'Offline'
          onlineStatusText.className = 'text-red-600 font-mono text-sm font-bold'
        }
      } else {
        // Check if current user is online (viewing own profile)
        const currentUser = await this.apiService.getCurrentUser()

        if (currentUser && currentUser.username) {
          // Current user is online (obviously, since they're logged in)
          onlineStatusDot.className = 'indicator-online'
          onlineStatusText.textContent = 'Online'
          onlineStatusText.className = 'text-green-600 font-mono text-sm font-bold'
        } else {
          // User is offline or not authenticated
          onlineStatusDot.className = 'indicator-offline'
          onlineStatusText.textContent = 'Offline'
          onlineStatusText.className = 'text-red-600 font-mono text-sm font-bold'
        }
      }
    } catch (error) {
      console.error('Error checking online status:', error)
      // Assume offline on error
      onlineStatusDot.className = 'w-3 h-3 rounded-full mr-2 bg-red-400'
      onlineStatusText.textContent = 'Offline'
      onlineStatusText.className = 'text-red-600 font-mono text-sm font-bold'
    }
  }

  private async loadUserAvatar(avatarImg: HTMLImageElement, username: string): Promise<void> {
    // Load the avatar from backend
    const avatarUrl = this.apiService.getAvatarUrl(username)

    console.log('Loading avatar for user:', username, 'URL:', avatarUrl)

    return new Promise((resolve) => {
      // Create a test image to load the avatar
      const testImg = new Image()

      testImg.onload = () => {
        console.log('Avatar loaded successfully')
        // Set the avatar image
        avatarImg.src = avatarUrl

        // Check localStorage for a flag that tracks custom avatar status
        const hasCustomAvatarFlag = localStorage.getItem(`hasCustomAvatar_${username}`)
        this.hasCustomAvatar = hasCustomAvatarFlag === 'true'
        this.updateDeleteButtonVisibility()

        console.log('Avatar loaded, custom avatar status:', this.hasCustomAvatar)
        resolve()
      }

      testImg.onerror = () => {
        console.log('Failed to load avatar, using default')
        // Avatar failed to load, keep default and assume no custom avatar
        this.hasCustomAvatar = false
        this.updateDeleteButtonVisibility()
        resolve()
      }

      // Load the avatar
      testImg.src = avatarUrl
    })
  }

  private updateDeleteButtonVisibility(): void {
    const deleteAvatarBtn = this.element?.querySelector('#deleteAvatarBtn') as HTMLElement
    if (deleteAvatarBtn) {
      if (this.hasCustomAvatar) {
        deleteAvatarBtn.style.display = 'block'
      } else {
        deleteAvatarBtn.style.display = 'none'
      }
    }
  }

  private setupFriendButtons(): void {
    if (!this.element) return

    const addFriendBtn = this.element.querySelector('#addFriendBtn') as HTMLElement
    const friendRequestSentBtn = this.element.querySelector('#friendRequestSentBtn') as HTMLElement
    const alreadyFriendsContainer = this.element.querySelector('#alreadyFriendsContainer') as HTMLElement
    const alreadyFriendsBtn = this.element.querySelector('#alreadyFriendsBtn') as HTMLElement
    const friendsActionDropdown = this.element.querySelector('#friendsActionDropdown') as HTMLElement
    const removeFriendBtn = this.element.querySelector('#removeFriendBtn') as HTMLElement
    const friendRequestActions = this.element.querySelector('#friendRequestActions') as HTMLElement
    const acceptFriendBtn = this.element.querySelector('#acceptFriendBtn') as HTMLElement
    const rejectFriendBtn = this.element.querySelector('#rejectFriendBtn') as HTMLElement
    const friendActionContainer = this.element.querySelector('#friendActionContainer') as HTMLElement

    // Show friend action container for other users
    if (friendActionContainer) {
      friendActionContainer.style.display = 'flex'
    }

    // Initially hide all buttons and containers
    if (addFriendBtn) addFriendBtn.style.display = 'none'
    if (friendRequestSentBtn) friendRequestSentBtn.style.display = 'none'
    if (alreadyFriendsContainer) alreadyFriendsContainer.style.display = 'none'
    if (friendRequestActions) friendRequestActions.style.display = 'none'

    // Check current friendship status and show appropriate button
    if (this.targetUsername) {
      this.apiService.checkFriendshipStatus(this.targetUsername).then(result => {
        if (result.success) {
          console.log('Friendship status:', result.status)
          switch (result.status) {
            case 'friends':
              if (alreadyFriendsContainer) alreadyFriendsContainer.style.display = 'block'
              break
            case 'request_sent':
              if (friendRequestSentBtn) friendRequestSentBtn.style.display = 'block'
              break
            case 'request_received':
              // Show Accept/Reject buttons when this user sent you a request
              if (friendRequestActions) friendRequestActions.style.display = 'flex'
              break
            case 'none':
            default:
              if (addFriendBtn) addFriendBtn.style.display = 'block'
              break
          }
        } else {
          console.error('Failed to check friendship status:', result.message)
          // Default to showing Add Friend button
          if (addFriendBtn) addFriendBtn.style.display = 'block'
        }
      })
    }

    // Handle Already Friends dropdown toggle
    if (alreadyFriendsBtn && friendsActionDropdown) {
      alreadyFriendsBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        friendsActionDropdown.classList.toggle('hidden')
      })

      // Close dropdown when clicking outside
      const documentClickHandler = (e: Event) => {
        if (!alreadyFriendsContainer?.contains(e.target as Node)) {
          friendsActionDropdown.classList.add('hidden')
        }
      }
      document.addEventListener('click', documentClickHandler)

      // Prevent dropdown from closing when clicking inside it
      friendsActionDropdown.addEventListener('click', (e) => {
        e.stopPropagation()
      })

      // Store the document click handler for cleanup
      ;(this.element as any).friendsDropdownDocumentHandler = documentClickHandler
    }

    // Handle Remove Friend button click
    if (removeFriendBtn) {
      removeFriendBtn.addEventListener('click', async () => {
        console.log('Remove friend clicked for:', this.targetUsername)

        if (this.targetUsername) {
          // Confirm the action
          const confirmRemove = confirm(`Are you sure you want to remove ${this.targetUsername} from your friends list?`)

          if (confirmRemove) {
            const result = await this.apiService.removeFriend(this.targetUsername)

            if (result.success) {
              console.log('Friend removed successfully:', result.message)

              // Hide Already Friends container and show Add Friend button
              if (alreadyFriendsContainer) alreadyFriendsContainer.style.display = 'none'
              if (addFriendBtn) addFriendBtn.style.display = 'block'

              // Show success message
              alert(result.message || 'Friend removed successfully!')
            } else {
              console.error('Failed to remove friend:', result.message)
              alert(result.message || 'Failed to remove friend')
            }
          }
        }

        // Close the dropdown after action
        if (friendsActionDropdown) {
          friendsActionDropdown.classList.add('hidden')
        }
      })
    }

    // Handle Add Friend button click
    if (addFriendBtn) {
      addFriendBtn.addEventListener('click', async () => {
        console.log('Add friend clicked for:', this.targetUsername)

        if (this.targetUsername) {
          // Send the friend request
          const result = await this.apiService.sendFriendRequest(this.targetUsername)

          if (result.success) {
            console.log('Friend request sent successfully:', result.message)

            // Hide Add Friend button and show Request Sent button
            addFriendBtn.style.display = 'none'
            if (friendRequestSentBtn) {
              friendRequestSentBtn.style.display = 'block'
            }
          } else {
            console.error('Failed to send friend request:', result.message)
            alert(result.message || 'Failed to send friend request')
          }
        }
      })
    }

    // Handle Accept Friend Request button click
    if (acceptFriendBtn) {
      acceptFriendBtn.addEventListener('click', async () => {
        console.log('Accept friend request clicked for:', this.targetUsername)

        if (this.targetUsername) {
          const result = await this.apiService.acceptFriendRequest(this.targetUsername)

          if (result.success) {
            console.log('Friend request accepted successfully:', result.message)

            // Hide Accept/Reject buttons and show Already Friends container
            if (friendRequestActions) friendRequestActions.style.display = 'none'
            if (alreadyFriendsContainer) alreadyFriendsContainer.style.display = 'block'

            // Show success message
            alert(result.message || 'Friend request accepted!')
          } else {
            console.error('Failed to accept friend request:', result.message)
            alert(result.message || 'Failed to accept friend request')
          }
        }
      })
    }

    // Handle Reject Friend Request button click
    if (rejectFriendBtn) {
      rejectFriendBtn.addEventListener('click', async () => {
        console.log('Reject friend request clicked for:', this.targetUsername)

        if (this.targetUsername) {
          const result = await this.apiService.rejectFriendRequest(this.targetUsername)

          if (result.success) {
            console.log('Friend request rejected successfully:', result.message)

            // Hide Accept/Reject buttons and show Add Friend button
            if (friendRequestActions) friendRequestActions.style.display = 'none'
            if (addFriendBtn) addFriendBtn.style.display = 'block'

            // Show success message
            alert(result.message || 'Friend request rejected!')
          } else {
            console.error('Failed to reject friend request:', result.message)
            alert(result.message || 'Failed to reject friend request')
          }
        }
      })
    }
  }

  private setupFriendsList(): void {
    if (!this.element) return

    const friendsListBtn = this.element.querySelector('#friendsListBtn') as HTMLElement
    const friendsListDropdown = this.element.querySelector('#friendsListDropdown') as HTMLElement
    const friendsList = this.element.querySelector('#friendsList') as HTMLElement
    const pendingRequestsList = this.element.querySelector('#pendingRequestsList') as HTMLElement

    if (!friendsListBtn || !friendsListDropdown) return

    // Handle dropdown toggle
    friendsListBtn.addEventListener('click', (e) => {
      e.stopPropagation()

      if (friendsListDropdown.classList.contains('hidden')) {
        // Show dropdown and load data
        friendsListDropdown.classList.remove('hidden')
        this.loadFriendsListData()
      } else {
        // Hide dropdown
        friendsListDropdown.classList.add('hidden')
      }
    })

    // Close dropdown when clicking outside
    const documentClickHandler = (e: Event) => {
      if (!friendsListDropdown.contains(e.target as Node) && !friendsListBtn.contains(e.target as Node)) {
        friendsListDropdown.classList.add('hidden')
      }
    }
    document.addEventListener('click', documentClickHandler)

    // Prevent dropdown from closing when clicking inside it
    friendsListDropdown.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // Store the document click handler for cleanup
    ;(this.element as any).friendsListDocumentHandler = documentClickHandler

    // Load initial notification badge status
    this.updateFriendsNotificationBadge()
  }

  private async loadFriendsListData(): Promise<void> {
    const pendingRequestsList = this.element?.querySelector('#pendingRequestsList') as HTMLElement
    const friendsList = this.element?.querySelector('#friendsList') as HTMLElement

    if (!pendingRequestsList) {
      console.log('Pending requests list element not found')
      return
    }

    console.log('Loading friends and pending requests from backend')

    try {
      // Load both friends/requests and online users in parallel
      const [result, onlineUsers] = await Promise.all([
        this.apiService.getFriendsAndRequests(),
        this.apiService.getOnlineUsersList()
      ])

      // Create a set of online usernames for quick lookup
      const onlineUsernames = new Set(onlineUsers.map(user => user.username))

      if (result.success) {
        console.log('Friends and requests loaded:', result)
        console.log('Online users:', onlineUsers)

        // Update notification badge based on pending requests
        const notificationBadge = this.element?.querySelector('#friendsNotificationBadge') as HTMLElement
        if (notificationBadge) {
          if (result.pendingRequests && result.pendingRequests.length > 0) {
            notificationBadge.classList.remove('hidden')
          } else {
            notificationBadge.classList.add('hidden')
          }
        }

        // Handle pending requests
        if (result.pendingRequests && result.pendingRequests.length > 0) {
          // Remove default message elements only when we have data
          const defaultMessages = pendingRequestsList.querySelectorAll('div:not([id]):not(.template)')
          defaultMessages.forEach(msg => {
            if (msg.textContent?.includes('No pending requests')) {
              msg.remove()
            }
          })

          result.pendingRequests.forEach((request: any) => {
            // Clone the pending request template
            const template = this.templateManager.cloneTemplate('pendingRequestItemTemplate')
            if (!template) return

            const requestElement = template.firstElementChild as HTMLElement
            if (!requestElement) return

            // Update the username text
            const usernameSpan = requestElement.querySelector('.pending-request-username') as HTMLElement
            if (usernameSpan) {
              usernameSpan.textContent = request.username
              usernameSpan.setAttribute('data-username', request.username)

              // Add click handler for the username
              usernameSpan.addEventListener('click', (e) => {
                e.stopPropagation()
                // Navigate to the user's profile
                this.router.navigateTo(UserProfileScreen, request.username)
                // Close the dropdown
                const friendsListDropdown = this.element?.querySelector('#friendsListDropdown') as HTMLElement
                if (friendsListDropdown) {
                  friendsListDropdown.classList.add('hidden')
                }
              })
            }

            pendingRequestsList.appendChild(requestElement)
          })
        }
        // If no pending requests, default message remains visible

        // Handle friends list if element exists
        if (friendsList && result.friends) {
          if (result.friends.length > 0) {
            // Remove default message elements only when we have data
            const defaultMessages = friendsList.querySelectorAll('div:not([id]):not(.template)')
            defaultMessages.forEach(msg => {
              if (msg.textContent?.includes('No friends yet')) {
                msg.remove()
              }
            })

            result.friends.forEach((friend: any) => {
              // Clone the friend item template
              const template = this.templateManager.cloneTemplate('friendItemTemplate')
              if (!template) return

              const friendElement = template.firstElementChild as HTMLElement
              if (!friendElement) return

              // Update the username text
              const usernameSpan = friendElement.querySelector('.friend-username') as HTMLElement
              if (usernameSpan) {
                usernameSpan.textContent = friend.username
                usernameSpan.setAttribute('data-username', friend.username)

                // Add click handler for the username
                usernameSpan.addEventListener('click', (e) => {
                  e.stopPropagation()
                  // Navigate to the user's profile
                  this.router.navigateTo(UserProfileScreen, friend.username)
                  // Close the dropdown
                  const friendsListDropdown = this.element?.querySelector('#friendsListDropdown') as HTMLElement
                  if (friendsListDropdown) {
                    friendsListDropdown.classList.add('hidden')
                  }
                })
              }

              // Update online status indicator
              const statusIndicator = friendElement.querySelector('.indicator-offline, .indicator-online') as HTMLElement
              if (statusIndicator) {
                const isOnline = onlineUsernames.has(friend.username)
                if (isOnline) {
                  statusIndicator.className = 'indicator-online'
                  statusIndicator.title = 'Online'
                } else {
                  statusIndicator.className = 'indicator-offline'
                  statusIndicator.title = 'Offline'
                }
              }

              friendsList.appendChild(friendElement)
            })
          }
          // If no friends, default message remains visible
        }
      } else {
        console.error('Failed to load friends and requests:', result.message)
        pendingRequestsList.innerHTML = '<p class="text-red-500 text-sm">Failed to load requests</p>'
      }
    } catch (error) {
      console.error('Error loading friends data:', error)
      pendingRequestsList.innerHTML = '<p class="text-red-500 text-sm">Error loading requests</p>'
    }
  }

  private async updateFriendsNotificationBadge(): Promise<void> {
    const notificationBadge = this.element?.querySelector('#friendsNotificationBadge') as HTMLElement
    if (!notificationBadge) return

    try {
      // Only get pending requests to check if badge should be shown
      const result = await this.apiService.getFriendsAndRequests()

      if (result.success) {
        if (result.pendingRequests && result.pendingRequests.length > 0) {
          notificationBadge.classList.remove('hidden')
        } else {
          notificationBadge.classList.add('hidden')
        }
      } else {
        // Hide badge on error
        notificationBadge.classList.add('hidden')
      }
    } catch (error) {
      console.error('Error checking pending requests:', error)
      // Hide badge on error
      notificationBadge.classList.add('hidden')
    }
  }

  private toggleAvatarMenu(): void {
    const avatarMenuDropdown = this.element?.querySelector('#avatarMenuDropdown') as HTMLElement
    if (avatarMenuDropdown) {
      avatarMenuDropdown.classList.toggle('hidden')
    }
  }

  private closeAvatarMenu(): void {
    const avatarMenuDropdown = this.element?.querySelector('#avatarMenuDropdown') as HTMLElement
    if (avatarMenuDropdown) {
      avatarMenuDropdown.classList.add('hidden')
    }
  }

  private async handleAvatarUpload(
    file: File,
    avatarImg: HTMLImageElement,
    statusDiv: HTMLElement,
    progressBar: HTMLProgressElement,
    messageDiv: HTMLElement
  ): Promise<void> {
    if (!this.user) return

    console.log('Starting avatar upload for user:', this.user.username, 'File:', file.name, file.type, file.size)

    // Show upload status
    statusDiv.classList.remove('hidden')
    progressBar.classList.remove('hidden')
    progressBar.value = 0
    messageDiv.textContent = 'Uploading avatar...'
    messageDiv.className = 'mt-1 text-blue-600 font-mono text-sm'

    try {
      // Simulate progress for visual feedback
      const progressInterval = setInterval(() => {
        if (progressBar.value < 90) {
          progressBar.value += 10
        }
      }, 100)

      const result = await this.apiService.uploadAvatar(file)

      console.log('Avatar upload result:', result)

      clearInterval(progressInterval)
      progressBar.value = 100

      if (result.success) {
        messageDiv.textContent = result.message || 'Avatar uploaded successfully!'
        messageDiv.className = 'mt-1 text-green-600 font-mono text-sm font-bold'

        // Reload avatar image with cache-busting
        const newAvatarUrl = `${this.apiService.getAvatarUrl(this.user.username)}?t=${Date.now()}`

        console.log('Reloading avatar after upload with URL:', newAvatarUrl)

        // Create a test image to verify the new avatar loaded successfully
        const testImg = new Image()
        testImg.onload = () => {
          console.log('New avatar loaded successfully, updating display')
          avatarImg.src = newAvatarUrl
          this.hasCustomAvatar = true
          // Store custom avatar flag in localStorage
          if (this.user?.username) {
            localStorage.setItem(`hasCustomAvatar_${this.user.username}`, 'true')
          }
          this.updateDeleteButtonVisibility()
        }
        testImg.onerror = () => {
          console.log('Failed to load new avatar after upload, keeping current')
          // Keep the current avatar if the new one fails to load
        }
        testImg.src = newAvatarUrl

        // Hide status after success
        setTimeout(() => {
          statusDiv.classList.add('hidden')
          progressBar.classList.add('hidden')
        }, 2000)
      } else {
        messageDiv.textContent = result.message || 'Upload failed'
        messageDiv.className = 'mt-1 text-red-600 font-mono text-sm font-bold'
        progressBar.classList.add('hidden')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      messageDiv.textContent = 'Network error. Please try again.'
      messageDiv.className = 'mt-1 text-red-600 font-mono text-sm font-bold'
      progressBar.classList.add('hidden')
    }
  }

  private async handleAvatarDelete(
    avatarImg: HTMLImageElement,
    statusDiv: HTMLElement,
    messageDiv: HTMLElement
  ): Promise<void> {
    if (!this.user) return

    console.log('Starting avatar delete for user:', this.user.username)

    // Show status
    statusDiv.classList.remove('hidden')
    messageDiv.textContent = 'Deleting avatar...'
    messageDiv.className = 'mt-1 text-blue-600 font-mono text-sm'

    try {
      const result = await this.apiService.deleteAvatar()

      console.log('Avatar delete result:', result)

      if (result.success) {
        messageDiv.textContent = result.message || 'Avatar deleted successfully!'
        messageDiv.className = 'mt-1 text-green-600 font-mono text-sm font-bold'

        // Force immediate visual update to default avatar
        console.log('Avatar deleted successfully, updating display to default avatar')
        
        // Update state immediately
        this.hasCustomAvatar = false
        
        // Remove custom avatar flag from localStorage
        if (this.user?.username) {
          localStorage.removeItem(`hasCustomAvatar_${this.user.username}`)
        }
        
        // Force aggressive image reload by:
        // 1. Temporarily setting src to empty to force browser to reset
        avatarImg.src = ''
        
        // 2. Use a timeout to ensure the empty src is processed
        setTimeout(() => {
          // 3. Set to default avatar with strong cache-busting
          const timestamp = Date.now()
          avatarImg.src = `images/default_avatar.jpg?v=${timestamp}&deleted=${this.user?.id || 'unknown'}`
          console.log('Avatar updated to default with cache-busting:', avatarImg.src)
          
          // 4. Also force a reload by creating a new image element if needed
          if (avatarImg.complete && avatarImg.naturalHeight === 0) {
            console.log('Forcing image reload by recreating element')
            const newImg = avatarImg.cloneNode(true) as HTMLImageElement
            newImg.src = `images/default_avatar.jpg?v=${timestamp}&force=true`
            avatarImg.parentNode?.replaceChild(newImg, avatarImg)
          }
        }, 50)
        
        // 5. Update button visibility after state change
        this.updateDeleteButtonVisibility()
        
        // 6. Force one more update to ensure it sticks
        setTimeout(() => {
          const finalImg = this.element?.querySelector('#profileAvatar') as HTMLImageElement
          if (finalImg) {
            finalImg.src = 'images/default_avatar.jpg'
            console.log('Final avatar update completed')
          }
        }, 200)
        
        // 7. As a final fallback, force reload the avatar from server after a delay
        setTimeout(() => {
          this.forceAvatarReload()
        }, 500)

        // Hide status after success
        setTimeout(() => {
          statusDiv.classList.add('hidden')
        }, 2000)
      } else {
        messageDiv.textContent = result.message || 'Delete failed'
        messageDiv.className = 'mt-1 text-red-600 font-mono text-sm font-bold'
      }
    } catch (error) {
      console.error('Avatar delete error:', error)
      messageDiv.textContent = 'Network error. Please try again.'
      messageDiv.className = 'mt-1 text-red-600 font-mono text-sm font-bold'
    }
  }

  private async forceAvatarReload(): Promise<void> {
    const avatarImg = this.element?.querySelector('#profileAvatar') as HTMLImageElement
    if (!avatarImg || !this.user) return

    console.log('Force reloading avatar from server for user:', this.user.username)
    
    try {
      // Load user avatar and set up avatar state tracking with force reload
      await this.loadUserAvatar(avatarImg, this.user.username)
    } catch (error) {
      console.error('Error force reloading avatar:', error)
      // Fallback to default
      avatarImg.src = 'images/default_avatar.jpg'
    }
  }

  cleanup(): void {
    // Cleanup handled automatically by unmount
  }
}