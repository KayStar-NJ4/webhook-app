<template>
  <div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12" :class="{'overlay-wrapper' : is_loading}">
          <div class="overlay" v-if="is_loading">
            <i class="fas fa-3x fa-spinner fa-spin"></i>
            <div class="text-bold pt-2">Loading...</div>
          </div>

          <div class="card">
            <div class="card-header d-flex align-items-center">
              <h3 class="card-title flex-grow-1">Quản lý liên kết Platform</h3>
              <button 
                v-if="hasPermission('platform_mappings', 'create')"
                class="btn btn-success float-right"
                @click="handleAdd"
                data-toggle="modal"
                data-target="#form-modal"
              >
                <i class="fa fa-plus"></i> Thêm mới
              </button>
            </div>

            <div class="card-body">
              <!-- Search and filters -->
              <div class="row form border-bottom mb-3">
                <div class="col-md-4 col-sm-6">
                  <form-input-text-component
                    v-model="params.search"
                    label="Tìm kiếm"
                    placeholder="Tìm kiếm..."
                    @update:modelValue="debouncedSearch"
                  />
                </div>
                <div class="col-md-3 col-sm-6">
                  <form-select-component
                    v-model="params.is_active"
                    label="Trạng thái"
                    :options="statusOptions"
                    @update:modelValue="handleStatusChange"
                  />
                </div>
              </div>

              <!-- Table -->
              <div class="row col-12 overflow-auto">
                <table class="table table-bordered table-hover">
                  <thead class="table-header">
                  <tr>
                    <th style="width: 80px;"></th>
                    <th class="text-center text-nowrap">Telegram Bot</th>
                    <th class="text-center text-nowrap">Chatwoot Account</th>
                    <th class="text-center text-nowrap">Dify App</th>
                    <th class="text-center text-nowrap">Trạng thái</th>
                    <th class="text-center text-nowrap">Ngày tạo</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          v-if="hasPermission('platform_mappings', 'read')"
                          class="btn btn-sm btn-info"
                          @click="testConnection(item)"
                          title="Test kết nối"
                        >
                          <i class="fa fa-plug"></i>
                        </button>
                        <button 
                          v-if="hasPermission('platform_mappings', 'update')"
                          class="btn btn-sm btn-warning"
                          @click="handleEdit(item)"
                          data-toggle="modal"
                          data-target="#form-modal"
                          title="Sửa"
                        >
                          <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('platform_mappings', 'delete')"
                          class="btn btn-sm btn-danger"
                          @click="showDeleteConfirm(item)"
                          title="Xóa"
                        >
                          <i class="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                    <td class="align-middle">{{ item.telegram_bot_name || 'N/A' }}</td>
                    <td class="align-middle">{{ item.chatwoot_account_name || 'N/A' }}</td>
                    <td class="align-middle">{{ item.dify_app_name || 'N/A' }}</td>
                    <td class="align-middle text-center">
                      <span 
                        class="badge" 
                        :class="item.is_active ? 'badge-success' : 'badge-danger'"
                      >
                        {{ item.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                      </span>
                    </td>
                    <td class="align-middle text-center">
                      {{ formatDate(item.created_at) }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination and sorting -->
              <div class="row mt-3">
                <div class="col-md-6">
                  <div v-if="pagination.total > 0" class="d-flex align-items-center">
                    <div class="mr-3">
                      <label class="mr-2">Số bản ghi:</label>
                      <select 
                        v-model="params.limit" 
                        @change="handleLimitChange"
                        class="form-control form-control-sm d-inline-block" 
                        style="width: auto;"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                    <div class="mr-3">
                      <label class="mr-2">Sắp xếp:</label>
                      <select 
                        v-model="params.sortBy" 
                        @change="handleSortChange"
                        class="form-control form-control-sm d-inline-block" 
                        style="width: auto;"
                      >
                        <option value="created_at.desc">Mới nhất</option>
                        <option value="created_at.asc">Cũ nhất</option>
                        <option value="platform_type.asc">Loại A-Z</option>
                        <option value="platform_type.desc">Loại Z-A</option>
                      </select>
                    </div>
                    <div>
                      <span class="text-muted">
                        Hiển thị {{ pagination.total }} bản ghi
                      </span>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-flex justify-content-end">
                    <div class="text-right">
                      <div class="pagination-wrapper" style="max-width: 300px; overflow: hidden;">
                        <paginate-component
                          :totalPages="pagination.last_page"
                          :currentPage="params.page"
                          :perPage="params.limit"
                          @update:currentPage="handlePageChange"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div class="modal fade" id="form-modal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">{{ isEditing ? 'Chỉnh sửa liên kết Platform' : 'Thêm mới liên kết Platform' }}</h4>
            <button type="button" class="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <platform-mapping-form-component
              :key="selectedItem ? selectedItem.id : 'new'"
              :item="selectedItem"
              :available-platforms="availablePlatforms"
              @saved="handleSaved"
              @cancelled="handleCancelled"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Test Results Modal -->
    <div class="modal fade" id="test-modal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Kết quả test kết nối</h4>
            <button type="button" class="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="testLoading" class="text-center">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
              <p class="mt-2">Đang test kết nối...</p>
            </div>
            <div v-else-if="testResults" class="test-results">
              <div class="row">
                <div class="col-md-4">
                  <div class="test-section">
                    <h5><i class="fab fa-telegram text-primary"></i> Telegram Bot</h5>
                    <div :class="['test-result', testResults.tests?.telegram?.success ? 'success' : 'error']">
                      <i :class="testResults.tests?.telegram?.success ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                      <span>{{ testResults.tests?.telegram?.success ? testResults.tests.telegram.message : testResults.tests?.telegram?.error || 'Không có dữ liệu' }}</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="test-section">
                    <h5><i class="fas fa-comments text-success"></i> Chatwoot Account</h5>
                    <div :class="['test-result', testResults.tests?.chatwoot?.success ? 'success' : 'error']">
                      <i :class="testResults.tests?.chatwoot?.success ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                      <span>{{ testResults.tests?.chatwoot?.success ? testResults.tests.chatwoot.message : testResults.tests?.chatwoot?.error || 'Không có dữ liệu' }}</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="test-section">
                    <h5><i class="fas fa-robot text-warning"></i> Dify App</h5>
                    <div :class="['test-result', testResults.tests?.dify?.success ? 'success' : 'error']">
                      <i :class="testResults.tests?.dify?.success ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                      <span>{{ testResults.tests?.dify?.success ? testResults.tests.dify.message : testResults.tests?.dify?.error || 'Không có dữ liệu' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-3">
                <div class="alert" :class="testResults.overallSuccess ? 'alert-success' : 'alert-danger'">
                  <i :class="testResults.overallSuccess ? 'fa fa-check-circle' : 'fa fa-exclamation-triangle'"></i>
                  <strong>{{ testResults.overallSuccess ? 'Tất cả kết nối thành công!' : 'Có lỗi kết nối!' }}</strong>
                </div>
              </div>
              <div class="mt-2">
                <small class="text-muted">
                  <strong>Debug info:</strong> 
                  Mapping ID: {{ testResults.mappingId }}, 
                  Timestamp: {{ testResults.timestamp }}
                </small>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <i class="fa fa-info-circle fa-2x"></i>
              <p>Chưa có kết quả test</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlatformMappingListComponent',
  props: {
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      is_loading: false,
      items: [],
      availablePlatforms: null,
      selectedItem: null,
      isEditing: false,
      params: {
        page: 1,
        limit: 10,
        search: '',
        is_active: '',
        sortBy: 'created_at.desc'
      },
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
      },
      statusOptions: [
        { value: '', label: 'Tất cả' },
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Không hoạt động' }
      ],
      searchTimeout: null,
      testLoading: false,
      testResults: null
    }
  },
  mounted() {
    this.loadData()
    this.loadAvailablePlatforms()
    
    // Add event listener for modal close
    $('#form-modal').on('hidden.bs.modal', () => {
      this.handleModalClose()
    })
  },
  methods: {
    async loadData() {
      this.is_loading = true
      try {
        const response = await window.AdminService.getPlatformMappings(this.params)
        if (response.data.success) {
          this.items = response.data.data.data || response.data.data
          this.pagination = response.data.data.pagination || {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: this.items.length,
            from: this.items.length > 0 ? 1 : 0,
            to: this.items.length
          }
        }
      } catch (error) {
        console.error('Failed to load platform mappings:', error)
        window.ToastService.error('Lỗi khi tải dữ liệu: ' + error.message)
      } finally {
        this.is_loading = false
      }
    },

    async loadAvailablePlatforms() {
      try {
        const response = await window.AdminService.getAvailablePlatforms()
        if (response.data.success) {
          this.availablePlatforms = response.data.data
        }
      } catch (error) {
        console.error('Failed to load available platforms:', error)
      }
    },

    debouncedSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.params.page = 1
        this.loadData()
      }, 500)
    },

    handleStatusChange() {
      this.params.page = 1
      this.loadData()
    },

    handleSortChange() {
      this.params.page = 1
      this.loadData()
    },

    handlePageChange(page) {
      this.params.page = page
      this.loadData()
    },

    handleAdd() {
      this.selectedItem = null
      this.isEditing = false
    },

    handleEdit(item) {
      this.selectedItem = { ...item }
      this.isEditing = true
    },

    async showDeleteConfirm(item) {
      if (confirm(`Bạn có chắc chắn muốn xóa liên kết này?`)) {
        try {
          await window.AdminService.deletePlatformMapping(item.id)
          window.ToastService.success('Xóa liên kết thành công!')
          this.loadData()
        } catch (error) {
          window.ToastService.error('Lỗi khi xóa liên kết: ' + error.message)
        }
      }
    },

    handleSaved() {
      $('#form-modal').modal('hide')
      this.loadData()
    },

    handleCancelled() {
      $('#form-modal').modal('hide')
    },

    handleModalClose() {
      // Reset form state when modal is closed
      this.selectedItem = null
      this.isEditing = false
    },

    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    },

    async testConnection(item) {
      this.testLoading = true
      this.testResults = null
      $('#test-modal').modal('show')
      
      try {
        console.log('Testing connection for item:', item)
        const response = await window.AdminService.testPlatformMappingConnection(item.id)
        console.log('Test connection response:', response)
        
        if (response.data.success) {
          this.testResults = response.data.data
          console.log('Test results set:', this.testResults)
          window.ToastService.success('Test kết nối hoàn thành!')
        } else {
          console.error('Test connection failed:', response.data.error)
          window.ToastService.error('Lỗi khi test kết nối: ' + response.data.error)
        }
      } catch (error) {
        console.error('Failed to test connection:', error)
        window.ToastService.error('Lỗi khi test kết nối: ' + error.message)
      } finally {
        this.testLoading = false
      }
    }
  }
}
</script>

<style scoped>
.overlay-wrapper {
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.table-header {
  background-color: #f8f9fa;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.btn-group .btn {
  margin-right: 2px;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

.test-results {
  padding: 15px 0;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h5 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.test-result {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.test-result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.test-result i {
  font-size: 16px;
}
</style>
