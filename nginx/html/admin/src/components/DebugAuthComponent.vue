<template>
  <div v-if="showDebug" class="debug-auth">
    <div class="debug-header">
      <h4>🔍 Auth Debug Information</h4>
      <button @click="toggleDebug" class="close-btn">×</button>
    </div>
    
    <div class="debug-content">
      <div class="debug-section">
        <h5>Authentication Status</h5>
        <div class="status-item">
          <span class="label">Is Authenticated:</span>
          <span :class="['value', authStatus.isAuthenticated ? 'success' : 'error']">
            {{ authStatus.isAuthenticated ? '✅ Yes' : '❌ No' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Token Present:</span>
          <span :class="['value', authStatus.hasToken ? 'success' : 'error']">
            {{ authStatus.hasToken ? '✅ Yes' : '❌ No' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">User Data Present:</span>
          <span :class="['value', authStatus.hasUser ? 'success' : 'error']">
            {{ authStatus.hasUser ? '✅ Yes' : '❌ No' }}
          </span>
        </div>
      </div>

      <div class="debug-section" v-if="authStatus.hasToken">
        <h5>Token Information</h5>
        <div class="token-info">
          <span class="label">Token (first 20 chars):</span>
          <code>{{ tokenPreview }}</code>
        </div>
      </div>

      <div class="debug-section" v-if="authStatus.hasUser">
        <h5>User Information</h5>
        <div class="user-info">
          <pre>{{ JSON.stringify(userInfo, null, 2) }}</pre>
        </div>
      </div>

      <div class="debug-actions">
        <button @click="refreshAuth" class="btn-refresh">🔄 Refresh</button>
        <button @click="clearAuth" class="btn-clear">🗑️ Clear Auth</button>
        <button @click="testApi" class="btn-test">🧪 Test API</button>
      </div>

      <div v-if="apiTestResult" class="api-test-result">
        <h5>API Test Result</h5>
        <pre>{{ apiTestResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import AuthUtils from '../utils/auth'
import { TelegramService } from '../services'
import { clearAllAuth } from '../utils/clear-auth'

export default {
  name: 'DebugAuthComponent',
  data() {
    return {
      showDebug: false,
      authStatus: {
        isAuthenticated: false,
        hasToken: false,
        hasUser: false
      },
      userInfo: null,
      tokenPreview: '',
      apiTestResult: null
    }
  },
  methods: {
    toggleDebug() {
      this.showDebug = !this.showDebug
      if (this.showDebug) {
        this.refreshAuth()
      }
    },
    
    refreshAuth() {
      this.authStatus.isAuthenticated = AuthUtils.isAuthenticated()
      this.authStatus.hasToken = !!AuthUtils.getToken()
      this.authStatus.hasUser = !!AuthUtils.getUser()
      
      const user = AuthUtils.getUser()
      this.userInfo = user
      
      const token = AuthUtils.getToken()
      this.tokenPreview = token ? token.substring(0, 20) + '...' : 'No token'
    },
    
    clearAuth() {
      clearAllAuth()
    },
    
    async testApi() {
      this.apiTestResult = 'Testing API...'
      try {
        const response = await TelegramService.getList()
        this.apiTestResult = `✅ API Test Successful!\nStatus: ${response.status}\nData: ${JSON.stringify(response.data, null, 2)}`
      } catch (error) {
        this.apiTestResult = `❌ API Test Failed!\nError: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}`
      }
    }
  },
  
  mounted() {
    // Show debug panel if there are auth issues
    if (!AuthUtils.isAuthenticated()) {
      this.showDebug = true
      this.refreshAuth()
    }
  }
}
</script>

<style scoped>
.debug-auth {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: white;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow-y: auto;
}

.debug-header {
  background: #e74c3c;
  color: white;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header h4 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-content {
  padding: 15px;
}

.debug-section {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.debug-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.debug-section h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
}

.value.success {
  color: #27ae60;
}

.value.error {
  color: #e74c3c;
}

.token-info {
  margin-bottom: 10px;
}

.token-info code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.user-info pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.debug-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.debug-actions button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.debug-actions button:hover {
  background: #f8f9fa;
}

.btn-refresh {
  border-color: #3498db;
  color: #3498db;
}

.btn-clear {
  border-color: #e74c3c;
  color: #e74c3c;
}

.btn-test {
  border-color: #27ae60;
  color: #27ae60;
}

.api-test-result {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.api-test-result pre {
  margin: 0;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
