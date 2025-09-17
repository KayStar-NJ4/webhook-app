<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>Turbo Chatwoot Webhook</h2>
          <p>Admin Panel</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              v-model="form.username"
              :class="{ 'error': errors.username }"
              placeholder="Enter your username"
              required
            />
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="form.password"
              :class="{ 'error': errors.password }"
              placeholder="Enter your password"
              required
            />
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>
          
          <FormButtonComponent
            type="submit"
            variant="primary"
            :loading="isLoading"
            :text="isLoading ? 'Signing in...' : 'Sign In'"
            fullWidth
            class="login-btn"
          />
        </form>
        
        <div v-if="errorMessage" class="error-alert">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'
import { AuthService } from '../services'
import AuthUtils from '../utils/auth'
import { clearAllAuth } from '../utils/clear-auth'
import { fixTokenIssue } from '../utils/fix-token'

export default {
  components: {
    FormButtonComponent
  },
  name: 'LoginPage',
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
        const response = await AuthService.login({
          username: this.form.username,
          password: this.form.password
        })

        if (response.data.success) {
          // Store token and user data using utility
          AuthUtils.setAuth(response.data.data.token, response.data.data.user)
          
          // Debug auth info
          AuthUtils.debugAuth()
          
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
  },
  async mounted() {
    // Check if already logged in
    if (AuthUtils.isAuthenticated()) {
      AuthUtils.debugAuth()
      
      // Test and fix token issues
      fixTokenIssue()
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
  display: block;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-alert {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fcc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-alert i {
  font-size: 16px;
}
</style>

<script>
// Export to global window object for use in index.html
if (typeof window !== 'undefined') {
  window.LoginPage = {
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

          if (response.data.success) {
            // Store token and user data using utility
            window.AuthUtils.setAuth(response.data.data.token, response.data.data.user)
            
            // Debug auth info
            window.AuthUtils.debugAuth()
            
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
}
</script>
