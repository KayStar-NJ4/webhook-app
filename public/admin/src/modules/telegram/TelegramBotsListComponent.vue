<template>
  <div class="telegram-bots-list">
    <div class="list-header">
      <h2>Telegram Bots</h2>
      <FormButtonComponent
        v-if="hasPermission('telegram', 'create')"
        @click="$emit('create')"
        variant="primary"
        icon="fab fa-telegram"
        text="New Bot"
      />
    </div>

    <div v-if="isLoading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading bots...</span>
    </div>

    <div v-else-if="bots.length === 0" class="no-data">
      <i class="fab fa-telegram"></i>
      <h3>No Telegram Bots</h3>
      <p>Create your first Telegram bot to get started</p>
      <FormButtonComponent
        v-if="hasPermission('telegram', 'create')"
        @click="$emit('create')"
        variant="primary"
        icon="fab fa-telegram"
        text="Create Bot"
      />
    </div>

    <div v-else class="bots-grid">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="bot-card"
      >
        <div class="bot-header">
          <div class="bot-info">
            <h3>{{ bot.name }}</h3>
            <p class="bot-api-url">{{ bot.api_url }}</p>
          </div>
          <div class="bot-status">
            <span :class="bot.is_active ? 'status-active' : 'status-inactive'">
              {{ bot.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="bot-details">
          <div class="detail-item">
            <label>Bot Token:</label>
            <span class="token-display">{{ maskToken(bot.bot_token) }}</span>
          </div>
          <div v-if="bot.webhook_url" class="detail-item">
            <label>Webhook URL:</label>
            <span class="webhook-url">{{ bot.webhook_url }}</span>
          </div>
          <div class="detail-item">
            <label>Created:</label>
            <span>{{ formatDate(bot.created_at) }}</span>
          </div>
        </div>

        <div class="bot-actions">
          <FormButtonComponent
            @click="$emit('test', bot.id)"
            variant="outline"
            size="small"
            icon="fas fa-plug"
            text="Test"
          />
          <FormButtonComponent
            v-if="hasPermission('telegram', 'update')"
            @click="$emit('edit', bot)"
            variant="outline"
            size="small"
            icon="fas fa-edit"
            text="Edit"
          />
          <FormButtonComponent
            v-if="hasPermission('telegram', 'manage_webhooks')"
            @click="$emit('webhook', bot)"
            variant="info"
            size="small"
            icon="fas fa-link"
            text="Webhook"
          />
          <FormButtonComponent
            v-if="hasPermission('telegram', 'delete')"
            @click="handleDelete(bot)"
            variant="danger"
            size="small"
            icon="fas fa-trash"
            text="Delete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormButtonComponent from '../../components/shared/FormButtonComponent.vue'

export default {
  name: 'TelegramBotsListComponent',
  components: {
    FormButtonComponent
  },
  props: {
    bots: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['create', 'edit', 'delete', 'test', 'webhook'],
  methods: {
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },

    handleDelete(bot) {
      if (confirm(`Are you sure you want to delete bot "${bot.name}"?`)) {
        this.$emit('delete', bot.id)
      }
    },

    maskToken(token) {
      if (!token) return ''
      return token.substring(0, 10) + '...' + token.substring(token.length - 10)
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.telegram-bots-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e5e9;
}

.list-header h2 {
  color: #333;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
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

.bots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.bot-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  transition: all 0.3s ease;
}

.bot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.bot-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.bot-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.bot-api-url {
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

.bot-details {
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

.token-display {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.webhook-url {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.bot-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .bots-grid {
    grid-template-columns: 1fr;
  }
  
  .bot-actions {
    justify-content: center;
  }
}
</style>
