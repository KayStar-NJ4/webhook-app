<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Cấu hình hệ thống</h3>
    </div>
    <div class="card-body">
      <div v-if="isLoading" class="text-center">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Đang tải...</p>
      </div>
      <form v-else @submit.prevent="handleSubmit">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="appName">Tên ứng dụng</label>
              <input 
                type="text" 
                class="form-control" 
                id="appName"
                v-model="formData.app_name"
                :class="{ 'is-invalid': errors.app_name }"
              >
              <div v-if="errors.app_name" class="invalid-feedback">
                {{ errors.app_name[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="appUrl">URL ứng dụng</label>
              <input 
                type="url" 
                class="form-control" 
                id="appUrl"
                v-model="formData.app_url"
                :class="{ 'is-invalid': errors.app_url }"
              >
              <div v-if="errors.app_url" class="invalid-feedback">
                {{ errors.app_url[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="adminEmail">Email quản trị</label>
              <input 
                type="email" 
                class="form-control" 
                id="adminEmail"
                v-model="formData.admin_email"
                :class="{ 'is-invalid': errors.admin_email }"
              >
              <div v-if="errors.admin_email" class="invalid-feedback">
                {{ errors.admin_email[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="timezone">Múi giờ</label>
              <select 
                class="form-control" 
                id="timezone"
                v-model="formData.timezone"
                :class="{ 'is-invalid': errors.timezone }"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
              <div v-if="errors.timezone" class="invalid-feedback">
                {{ errors.timezone[0] }}
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="form-group">
              <label for="maxFileSize">Kích thước file tối đa (MB)</label>
              <input 
                type="number" 
                class="form-control" 
                id="maxFileSize"
                v-model="formData.max_file_size"
                :class="{ 'is-invalid': errors.max_file_size }"
              >
              <div v-if="errors.max_file_size" class="invalid-feedback">
                {{ errors.max_file_size[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="sessionTimeout">Thời gian hết hạn session (phút)</label>
              <input 
                type="number" 
                class="form-control" 
                id="sessionTimeout"
                v-model="formData.session_timeout"
                :class="{ 'is-invalid': errors.session_timeout }"
              >
              <div v-if="errors.session_timeout" class="invalid-feedback">
                {{ errors.session_timeout[0] }}
              </div>
            </div>

            <div class="form-group">
              <label>Chế độ debug</label>
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="debugMode"
                  v-model="formData.debug_mode"
                >
                <label class="form-check-label" for="debugMode">
                  Bật chế độ debug
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Chế độ bảo trì</label>
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="maintenanceMode"
                  v-model="formData.maintenance_mode"
                >
                <label class="form-check-label" for="maintenanceMode">
                  Bật chế độ bảo trì
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="maintenanceMessage">Thông báo bảo trì</label>
          <textarea 
            class="form-control" 
            id="maintenanceMessage"
            v-model="formData.maintenance_message"
            :class="{ 'is-invalid': errors.maintenance_message }"
            rows="3"
          ></textarea>
          <div v-if="errors.maintenance_message" class="invalid-feedback">
            {{ errors.maintenance_message[0] }}
          </div>
        </div>

        <!-- API Timeout Configuration Section -->
        <div class="card mt-4">
          <div class="card-header">
            <h5 class="card-title mb-0">Cấu hình Thời gian chờ API (Timeout)</h5>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <i class="fas fa-info-circle"></i>
              <strong>Lưu ý:</strong> Dify AI timeout được cấu hình riêng cho từng app trong phần "Quản lý Dify Apps"
            </div>
            <div class="row">
              <div class="col-md-4">
                <div class="form-group">
                  <label for="apiTimeoutDefault">Timeout mặc định (ms)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="apiTimeoutDefault"
                    v-model.number="formData.api_timeout_default"
                    :class="{ 'is-invalid': errors.api_timeout_default }"
                    placeholder="30000"
                    min="1000"
                    step="1000"
                  >
                  <small class="form-text text-muted">
                    Thời gian chờ mặc định cho các API call (khuyến nghị: 30000ms = 30 giây)
                  </small>
                  <div v-if="errors.api_timeout_default" class="invalid-feedback">
                    {{ errors.api_timeout_default[0] }}
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label for="apiTimeoutChatwoot">Chatwoot API Timeout (ms)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="apiTimeoutChatwoot"
                    v-model.number="formData.api_timeout_chatwoot"
                    :class="{ 'is-invalid': errors.api_timeout_chatwoot }"
                    placeholder="30000"
                    min="1000"
                    step="1000"
                  >
                  <small class="form-text text-muted">
                    Thời gian chờ cho Chatwoot API (khuyến nghị: 20000-60000ms)
                  </small>
                  <div v-if="errors.api_timeout_chatwoot" class="invalid-feedback">
                    {{ errors.api_timeout_chatwoot[0] }}
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label for="apiTimeoutTelegram">Telegram API Timeout (ms)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="apiTimeoutTelegram"
                    v-model.number="formData.api_timeout_telegram"
                    :class="{ 'is-invalid': errors.api_timeout_telegram }"
                    placeholder="10000"
                    min="1000"
                    step="1000"
                  >
                  <small class="form-text text-muted">
                    Thời gian chờ cho Telegram API (khuyến nghị: 5000-15000ms)
                  </small>
                  <div v-if="errors.api_timeout_telegram" class="invalid-feedback">
                    {{ errors.api_timeout_telegram[0] }}
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="apiTimeoutWebhook">Webhook Timeout (ms)</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="apiTimeoutWebhook"
                    v-model.number="formData.api_timeout_webhook"
                    :class="{ 'is-invalid': errors.api_timeout_webhook }"
                    placeholder="15000"
                    min="1000"
                    step="1000"
                  >
                  <small class="form-text text-muted">
                    Thời gian chờ cho webhook calls (khuyến nghị: 10000-30000ms)
                  </small>
                  <div v-if="errors.api_timeout_webhook" class="invalid-feedback">
                    {{ errors.api_timeout_webhook[0] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Webhook Configuration Section -->
        <div class="card mt-4">
          <div class="card-header">
            <h5 class="card-title mb-0">Cấu hình Webhook</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="webhookUrl">Webhook URL</label>
                  <input 
                    type="url" 
                    class="form-control" 
                    id="webhookUrl"
                    v-model="formData.webhook_url"
                    :class="{ 'is-invalid': errors.webhook_url }"
                    placeholder="https://your-domain.com"
                  >
                  <small class="form-text text-muted">
                    URL cơ sở của ứng dụng để nhận webhook từ các platform (Telegram, Chatwoot, etc.)
                  </small>
                  <div v-if="errors.webhook_url" class="invalid-feedback">
                    {{ errors.webhook_url[0] }}
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="webhookSecretToken">Secret Token</label>
                  <input 
                    type="password" 
                    class="form-control" 
                    id="webhookSecretToken"
                    v-model="formData.webhook_secret_token"
                    :class="{ 'is-invalid': errors.webhook_secret_token }"
                    placeholder="Secret token để bảo mật webhook"
                  >
                  <small class="form-text text-muted">
                    Token bí mật để xác thực webhook (tùy chọn)
                  </small>
                  <div v-if="errors.webhook_secret_token" class="invalid-feedback">
                    {{ errors.webhook_secret_token[0] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group text-right">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
            {{ isSaving ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemConfigurationComponent',
  data() {
    return {
      formData: {
        app_name: '',
        app_url: '',
        admin_email: '',
        timezone: 'Asia/Ho_Chi_Minh',
        max_file_size: 10,
        session_timeout: 60,
        debug_mode: false,
        maintenance_mode: false,
        maintenance_message: '',
        webhook_url: '',
        webhook_secret_token: '',
        api_timeout_default: 30000,
        api_timeout_chatwoot: 30000,
        api_timeout_telegram: 10000,
        api_timeout_webhook: 15000
      },
      errors: {},
      isLoading: false,
      isSaving: false
    }
  },
  mounted() {
    this.loadConfigurations()
  },
  methods: {
    async loadConfigurations() {
      this.isLoading = true
      try {
        const response = await window.ConfigurationService.getSystemConfigurations()
        if (response.data.success) {
          const configs = response.data.data.configurations || response.data.data
          // Map configurations to form data
          configs.forEach(config => {
            if (this.formData.hasOwnProperty(config.key)) {
              this.formData[config.key] = config.value
            }
          })
        }
      } catch (error) {
        console.error('Error loading configurations:', error)
      } finally {
        this.isLoading = false
      }
    },
    async handleSubmit() {
      this.errors = {}
      this.isSaving = true

      try {
        const responses = await window.ConfigurationService.updateConfig(this.formData)
        const allOk = Array.isArray(responses)
          ? responses.every(r => r && r.data && r.data.success)
          : false

        if (allOk) {
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Cập nhật cấu hình thành công')
          }
        } else {
          // Find first error message if any
          const firstError = Array.isArray(responses)
            ? responses.find(r => !(r && r.data && r.data.success))
            : null
          if (firstError && firstError.data && firstError.data.errors) {
            this.errors = firstError.data.errors
          }
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          console.error('Error saving configurations:', error)
        }
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>
