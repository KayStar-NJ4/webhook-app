<template>
  <AdminLayout>
    <div class="logs-page">
      <div class="page-header">
        <h1>{{ $t('pages.logs.title') }}</h1>
        <p>{{ $t('pages.logs.description') }}</p>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>{{ $t('pages.logs.level') }}:</label>
          <FormSelectComponent
            v-model="filters.level"
            :options="levelOptions"
            @change="loadLogs"
          />
        </div>
        
        <div class="filter-group">
          <label>{{ $t('pages.logs.component') }}:</label>
          <FormInputTextComponent
            v-model="filters.component"
            :placeholder="$t('pages.logs.componentPlaceholder')"
            @input="loadLogs"
          />
        </div>
        
        <div class="filter-group">
          <FormButtonComponent
            @click="loadLogs"
            variant="primary"
            icon="fas fa-search"
            :text="$t('common.search')"
          />
        </div>
      </div>

      <!-- Logs Table -->
      <div class="logs-table">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('pages.logs.timestamp') }}</th>
              <th>{{ $t('pages.logs.level') }}</th>
              <th>{{ $t('pages.logs.component') }}</th>
              <th>{{ $t('pages.logs.message') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" :class="`log-row log-row--${log.level}`">
              <td>{{ formatDate(log.timestamp) }}</td>
              <td>
                <span class="log-level" :class="`log-level--${log.level}`">
                  {{ log.level.toUpperCase() }}
                </span>
              </td>
              <td>{{ log.component || '-' }}</td>
              <td class="log-message">{{ log.message }}</td>
              <td>
                <FormButtonComponent
                  @click="viewLogDetails(log)"
                  variant="outline"
                  size="sm"
                  icon="fas fa-eye"
                  :text="$t('common.view')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <FormButtonComponent
          @click="previousPage"
          :disabled="currentPage === 1"
          variant="outline"
          icon="fas fa-chevron-left"
          :text="$t('common.previous')"
        />
        <span class="page-info">
          {{ $t('common.page') }} {{ currentPage }} {{ $t('common.of') }} {{ totalPages }}
        </span>
        <FormButtonComponent
          @click="nextPage"
          :disabled="currentPage === totalPages"
          variant="outline"
          icon="fas fa-chevron-right"
          :text="$t('common.next')"
        />
      </div>

      <!-- Log Details Modal -->
      <FormModalComponent
        :show="showLogModal"
        @update:show="showLogModal = $event"
        :title="$t('pages.logs.details')"
        size="lg"
      >
        <div v-if="selectedLog" class="log-details">
          <div class="detail-row">
            <label>{{ $t('pages.logs.timestamp') }}:</label>
            <span>{{ formatDate(selectedLog.timestamp) }}</span>
          </div>
          <div class="detail-row">
            <label>{{ $t('pages.logs.level') }}:</label>
            <span class="log-level" :class="`log-level--${selectedLog.level}`">
              {{ selectedLog.level.toUpperCase() }}
            </span>
          </div>
          <div class="detail-row">
            <label>{{ $t('pages.logs.component') }}:</label>
            <span>{{ selectedLog.component || '-' }}</span>
          </div>
          <div class="detail-row">
            <label>{{ $t('pages.logs.message') }}:</label>
            <div class="log-message-full">{{ selectedLog.message }}</div>
          </div>
          <div v-if="selectedLog.stack" class="detail-row">
            <label>{{ $t('pages.logs.stack') }}:</label>
            <pre class="log-stack">{{ selectedLog.stack }}</pre>
          </div>
          <div v-if="selectedLog.metadata" class="detail-row">
            <label>{{ $t('pages.logs.metadata') }}:</label>
            <pre class="log-metadata">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
          </div>
        </div>
      </FormModalComponent>
    </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from '../layouts/AdminLayout.vue'
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'
import FormModalComponent from '../components/shared/FormModalComponent.vue'
import FormInputTextComponent from '../components/shared/FormInputTextComponent.vue'
import FormSelectComponent from '../components/shared/FormSelectComponent.vue'

export default {
  name: 'LogsPage',
  components: {
    AdminLayout,
    FormButtonComponent,
    FormModalComponent,
    FormInputTextComponent,
    FormSelectComponent
  },
  data() {
    return {
      logs: [],
      selectedLog: null,
      showLogModal: false,
      currentPage: 1,
      totalPages: 1,
      filters: {
        level: '',
        component: ''
      },
      levelOptions: [
        { value: '', text: this.$t('common.all') },
        { value: 'error', text: 'ERROR' },
        { value: 'warn', text: 'WARN' },
        { value: 'info', text: 'INFO' },
        { value: 'debug', text: 'DEBUG' }
      ]
    }
  },
  mounted() {
    this.loadLogs()
  },
  methods: {
    async loadLogs() {
      try {
        this.isLoading = true
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: 20,
          ...this.filters
        })
        
        const response = await fetch(`/api/logs?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load logs')
        }
        
        const data = await response.json()
        this.logs = data.logs || []
        this.totalPages = data.totalPages || 1
      } catch (error) {
        console.error('Error loading logs:', error)
        this.$toast.error(this.$t('pages.logs.loadError'))
      } finally {
        this.isLoading = false
      }
    },
    
    viewLogDetails(log) {
      this.selectedLog = log
      this.showLogModal = true
    },
    
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.loadLogs()
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.loadLogs()
      }
    },
    
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString()
    }
  }
}
</script>

<style scoped>
.logs-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  margin: 0;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 500;
  color: #333;
}

.logs-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.log-row--error {
  background: #fff5f5;
}

.log-row--warn {
  background: #fffbf0;
}

.log-row--info {
  background: #f0f9ff;
}

.log-row--debug {
  background: #f8f9fa;
}

.log-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-level--error {
  background: #fee2e2;
  color: #dc2626;
}

.log-level--warn {
  background: #fef3c7;
  color: #d97706;
}

.log-level--info {
  background: #dbeafe;
  color: #2563eb;
}

.log-level--debug {
  background: #f3f4f6;
  color: #6b7280;
}

.log-message {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-info {
  color: #666;
  font-weight: 500;
}

.log-details {
  padding: 20px;
}

.detail-row {
  margin-bottom: 15px;
}

.detail-row label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.log-message-full {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.log-stack,
.log-metadata {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
