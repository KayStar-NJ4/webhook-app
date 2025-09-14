class AuthService extends BaseService {
  constructor() {
    super()
    this.baseURL = ''
    this.endpoint = '/auth'
  }

  // Đăng nhập
  login(credentials) {
    return this.post(`${this.endpoint}/login`, credentials)
  }

  // Đăng xuất
  logout() {
    return this.post(`${this.endpoint}/logout`)
  }

  // Lấy thông tin user hiện tại
  getCurrentUser() {
    return this.get(`${this.endpoint}/me`)
  }

  // Refresh token
  refreshToken() {
    return this.post(`${this.endpoint}/refresh`)
  }

  // Kiểm tra token có hợp lệ không
  validateToken() {
    return this.get(`${this.endpoint}/validate`)
  }

  // Lưu token sau khi login thành công
  saveAuthData(response) {
    if (response.data.success) {
      const { token, user } = response.data.data
      window.AuthUtils.setAuth(token, user)
      return true
    }
    return false
  }
}

// Export to global window object
if (!window.AuthService) {
    window.AuthService = new AuthService();
}
