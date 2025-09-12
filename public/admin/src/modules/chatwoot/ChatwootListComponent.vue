<template>
  <div class="chatwoot-list">
    <div class="list-header">
      <h2>{{ $t('chatwoot.list') }}</h2>
      <FormButtonComponent
        v-if="hasPermission('chatwoot', 'create')"
        @click="$emit('create')"
        variant="primary"
        icon="fas fa-comments"
        :text="$t('chatwoot.create')"
      />
    </div>

    <div v-if="isLoading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ $t('common.loading') }}</span>
    </div>

    <div v-else-if="accounts.length === 0" class="no-data">
      <i class="fas fa-comments"></i>
      <h3>{{ $t('chatwoot.noAccounts') }}</h3>
      <p>{{ $t('chatwoot.createFirst') }}</p>
      <FormButtonComponent
        v-if="hasPermission('chatwoot', 'create')"
        @click="$emit('create')"
        variant="primary"
        icon="fas fa-comments"
        :text="$t('chatwoot.create')"
      />
    </div>

    <div v-else class="accounts-grid">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="account-card"
      >
        <div class="account-header">
          <div class="account-info">
            <h3>{{ account.name }}</h3>
            <p class="account-url">{{ account.base_url }}</p>
          </div>
          <div class="account-status">
            <span :class="account.is_active ? 'status-active' : 'status-inactive'">
              {{ account.is_active ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
        </div>

        <div class="account-details">
          <div class="detail-item">
            <label>{{ $t('chatwoot.fields.accountId') }}:</label>
            <span>{{ account.account_id }}</span>
          </div>
          <div class="detail-item">
            <label>{{ $t('chatwoot.fields.inboxId') }}:</label>
            <span>{{ account.inbox_id }}</span>
          </div>
          <div class="detail-item">
            <label>{{ $t('common.created') }}:</label>
            <span>{{ formatDate(account.created_at) }}</span>
          </div>
        </div>

        <div class="account-actions">
          <FormButtonComponent
            @click="$emit('test', account.id)"
            variant="outline"
            size="small"
            icon="fas fa-plug"
            :text="$t('common.test')"
          />
          <FormButtonComponent
            v-if="hasPermission('chatwoot', 'update')"
            @click="$emit('edit', account)"
            variant="outline"
            size="small"
            icon="fas fa-edit"
            :text="$t('common.edit')"
          />
          <FormButtonComponent
            v-if="hasPermission('chatwoot', 'delete')"
            @click="handleDelete(account)"
            variant="danger"
            size="small"
            icon="fas fa-trash"
            :text="$t('common.delete')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormButtonComponent from '../../components/shared/FormButtonComponent.vue'

export default {
  name: 'ChatwootListComponent',
  components: {
    FormButtonComponent
  },
  props: {
    accounts: {
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
  emits: ['create', 'edit', 'delete', 'test'],
  methods: {
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },

    handleDelete(account) {
      if (confirm(this.$t('chatwoot.messages.deleteConfirm'))) {
        this.$emit('delete', account.id)
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.chatwoot-list {
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

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.account-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  transition: all 0.3s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.account-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.account-url {
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

.account-details {
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

.account-actions {
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
  
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .account-actions {
    justify-content: center;
  }
}
</style>
