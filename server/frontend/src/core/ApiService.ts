/**
 * Simple API Service for backend communication
 */
export class ApiService {
  private baseUrl: string

  constructor() {
    // Backend runs on HTTPS
    this.baseUrl = window.location.origin;
  }

  async getOnlineUsersCount(): Promise<number> {
    try {
      console.log('Fetching online users from:', `/api/loggedinusers`)
      const response = await fetch(`/api/loggedinusers`, {
        method: 'GET',

        credentials: 'include'
      })
      console.log('Response status:', response.status)

      if (response.ok) {
        const users = await response.json()
        console.log('Users data:', users)
        const count = Array.isArray(users) ? users.length : 0
        console.log('Users count:', count)
        return count
      } else {
        console.error('Response not ok:', response.status, response.statusText)
        return 0
      }
    } catch (error) {
      console.error('Failed to fetch online users count:', error)
      return 0
    }
  }

  async getOnlineUsersList(): Promise<{id: number, username: string}[]> {
    try {
      console.log('Fetching online users list from:', `/api/loggedinusers`)
      const response = await fetch(`/api/loggedinusers`, {
        method: 'GET',

        credentials: 'include'
      })

      if (response.ok) {
        const users = await response.json()
        console.log('Online users list:', users)
        return Array.isArray(users) ? users : []
      } else {
        console.error('Failed to fetch online users list:', response.status, response.statusText)
        return []
      }
    } catch (error) {
      console.error('Error fetching online users list:', error)
      return []
    }
  }

