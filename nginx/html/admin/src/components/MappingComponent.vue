<template>
  <div class="mapping-management">
    <div class="page-header">
      <h2>{{ $t('mapping.title') }}</h2>
      <p class="page-description">{{ $t('mapping.description') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-error"></i>
        <p>{{ error }}</p>
        <button @click="loadMappings" class="btn btn-primary">
          {{ $t('common.retry') }}
        </button>
      </div>
    </div>

    <!-- Mappings List -->
    <div v-if="!loading && !error" class="mappings-container">
      <div v-if="mappings.length === 0" class="empty-state">
        <i class="icon-empty"></i>
        <h3>{{ $t('mapping.noMappings') }}</h3>
        <p>{{ $t('mapping.noMappingsDescription') }}</p>
        <button @click="createMapping" class="btn btn-primary">
          {{ $t('mapping.createMapping') }}
        </button>
      </div>

      <div v-else class="mappings-list">
        <div v-for="mapping in mappings" :key="mapping.configId" class="mapping-card">
          <div class="mapping-header">
            <div class="mapping-info">
              <h3>{{ mapping.chatwootAccountName }}</h3>
              <p class="mapping-url">{{ mapping.chatwootBaseUrl }}</p>
            </div>
            <div class="mapping-actions">
              <button @click="editMapping(mapping)" class="btn btn-secondary btn-sm">
                <i class="icon-edit"></i>
                {{ $t('common.edit') }}
              </button>
              <button @click="testMapping(mapping)" class="btn btn-info btn-sm">
                <i class="icon-test"></i>
                {{ $t('common.test') }}
              </button>
            </div>
          </div>

          <div class="mapping-content">
            <div class="mapping-section">
              <h4>{{ $t('mapping.telegramBots') }}</h4>
              <div v-if="mapping.telegramBotIds.length === 0" class="no-items">
                <p>{{ $t('mapping.noTelegramBots') }}</p>
              </div>
              <div v-else class="items-list">
                <div v-for="botId in mapping.telegramBotIds" :key="botId" class="item-tag">
                  <i class="icon-telegram"></i>
                  <span>{{ getTelegramBotName(botId) }}</span>
                </div>
              </div>
            </div>

            <div class="mapping-section">
              <h4>{{ $t('mapping.difyApps') }}</h4>
              <div v-if="mapping.difyAppIds.length === 0" class="no-items">
                <p>{{ $t('mapping.noDifyApps') }}</p>
              </div>
              <div v-else class="items-list">
                <div v-for="appId in mapping.difyAppIds" :key="appId" class="item-tag">
                  <i class="icon-dify"></i>
                  <span>{{ getDifyAppName(appId) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mapping-status">
            <span :class="['status-badge', mapping.isActive ? 'active' : 'inactive']">
              {{ mapping.isActive ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Mapping Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ $t('mapping.editMapping') }}</h3>
          <button @click="closeEditModal" class="btn-close">
            <i class="icon-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('mapping.chatwootAccount') }}</label>
            <div class="account-info">
              <strong>{{ editingMapping.chatwootAccountName }}</strong>
              <span class="account-url">{{ editingMapping.chatwootBaseUrl }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('mapping.selectTelegramBots') }}</label>
            <div class="multi-select">
              <div v-for="bot in availableTelegramBots" :key="bot.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :id="`bot-${bot.id}`"
                  :value="bot.id"
                  v-model="editingMapping.telegramBotIds"
                >
                <label :for="`bot-${bot.id}`">
                  <i class="icon-telegram"></i>
                  {{ bot.name }}
                  <span class="bot-token">{{ bot.token }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('mapping.selectDifyApps') }}</label>
            <div class="multi-select">
              <div v-for="app in availableDifyApps" :key="app.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :id="`app-${app.id}`"
                  :value="app.id"
                  v-model="editingMapping.difyAppIds"
                >
                <label :for="`app-${app.id}`">
                  <i class="icon-dify"></i>
                  {{ app.name }}
                  <span class="app-id">{{ app.appId }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="saveMapping" class="btn btn-primary" :disabled="saving">
            <i v-if="saving" class="icon-spinner"></i>
            {{ saving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Test Results Modal -->
    <div v-if="showTestModal" class="modal-overlay" @click="closeTestModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ $t('mapping.testResults') }}</h3>
          <button @click="closeTestModal" class="btn-close">
            <i class="icon-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="test-results">
            <div class="test-section">
              <h4>{{ $t('mapping.telegramTest') }}</h4>
              <div v-if="testResults.telegram" :class="['test-result', testResults.telegram.success ? 'success' : 'error']">
                <i :class="testResults.telegram.success ? 'icon-check' : 'icon-error'"></i>
                <span>{{ testResults.telegram.success ? testResults.telegram.message : testResults.telegram.error }}</span>
              </div>
              <div v-else class="test-result info">
                <i class="icon-info"></i>
                <span>{{ $t('mapping.noTelegramConfigured') }}</span>
              </div>
            </div>

            <div class="test-section">
              <h4>{{ $t('mapping.chatwootTest') }}</h4>
              <div v-if="testResults.chatwoot" :class="['test-result', testResults.chatwoot.success ? 'success' : 'error']">
                <i :class="testResults.chatwoot.success ? 'icon-check' : 'icon-error'"></i>
                <span>{{ testResults.chatwoot.success ? testResults.chatwoot.message : testResults.chatwoot.error }}</span>
              </div>
              <div v-else class="test-result info">
                <i class="icon-info"></i>
                <span>{{ $t('mapping.noChatwootConfigured') }}</span>
              </div>
            </div>

            <div class="test-section">
              <h4>{{ $t('mapping.difyTest') }}</h4>
              <div v-if="testResults.dify" :class="['test-result', testResults.dify.success ? 'success' : 'error']">
                <i :class="testResults.dify.success ? 'icon-check' : 'icon-error'"></i>
                <span>{{ testResults.dify.success ? testResults.dify.message : testResults.dify.error }}</span>
              </div>
              <div v-else class="test-result info">
                <i class="icon-info"></i>
                <span>{{ $t('mapping.noDifyConfigured') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeTestModal" class="btn btn-primary">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MappingComponent',
  data() {
    return {
      loading: false,
      error: null,
      mappings: [],
      availableTelegramBots: [],
      availableDifyApps: [],
      showEditModal: false,
      showTestModal: false,
      editingMapping: {
        configId: null,
        telegramBotIds: [],
        difyAppIds: []
      },
      testResults: {
        telegram: null,
        chatwoot: null,
        dify: null
      },
      saving: false
    }
  },
  mounted() {
    this.loadMappings()
    this.loadAvailableItems()
  },
  methods: {
    async loadMappings() {
      this.loading = true
      this.error = null
      
      try {
        const response = await this.$http.get('/api/admin/mappings')
        this.mappings = response.data.data || []
      } catch (error) {
        this.error = this.$t('mapping.loadError')
        console.error('Failed to load mappings:', error)
      } finally {
        this.loading = false
      }
    },

    async loadAvailableItems() {
      try {
        const [botsResponse, appsResponse] = await Promise.all([
          this.$http.get('/api/admin/mappings/available/telegram-bots'),
          this.$http.get('/api/admin/mappings/available/dify-apps')
        ])
        
        this.availableTelegramBots = botsResponse.data.data || []
        this.availableDifyApps = appsResponse.data.data || []
      } catch (error) {
        console.error('Failed to load available items:', error)
      }
    },

    editMapping(mapping) {
      this.editingMapping = {
        configId: mapping.configId,
        telegramBotIds: [...mapping.telegramBotIds],
        difyAppIds: [...mapping.difyAppIds]
      }
      this.showEditModal = true
    },

    async saveMapping() {
      this.saving = true
      
      try {
        await this.$http.put(`/api/admin/mappings/${this.editingMapping.configId}`, {
          telegramBotIds: this.editingMapping.telegramBotIds,
          difyAppIds: this.editingMapping.difyAppIds
        })
        
        this.$toast.success(this.$t('mapping.updateSuccess'))
        this.closeEditModal()
        this.loadMappings()
      } catch (error) {
        this.$toast.error(this.$t('mapping.updateError'))
        console.error('Failed to update mapping:', error)
      } finally {
        this.saving = false
      }
    },

    async testMapping(mapping) {
      try {
        const response = await this.$http.post(`/api/admin/platform-mappings/${mapping.id}/test-connection`)
        
        this.testResults = response.data.data.tests
        this.showTestModal = true
      } catch (error) {
        this.$toast.error(this.$t('mapping.testError'))
        console.error('Failed to test mapping:', error)
      }
    },

    closeEditModal() {
      this.showEditModal = false
      this.editingMapping = {
        configId: null,
        telegramBotIds: [],
        difyAppIds: []
      }
    },

    closeTestModal() {
      this.showTestModal = false
      this.testResults = {
        telegram: null,
        chatwoot: null,
        dify: null
      }
    },

    getTelegramBotName(botId) {
      const bot = this.availableTelegramBots.find(b => b.id === botId)
      return bot ? bot.name : `Bot ${botId}`
    },

    getDifyAppName(appId) {
      const app = this.availableDifyApps.find(a => a.id === appId)
      return app ? app.name : `App ${appId}`
    },

    createMapping() {
      // Redirect to configurations page to create new mapping
      this.$router.push('/admin/configurations')
    }
  }
}
</script>

<style scoped>
.mapping-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.page-description {
  color: #666;
  margin: 0;
}

.loading-container, .error-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 20px;
  color: #ccc;
}

.mappings-list {
  display: grid;
  gap: 20px;
}

.mapping-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.mapping-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.mapping-url {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.mapping-actions {
  display: flex;
  gap: 10px;
}

.mapping-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.mapping-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.no-items {
  color: #999;
  font-style: italic;
}

.items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.mapping-status {
  text-align: right;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
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
  font-weight: 500;
  color: #333;
}

.account-info {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.account-info strong {
  display: block;
  margin-bottom: 4px;
}

.account-url {
  font-size: 14px;
  color: #666;
}

.multi-select {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 8px;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  cursor: pointer;
  flex: 1;
}

.bot-token, .app-id {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-section h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 4px;
}

.test-result.success {
  background: #d4edda;
  color: #155724;
}

.test-result.error {
  background: #f8d7da;
  color: #721c24;
}

.test-result.info {
  background: #d1ecf1;
  color: #0c5460;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .mapping-content {
    grid-template-columns: 1fr;
  }
  
  .mapping-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .mapping-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
