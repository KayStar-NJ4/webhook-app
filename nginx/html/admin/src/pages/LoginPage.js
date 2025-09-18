// LoginPage component for use in index.html
const LoginPage = {
  template: `
    <div class="login-page">
      <div class="login-box">
        <div class="login-logo">
          <b>Turbo</b> Chatwoot Webhook
        </div>
        <div class="card">
          <div class="card-body login-card-body">
            <p class="login-box-msg">Đăng nhập để tiếp tục</p>
            <form @submit.prevent="handleLogin">
              <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Tên đăng nhập" v-model="form.username" required>
                <div class="input-group-append">
                  <div class="input-group-text">
                    <span class="fas fa-user"></span>
                  </div>
                </div>
              </div>
              <div class="input-group mb-3">
                <input type="password" class="form-control" placeholder="Mật khẩu" v-model="form.password" required>
                <div class="input-group-append">
                  <div class="input-group-text">
                    <span class="fas fa-lock"></span>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm mr-2"></span>
                    {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                  </button>
                </div>
              </div>
            </form>
            <div v-if="errorMessage" class="alert alert-danger mt-3">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      errors: {},
      isLoading: false,
      errorMessage: ''
    }
  },
  methods: {
    async handleLogin() {
      this.errors = {}
      this.errorMessage = ''
      
      if (!this.form.username) {
        this.errors.username = 'Username is required'
        return
      }
      
      if (!this.form.password) {
        this.errors.password = 'Password is required'
        return
      }
      
      this.isLoading = true
      
      try {
        const response = await window.AuthService.login({
          username: this.form.username,
          password: this.form.password
        })

        if (window.AuthService.saveAuthData(response)) {
          // Redirect to dashboard
          this.$router.push('/admin/dashboard')
        } else {
          this.errorMessage = response.data.message || 'Login failed'
        }
      } catch (error) {
        console.error('Login error:', error)
        this.errorMessage = error.response?.data?.message || 'Login failed. Please try again.'
      } finally {
        this.isLoading = false
      }
    }
  }
}

// Export to global window object
if (typeof window !== 'undefined') {
  window.LoginPage = LoginPage
}