  async getCurrentUser(): Promise<{id: number, username: string, email: string, createdAt: string, twoFAEnabled?: boolean} | null> {
    try {
      console.log('Fetching current user from:', `/api/me`)
      const response = await fetch(`/api/me`, {
        method: 'GET',

        credentials: 'include'
      })

      console.log('getCurrentUser response status:', response.status)

      if (response.ok) {
        const user = await response.json()
        console.log('getCurrentUser response data:', user)
        return user
      } else {
        console.error('Failed to get current user:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return null
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      return null
    }
  }

  async getUserProfile(username: string): Promise<{id: number, username: string, email: string, createdAt: string, twoFAEnabled?: boolean} | null> {
    try {
      console.log('Fetching user profile from:', `/api/users/${encodeURIComponent(username)}`)
      const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: 'GET',

        credentials: 'include'
      })

      console.log('getUserProfile response status:', response.status)

      if (response.ok) {
        const user = await response.json()
        console.log('User profile data:', user)
        return user
      } else {
        console.log('getUserProfile failed with status:', response.status)
        if (response.status === 404) {
          console.log('User not found:', username)
        }
        return null
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      return null
    }
  }

  async getUserMatches(username: string): Promise<{
    tournament_id: number | null,
    player1: string,
    player2: string,
    player1Score: number,
    player2Score: number,
    winner: string,
    playedAt: string
  }[] | null> {
    try {
      console.log('Fetching user matches from:', `/users/${encodeURIComponent(username)}/matches`)
      const response = await fetch(`/users/${encodeURIComponent(username)}/matches`, {
        method: 'GET',

        credentials: 'include'
      })

      console.log('getUserMatches response status:', response.status)

      if (response.ok) {
        const matches = await response.json()
        console.log('User matches data:', matches)
        return Array.isArray(matches) ? matches : []
      } else {
        console.log('getUserMatches failed with status:', response.status)
        if (response.status === 404) {
          console.log('User not found:', username)
        }
        return null
      }
    } catch (error) {
      console.error('Failed to fetch user matches:', error)
      return null
    }
  }

  async logout(): Promise<boolean> {
    try {
      console.log('Logging out from:', `/api/logout`)
      const response = await fetch(`/api/logout`, {
        method: 'POST',

        credentials: 'include'
      })

      console.log('Logout response status:', response.status)

      if (response.ok) {
        console.log('Logout successful')
        return true
      } else {
        console.error('Failed to logout:', response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  async verifyCurrentPassword(currentPassword: string): Promise<{success: boolean, message?: string}> {
    try {
      const user = await this.getCurrentUser()
      if (!user || !user.email) {
        return { success: false, message: 'Unable to verify current user' }
      }

      // Use the login endpoint to verify current credentials
      const response = await fetch(`/api/login`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: currentPassword
        }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Current password is incorrect' }
      }
    } catch (error) {
      console.error('Password verification error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async updatePassword(newPassword: string, currentPassword: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/password`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword
        }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update password' }
      }
    } catch (error) {
      console.error('Password update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async updateEmail(email: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/email`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update email' }
      }
    } catch (error) {
      console.error('Email update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async updateUsername(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/username`, {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to update username' }
      }
    } catch (error) {
      console.error('Username update error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async get2FAStatus(): Promise<{success: boolean, enabled?: boolean, message?: string}> {
    try {
      // Get 2FA status from current user data
      const user = await this.getCurrentUser()

      if (user) {
        return { success: true, enabled: Boolean(user.twoFAEnabled) }
      } else {
        return { success: false, message: 'Failed to get user data' }
      }
    } catch (error) {
      console.error('Get 2FA status error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async enable2FA(): Promise<{success: boolean, qrCode?: string, secret?: string, message?: string}> {
    try {
      const response = await fetch(`/api/me/2fa/setup`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true, qrCode: result.qrCodeUrl, secret: result.secret }
      } else {
        return { success: false, message: result.message || 'Failed to enable 2FA' }
      }
    } catch (error) {
      console.error('Enable 2FA error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async verify2FA(code: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ TwoFAToken: code }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to verify 2FA' }
      }
    } catch (error) {
      console.error('Verify 2FA error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async disable2FA(): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/2fa/remove`, {
        method: 'POST',

        credentials: 'include'
      })
      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to disable 2FA' }
      }
    } catch (error) {
      console.error('Disable 2FA error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async deleteAccount(password: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/delete`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, message: result.message || 'Failed to delete account' }
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async uploadAvatar(file: File): Promise<{success: boolean, message?: string}> {
    try {
      // Validate file type
      if (file.type !== 'image/png') {
        return { success: false, message: 'Only PNG files are allowed.' }
      }

      console.log('Uploading avatar to:', `/api/me/avatar`)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/me/avatar`, {
        method: 'PUT',

        body: formData,
        credentials: 'include'
      })

      console.log('Upload response status:', response.status, response.statusText)

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true, message: result.message || 'Avatar uploaded successfully!' }
      } else {
        return { success: false, message: result.message || 'Failed to upload avatar' }
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async deleteAvatar(): Promise<{success: boolean, message?: string}> {
    try {
      console.log('Deleting avatar from:', `/api/me/avatar`)

      const response = await fetch(`/api/me/avatar`, {
        method: 'DELETE',

        credentials: 'include'
      })

      console.log('Delete response status:', response.status, response.statusText)

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true, message: result.message || 'Avatar deleted successfully!' }
      } else {
        return { success: false, message: result.message || 'Failed to delete avatar' }
      }
    } catch (error) {
      console.error('Avatar delete error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async sendFriendRequest(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/friends/${username}/request`, {
        method: 'POST',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: result.success, message: result.message || 'Friend request sent!' }
      } else {
        return { success: false, message: result.message || 'Failed to send friend request' }
      }
    } catch (error) {
      console.error('Friend request error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async acceptFriendRequest(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/friends/${username}/accept`, {
        method: 'POST',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: result.success, message: result.message || 'Friend request accepted!' }
      } else {
        return { success: false, message: result.message || 'Failed to accept friend request' }
      }
    } catch (error) {
      console.error('Accept friend request error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async rejectFriendRequest(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/friends/${username}/reject`, {
        method: 'POST',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: result.success, message: result.message || 'Friend request rejected!' }
      } else {
        return { success: false, message: result.message || 'Failed to reject friend request' }
      }
    } catch (error) {
      console.error('Reject friend request error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async removeFriend(username: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/me/friends/${username}`, {
        method: 'DELETE',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: result.success, message: result.message || 'Friend removed successfully!' }
      } else {
        return { success: false, message: result.message || 'Failed to remove friend' }
      }
    } catch (error) {
      console.error('Remove friend error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async getFriendsAndRequests(): Promise<{success: boolean, friends?: any[], pendingRequests?: any[], message?: string}> {
    try {
      const response = await fetch(`/api/me/friends`, {
        method: 'GET',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))
      console.log('Raw backend response:', result)

      if (response.ok) {
        return {
          success: true,
          friends: result.friends || [],
          // The backend currently doesn't return pendingRequests, so we'll get an empty array
          pendingRequests: result.pendingRequests || []
        }
      } else {
        return { success: false, message: result.message || 'Failed to fetch friends' }
      }
    } catch (error) {
      console.error('Friends fetch error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  async checkFriendshipStatus(username: string): Promise<{success: boolean, status?: string, message?: string}> {
    try {
      const response = await fetch(`/api/me/friends/${username}/status`, {
        method: 'GET',

        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        return { success: true, status: result.status }
      } else {
        return { success: false, message: result.message || 'Failed to check friendship status' }
      }
    } catch (error) {
      console.error('Friendship status check error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  getAvatarUrl(username?: string): string {
    if (username) {
      // Backend serves user avatars via username and handles fallback automatically
      return `/users/${username}/avatar`
    }
    // Default avatar fallback for when no username is provided
    return 'images/default_avatar.jpg'
  }
}
