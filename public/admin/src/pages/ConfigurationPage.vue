<template>
  <div class="configuration-page">
    <div class="page-header">
      <h1>Configuration Management</h1>
      <FormButtonComponent
        v-if="hasPermission('mappings', 'create')"
        @click="openCreateModal"
        variant="primary"
        icon="fas fa-plus"
        text="New Configuration"
      />
    </div>

    <div class="configuration-content">
      <!-- User Configurations -->
      <div class="config-section">
        <h2>My Configurations</h2>
        <div v-if="isLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Loading...
        </div>
        <div v-else-if="userConfigurations.length === 0" class="no-data">
          <i class="fas fa-cogs"></i>
          <p>No configurations found</p>
        </div>
        <div v-else class="config-list">
          <div 
            v-for="config in userConfigurations" 
            :key="config.id" 
            class="config-card"
          >
            <div class="config-header">
              <h3>{{ config.chatwootAccount.name }}</h3>
              <div class="config-actions">
                <FormButtonComponent
                  v-if="hasPermission('mappings', 'update')"
                  @click="openEditModal(config)"
                  variant="outline"
                  size="small"
                  icon="fas fa-edit"
                />
                <FormButtonComponent
                  v-if="hasPermission('mappings', 'delete')"
                  @click="deleteConfiguration(config.id)"
                  variant="danger"
                  size="small"
                  icon="fas fa-trash"
                />
              </div>
            </div>
            
            <div class="config-details">
              <div class="detail-item">
                <label>Chatwoot Account:</label>
                <span>{{ config.chatwootAccount.name }} ({{ config.chatwootAccount.baseUrl }})</span>
              </div>
              
              <div class="detail-item">
                <label>Telegram Bots:</label>
                <span v-if="config.telegramBotIds.length === 0">None</span>
                <div v-else class="tag-list">
                  <span 
                    v-for="botId in config.telegramBotIds" 
                    :key="botId" 
                    class="tag"
                  >
                    {{ getBotName(botId) }}
                  </span>
                </div>
              </div>
              
              <div class="detail-item">
                <label>Dify Apps:</label>
                <span v-if="config.difyAppIds.length === 0">None</span>
                <div v-else class="tag-list">
                  <span 
                    v-for="appId in config.difyAppIds" 
                    :key="appId" 
                    class="tag"
                  >
                    {{ getAppName(appId) }}
                  </span>
                </div>
              </div>
              
              <div class="detail-item">
                <label>Status:</label>
                <span :class="config.isActive ? 'status-active' : 'status-inactive'">
                  {{ config.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Resources -->
      <div class="config-section">
        <h2>Available Resources</h2>
        <div class="resources-grid">
          <div class="resource-card">
            <h3>Chatwoot Accounts</h3>
            <div v-if="availableResources.chatwootAccounts.length === 0" class="no-resources">
              No accounts available
            </div>
            <div v-else class="resource-list">
              <div 
                v-for="account in availableResources.chatwootAccounts" 
                :key="account.id" 
                class="resource-item"
              >
                <span>{{ account.name }}</span>
                <FormButtonComponent
                  @click="testConnection('chatwoot', account.id)"
                  variant="outline"
                  size="small"
                  text="Test"
                />
              </div>
            </div>
          </div>
          
          <div class="resource-card">
            <h3>Telegram Bots</h3>
            <div v-if="availableResources.telegramBots.length === 0" class="no-resources">
              No bots available
            </div>
            <div v-else class="resource-list">
              <div 
                v-for="bot in availableResources.telegramBots" 
                :key="bot.id" 
                class="resource-item"
              >
                <span>{{ bot.name }}</span>
                <FormButtonComponent
                  @click="testConnection('telegram', bot.id)"
                  variant="outline"
                  size="small"
                  text="Test"
                />
              </div>
            </div>
          </div>
          
          <div class="resource-card">
            <h3>Dify Apps</h3>
            <div v-if="availableResources.difyApps.length === 0" class="no-resources">
              No apps available
            </div>
            <div v-else class="resource-list">
              <div 
                v-for="app in availableResources.difyApps" 
                :key="app.id" 
                class="resource-item"
              >
                <span>{{ app.name }}</span>
                <FormButtonComponent
                  @click="testConnection('dify', app.id)"
                  variant="outline"
                  size="small"
                  text="Test"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Configuration' : 'Create Configuration' }}</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="handleSave" class="modal-body">
          <div class="form-group">
            <label>Chatwoot Account *</label>
            <select v-model="form.chatwootAccountId" required>
              <option value="">Select an account</option>
              <option 
                v-for="account in availableResources.chatwootAccounts" 
                :key="account.id" 
                :value="account.id"
              >
                {{ account.name }} ({{ account.base_url }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Telegram Bots</label>
            <div class="checkbox-group">
              <label 
                v-for="bot in availableResources.telegramBots" 
                :key="bot.id" 
                class="checkbox-item"
              >
                <input 
                  type="checkbox" 
                  :value="bot.id" 
                  v-model="form.telegramBotIds"
                >
                <span>{{ bot.name }}</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Dify Apps</label>
            <div class="checkbox-group">
              <label 
                v-for="app in availableResources.difyApps" 
                :key="app.id" 
                class="checkbox-item"
              >
                <input 
                  type="checkbox" 
                  :value="app.id" 
                  v-model="form.difyAppIds"
                >
                <span>{{ app.name }}</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="form.isActive">
              <span>Active</span>
            </label>
          </div>
        </form>
        
        <div class="modal-footer">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'
import FormModalComponent from '../components/shared/FormModalComponent.vue'
import FormInputTextComponent from '../components/shared/FormInputTextComponent.vue'
import FormCheckBoxComponent from '../components/shared/FormCheckBoxComponent.vue'
import { ConfigurationService } from '../services'

export default {
  components: {
    FormButtonComponent,
    FormModalComponent,
    FormInputTextComponent,
    FormCheckBoxComponent
  },
  name: 'ConfigurationPage',
  data() {
    return {
      isLoading: false,
      isSaving: false,
      userConfigurations: [],
      availableResources: {
        chatwootAccounts: [],
        telegramBots: [],
        difyApps: []
      },
      showModal: false,
      isEdit: false,
      selectedConfig: null,
      form: {
        chatwootAccountId: '',
        telegramBotIds: [],
        difyAppIds: [],
        isActive: true
      },
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadConfigurations()
    this.loadAvailableResources()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        this.userPermissions = user.permissions || {}
      }
    },
    
    async loadConfigurations() {
      this.isLoading = true
      try {
        const response = await ConfigurationService.getUserConfigurations()
        
        if (response.data.success) {
          this.userConfigurations = response.data.data
        }
      } catch (error) {
        console.error('Failed to load configurations:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async loadAvailableResources() {
      try {
        const response = await ConfigurationService.getAvailableResources()
        
        if (response.data.success) {
          this.availableResources = response.data.data
        }
      } catch (error) {
        console.error('Failed to load available resources:', error)
      }
    },
    
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },
    
    openCreateModal() {
      this.isEdit = false
      this.selectedConfig = null
      this.form = {
        chatwootAccountId: '',
        telegramBotIds: [],
        difyAppIds: [],
        isActive: true
      }
      this.showModal = true
    },
    
    openEditModal(config) {
      this.isEdit = true
      this.selectedConfig = config
      this.form = {
        chatwootAccountId: config.chatwootAccount.id,
        telegramBotIds: [...config.telegramBotIds],
        difyAppIds: [...config.difyAppIds],
        isActive: config.isActive
      }
      this.showModal = true
    },
    
    closeModal() {
      this.showModal = false
      this.selectedConfig = null
    },
    
    async handleSave() {
      this.isSaving = true
      try {
        const response = this.isEdit 
          ? await ConfigurationService.update(this.selectedConfig.id, this.form)
          : await ConfigurationService.create(this.form)
        
        if (response.data.success) {
          this.closeModal()
          this.loadConfigurations()
        }
      } catch (error) {
        console.error('Failed to save configuration:', error)
      } finally {
        this.isSaving = false
      }
    },
    
    async deleteConfiguration(id) {
      const confirmed = await window.ToastService.confirmAsync(
        'Bạn có chắc chắn muốn xóa cấu hình này?',
        'Xác nhận xóa cấu hình'
      );
      
      if (!confirmed) return
      
      try {
        const response = await ConfigurationService.delete(id)
        
        if (response.data.success) {
          this.loadConfigurations()
        }
      } catch (error) {
        console.error('Failed to delete configuration:', error)
      }
    },
    
    async testConnection(type, id) {
      try {
        const response = await ConfigurationService.testConnection(type, id)
        
        if (response.data.success) {
          window.ToastService.success('Kiểm tra kết nối thành công!')
        } else {
          window.ToastService.error('Kiểm tra kết nối thất bại: ' + response.data.message)
        }
      } catch (error) {
        window.ToastService.handleError(error, 'Kiểm tra kết nối thất bại')
      }
    },
    
    getBotName(botId) {
      const bot = this.availableResources.telegramBots.find(b => b.id === botId)
      return bot ? bot.name : `Bot ${botId}`
    },
    
    getAppName(appId) {
      const app = this.availableResources.difyApps.find(a => a.id === appId)
      return app ? app.name : `App ${appId}`
    }
  }
}
</script>

<style scoped>
.configuration-page {
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

.configuration-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.config-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading i {
  font-size: 24px;
  margin-right: 10px;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
  display: block;
}

.config-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.config-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.config-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.config-actions {
  display: flex;
  gap: 8px;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.detail-item span {
  color: #333;
  font-size: 14px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  color: #2ecc71;
  font-weight: 600;
}

.status-inactive {
  color: #e74c3c;
  font-weight: 600;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.resource-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
}

.resource-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.no-resources {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.resource-item span {
  color: #333;
  font-size: 14px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
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

.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e1e5e9;
}

/* Button Styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
