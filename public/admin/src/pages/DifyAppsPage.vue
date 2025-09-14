<template>
  <div class="dify-apps-page">
    <div class="page-header">
      <h1>Dify Apps</h1>
      <FormButtonComponent
        v-if="hasPermission('dify', 'create')"
        @click="openCreateModal"
        variant="primary"
        icon="fas fa-robot"
        text="New App"
      />
    </div>

    <div class="page-content">
      <div v-if="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading apps...</span>
      </div>

      <div v-else-if="apps.length === 0" class="no-data">
        <i class="fas fa-robot"></i>
        <h3>No Dify Apps</h3>
        <p>Create your first Dify app to get started</p>
        <FormButtonComponent
          v-if="hasPermission('dify', 'create')"
          @click="openCreateModal"
          variant="primary"
          icon="fas fa-robot"
          text="Create App"
        />
      </div>

      <div v-else class="apps-grid">
        <div
          v-for="app in apps"
          :key="app.id"
          class="app-card"
        >
          <div class="app-header">
            <div class="app-info">
              <h3>{{ app.name }}</h3>
              <p class="app-api-url">{{ app.api_url }}</p>
            </div>
            <div class="app-status">
              <span :class="app.is_active ? 'status-active' : 'status-inactive'">
                {{ app.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <div class="app-details">
            <div class="detail-item">
              <label>App ID:</label>
              <span class="app-id">{{ app.app_id }}</span>
            </div>
            <div class="detail-item">
              <label>API Key:</label>
              <span class="api-key-display">{{ maskApiKey(app.api_key) }}</span>
            </div>
            <div class="detail-item">
              <label>Timeout:</label>
              <span>{{ app.timeout }}ms</span>
            </div>
            <div class="detail-item">
              <label>Created:</label>
              <span>{{ formatDate(app.created_at) }}</span>
            </div>
          </div>

          <div class="app-actions">
            <FormButtonComponent
              @click="testConnection(app.id)"
              variant="outline"
              size="small"
              icon="fas fa-plug"
              text="Test"
            />
            <FormButtonComponent
              v-if="hasPermission('dify', 'update')"
              @click="openEditModal(app)"
              variant="outline"
              size="small"
              icon="fas fa-edit"
              text="Edit"
            />
            <FormButtonComponent
              v-if="hasPermission('dify', 'delete')"
              @click="deleteApp(app.id)"
              variant="danger"
              size="small"
              icon="fas fa-trash"
              text="Delete"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <FormModalComponent
      :isVisible="showModal"
      :title="isEdit ? 'Edit Dify App' : 'Create Dify App'"
      size="medium"
      :loading="isSaving"
      @close="closeModal"
      @confirm="handleSave"
    >
      <div class="modal-form">
        <FormInputTextComponent
          v-model="form.name"
          label="App Name"
          placeholder="Enter app name"
          :required="true"
          :error="errors.name"
        />

        <FormInputTextComponent
          v-model="form.api_url"
          label="API URL"
          placeholder="https://api.dify.ai/v1"
          :required="true"
          :error="errors.api_url"
          helpText="Dify API endpoint URL"
        />

        <FormInputTextComponent
          v-model="form.api_key"
          label="API Key"
          type="password"
          placeholder="Enter API key"
          :required="true"
          :error="errors.api_key"
          helpText="Get this from your Dify app settings"
        />

        <FormInputTextComponent
          v-model="form.app_id"
          label="App ID"
          placeholder="Enter app ID"
          :required="true"
          :error="errors.app_id"
          helpText="Unique identifier for your Dify app"
        />

        <FormInputTextComponent
          v-model="form.timeout"
          label="Timeout (ms)"
          type="number"
          placeholder="30000"
          :required="true"
          :error="errors.timeout"
          helpText="Request timeout in milliseconds"
        />

        <FormCheckBoxComponent
          v-model="form.is_active"
          label="Active"
          helpText="Enable this app for use"
        />
      </div>

      <template #footer>
        <FormButtonComponent
          @click="closeModal"
          variant="secondary"
          text="Cancel"
        />
        <FormButtonComponent
          @click="handleSave"
          variant="primary"
          :loading="isSaving"
          :text="isSaving ? 'Saving...' : 'Save'"
        />
      </template>
    </FormModalComponent>
  </div>
</template>

<script>
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'
import FormModalComponent from '../components/shared/FormModalComponent.vue'
import FormInputTextComponent from '../components/shared/FormInputTextComponent.vue'
import FormCheckBoxComponent from '../components/shared/FormCheckBoxComponent.vue'
import { DifyService } from '../services'
import AuthUtils from '../utils/auth'

export default {
  name: 'DifyAppsPage',
  components: {
    FormButtonComponent,
    FormModalComponent,
    FormInputTextComponent,
    FormCheckBoxComponent
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      apps: [],
      showModal: false,
      isEdit: false,
      selectedApp: null,
      form: {
        name: '',
        api_url: 'https://api.dify.ai/v1',
        api_key: '',
        app_id: '',
        timeout: 30000,
        is_active: true
      },
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    // Debug auth status
    AuthUtils.debugAuth()
    
    if (!AuthUtils.isAuthenticated()) {
      this.$router.push('/admin/login')
      return
    }
    
    this.loadUserData()
    this.loadApps()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        this.userPermissions = user.permissions || {}
      }
    },

    async loadApps() {
      this.isLoading = true
      try {
        const response = await DifyService.getList()
        
        if (response.data.success) {
          this.apps = response.data.data.apps || response.data.data
        }
      } catch (error) {
        console.error('❌ Failed to load apps:', error)
        console.error('❌ Error details:', error.response?.data)
        this.$toast?.error('Failed to load apps')
      } finally {
        this.isLoading = false
      }
    },

    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedApp = null
      this.form = {
        name: '',
        api_url: 'https://api.dify.ai/v1',
        api_key: '',
        app_id: '',
        timeout: 30000,
        is_active: true
      }
      this.errors = {}
      this.showModal = true
    },

    openEditModal(app) {
      this.isEdit = true
      this.selectedApp = app
      this.form = {
        name: app.name,
        api_url: app.api_url,
        api_key: app.api_key,
        app_id: app.app_id,
        timeout: app.timeout,
        is_active: app.is_active
      }
      this.errors = {}
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedApp = null
      this.errors = {}
    },

    async handleSave() {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await DifyService.update(this.selectedApp.id, this.form)
          : await DifyService.create(this.form)
        
        if (response.data.success) {
          this.closeModal()
          this.loadApps()
          this.$toast?.success(response.data.message || 'App saved successfully')
        }
      } catch (error) {
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors
        } else {
          this.$toast?.error(error.response?.data?.message || 'Failed to save app')
        }
      } finally {
        this.isSaving = false
      }
    },

    async deleteApp(id) {
      const confirmed = await window.ToastService.confirmAsync(
        'Bạn có chắc chắn muốn xóa app này?',
        'Xác nhận xóa app'
      );
      
      if (!confirmed) return
      
      try {
        const response = await DifyService.delete(id)
        
        if (response.data.success) {
          this.loadApps()
          this.$toast?.success('App deleted successfully')
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || 'Failed to delete app')
      }
    },

    async testConnection(id) {
      try {
        const response = await DifyService.testConnection(id)
        
        if (response.data.success) {
          this.$toast?.success('Connection test successful!')
        } else {
          this.$toast?.error('Connection test failed: ' + response.data.message)
        }
      } catch (error) {
        this.$toast?.error('Connection test failed: ' + (error.response?.data?.message || 'Unknown error'))
      }
    },

    maskApiKey(apiKey) {
      if (!apiKey) return ''
      return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 8)
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.dify-apps-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e5e9;
}

.page-header h1 {
  color: #333;
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.page-content {
  min-height: 400px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading i {
  font-size: 32px;
  margin-bottom: 15px;
  color: #667eea;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-data i {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ddd;
}

.no-data h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.no-data p {
  margin: 0 0 20px 0;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.app-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  transition: all 0.3s ease;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.app-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.app-api-url {
  margin: 0;
  color: #666;
  font-size: 14px;
  word-break: break-all;
}

.status-active {
  background: #d4edda;
  color: #155724;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.app-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item label {
  color: #666;
  font-weight: 500;
}

.detail-item span {
  color: #333;
  word-break: break-all;
}

.app-id {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.api-key-display {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.app-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .apps-grid {
    grid-template-columns: 1fr;
  }
  
  .app-actions {
    justify-content: center;
  }
}
</style>
