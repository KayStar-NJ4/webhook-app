<template>
  <div class="telegram-bots-page">
    <TelegramBotsListComponent
      :bots="bots"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="deleteBot"
      @test="testConnection"
      @webhook="manageWebhook"
    />

    <TelegramBotFormComponent
      :isVisible="showModal"
      :bot="selectedBot"
      :isEdit="isEdit"
      :isSaving="isSaving"
      :errors="errors"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Webhook Management Modal -->
    <FormModalComponent
      :isVisible="showWebhookModal"
      title="Manage Webhook"
      size="medium"
      :loading="isWebhookLoading"
      @close="closeWebhookModal"
      @confirm="handleWebhookSave"
    >
      <div class="modal-form">
        <div class="webhook-info">
          <h4>Current Webhook Status</h4>
          <div v-if="webhookInfo" class="webhook-status">
            <div class="status-item">
              <label>URL:</label>
              <span>{{ webhookInfo.url || 'Not set' }}</span>
            </div>
            <div class="status-item">
              <label>Pending Updates:</label>
              <span>{{ webhookInfo.pending_update_count || 0 }}</span>
            </div>
            <div class="status-item">
              <label>Last Error:</label>
              <span>{{ webhookInfo.last_error_message || 'None' }}</span>
            </div>
          </div>
        </div>

        <FormInputTextComponent
          v-model="webhookForm.url"
          label="Webhook URL"
          placeholder="https://yourdomain.com/webhook/telegram"
          helpText="Enter the webhook URL for receiving updates"
        />

        <FormCheckBoxComponent
          v-model="webhookForm.drop_pending_updates"
          label="Drop Pending Updates"
          helpText="Clear pending updates when setting webhook"
        />
      </div>

      <template #footer>
        <FormButtonComponent
          @click="closeWebhookModal"
          variant="secondary"
          text="Cancel"
        />
        <FormButtonComponent
          @click="getWebhookInfo"
          variant="outline"
          icon="fas fa-sync"
          text="Refresh"
        />
        <FormButtonComponent
          @click="setWebhook"
          variant="primary"
          :loading="isWebhookLoading"
          text="Set Webhook"
        />
        <FormButtonComponent
          @click="deleteWebhook"
          variant="danger"
          :loading="isWebhookLoading"
          text="Delete Webhook"
        />
      </template>
    </FormModalComponent>
    
    <!-- Debug Component -->
    <DebugAuthComponent />
  </div>
</template>

<script>
import TelegramBotsListComponent from '../modules/telegram/TelegramBotsListComponent.vue'
import TelegramBotFormComponent from '../modules/telegram/TelegramBotFormComponent.vue'
import FormModalComponent from '../components/shared/FormModalComponent.vue'
import FormInputTextComponent from '../components/shared/FormInputTextComponent.vue'
import FormCheckBoxComponent from '../components/shared/FormCheckBoxComponent.vue'
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'
import { TelegramService } from '../services'
import AuthUtils from '../utils/auth'
import DebugAuthComponent from '../components/DebugAuthComponent.vue'

export default {
  name: 'TelegramBotsPage',
  components: {
    TelegramBotsListComponent,
    TelegramBotFormComponent,
    FormModalComponent,
    FormInputTextComponent,
    FormCheckBoxComponent,
    FormButtonComponent,
    DebugAuthComponent
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      isWebhookLoading: false,
      bots: [],
      showModal: false,
      showWebhookModal: false,
      isEdit: false,
      selectedBot: null,
      webhookInfo: null,
      webhookForm: {
        url: '',
        drop_pending_updates: false
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
    this.loadBots()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        this.userPermissions = user.permissions || {}
      }
    },

    async loadBots() {
      this.isLoading = true
      try {
        const response = await TelegramService.getList()
        
        if (response.data.success) {
          this.bots = response.data.data.bots || response.data.data
        }
      } catch (error) {
        console.error('❌ Failed to load bots:', error)
        console.error('❌ Error details:', error.response?.data)
        this.$toast?.error('Failed to load bots')
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
      this.selectedBot = null
      this.errors = {}
      this.showModal = true
    },

    openEditModal(bot) {
      this.isEdit = true
      this.selectedBot = bot
      this.errors = {}
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedBot = null
      this.errors = {}
    },

    async handleSave(formData) {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await TelegramService.update(this.selectedBot.id, formData)
          : await TelegramService.create(formData)
        
        if (response.data.success) {
          this.closeModal()
          this.loadBots()
          this.$toast?.success(response.data.message || 'Bot saved successfully')
        }
      } catch (error) {
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors
        } else {
          this.$toast?.error(error.response?.data?.message || 'Failed to save bot')
        }
      } finally {
        this.isSaving = false
      }
    },

    async deleteBot(id) {
      const confirmed = await window.ToastService.confirmAsync(
        'Bạn có chắc chắn muốn xóa bot này?',
        'Xác nhận xóa bot'
      );
      
      if (!confirmed) return
      
      try {
        const response = await TelegramService.delete(id)
        
        if (response.data.success) {
          this.loadBots()
          this.$toast?.success('Bot deleted successfully')
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || 'Failed to delete bot')
      }
    },

    async testConnection(id) {
      try {
        const response = await TelegramService.testConnection(id)
        
        if (response.data.success) {
          this.$toast?.success('Connection test successful!')
        } else {
          this.$toast?.error('Connection test failed: ' + response.data.message)
        }
      } catch (error) {
        this.$toast?.error('Connection test failed: ' + (error.response?.data?.message || 'Unknown error'))
      }
    },

    async manageWebhook(bot) {
      this.selectedBot = bot
      this.webhookForm.url = bot.webhook_url || ''
      this.webhookForm.drop_pending_updates = false
      this.showWebhookModal = true
      await this.getWebhookInfo()
    },

    closeWebhookModal() {
      this.showWebhookModal = false
      this.selectedBot = null
      this.webhookInfo = null
    },

    async getWebhookInfo() {
      if (!this.selectedBot) return
      
      this.isWebhookLoading = true
      try {
        const response = await TelegramService.getWebhookInfo(this.selectedBot.id)
        
        if (response.data.success) {
          this.webhookInfo = response.data.data
        }
      } catch (error) {
        this.$toast?.error('Failed to get webhook info')
      } finally {
        this.isWebhookLoading = false
      }
    },

    async setWebhook() {
      if (!this.selectedBot) return
      
      this.isWebhookLoading = true
      try {
        const response = await TelegramService.setWebhook(this.selectedBot.id, this.webhookForm)
        
        if (response.data.success) {
          this.$toast?.success('Webhook set successfully')
          await this.getWebhookInfo()
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || 'Failed to set webhook')
      } finally {
        this.isWebhookLoading = false
      }
    },

    async deleteWebhook() {
      if (!this.selectedBot) return
      
      this.isWebhookLoading = true
      try {
        const response = await TelegramService.deleteWebhook(this.selectedBot.id)
        
        if (response.data.success) {
          this.$toast?.success('Webhook deleted successfully')
          await this.getWebhookInfo()
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || 'Failed to delete webhook')
      } finally {
        this.isWebhookLoading = false
      }
    },

  }
}
</script>

<style scoped>
.telegram-bots-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.webhook-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.webhook-info h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.webhook-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.status-item label {
  color: #666;
  font-weight: 500;
}

.status-item span {
  color: #333;
  word-break: break-all;
}
</style>
