// Auth utility functions
const AuthUtils = {
  // Kiểm tra token có tồn tại và hợp lệ không
  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      return false
    }
    
    try {
      const userData = JSON.parse(user)
      return !!(token && userData)
    } catch (error) {
      console.error('Error parsing user data:', error)
      return false
    }
  },

  // Lấy token
  getToken() {
    return localStorage.getItem('token')
  },

  // Lấy thông tin user
  getUser() {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  },

  // Lưu thông tin auth
  setAuth(token, user) {
    if (!token || token === 'undefined' || token === 'null') {
      return;
    }
    
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  // Xóa thông tin auth
  clearAuth() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Kiểm tra token có hết hạn không (nếu có thông tin expiry)
  isTokenExpired() {
    const user = this.getUser()
    if (!user || !user.expires_at) {
      return false
    }
    
    const now = new Date().getTime()
    const expiry = new Date(user.expires_at).getTime()
    return now >= expiry
  },

  // Debug thông tin auth
  debugAuth() {
    // Debug function removed
  },

  // Kiểm tra token có hợp lệ không bằng cách gọi API
  async validateToken() {
    try {
      const response = await fetch('/api/admin/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }
}

// Export to global window object
if (typeof window !== 'undefined') {
  window.AuthUtils = AuthUtils
}
