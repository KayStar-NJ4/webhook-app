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
              <h3 class="card-title flex-grow-1">
                <i class="fas fa-globe mr-2"></i>
                Quản lý Web Apps
              </h3>
              <button 
                v-if="hasPermission('web', 'create')"
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
                  <div class="form-group">
                    <label>Tìm kiếm</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="params.search" 
                      placeholder="Tìm kiếm theo tên hoặc domain..."
                      autocomplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="form-group">
                    <label>Trạng thái</label>
                    <select class="form-control" v-model="params.is_active">
                      <option value="">Tất cả</option>
                      <option value="true">Hoạt động</option>
                      <option value="false">Không hoạt động</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Table -->
              <div class="row col-12 overflow-auto">
                <table class="table table-bordered table-hover">
                  <thead class="table-header">
                  <tr>
                    <th style="width: 120px;"></th>
                    <th class="text-center text-nowrap">Tên Web App</th>
                    <th class="text-center text-nowrap">Domain</th>
                    <th class="text-center text-nowrap">API Key</th>
                    <th class="text-center text-nowrap">Trạng thái</th>
                    <th class="text-center text-nowrap">Ngày tạo</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          v-if="hasPermission('web', 'update')"
                          class="btn btn-sm btn-warning"
                          @click="handleEdit(item)"
                          data-toggle="modal"
                          data-target="#form-modal"
                          title="Sửa"
                        >
                          <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('web', 'read')"
                          class="btn btn-sm btn-info"
                          @click="viewStatistics(item)"
                          title="Thống kê"
                        >
                          <i class="fas fa-chart-bar"></i>
                        </button>
                        <button 
                          v-if="hasPermission('web', 'delete')"
                          class="btn btn-sm btn-danger"
                          @click="showDeleteConfirm(item)"
                          title="Xóa"
                        >
                          <i class="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                    <td class="align-middle">{{ item.name || '' }}</td>
                    <td class="align-middle">{{ item.domain || '' }}</td>
                    <td class="align-middle">
                      <code>{{ item.api_key ? '***' + item.api_key.slice(-8) : '' }}</code>
                      <button 
                        class="btn btn-xs btn-link"
                        @click="copyApiKey(item.api_key)"
                        title="Copy API Key"
                      >
                        <i class="fas fa-copy"></i>
                      </button>
                    </td>
                    <td class="align-middle text-center">
                      <span :class="item.is_active ? 'badge badge-success' : 'badge badge-danger'">
                        {{ item.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                      </span>
                    </td>
                    <td class="align-middle">{{ formatDate(item.created_at) }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination and sorting -->
              <div class="row mt-3">
                <div class="col-md-6">
                  <div v-if="meta.total_item > 0" class="d-flex align-items-center">
                    <div class="mr-3">
                      <label class="mr-2">Số bản ghi:</label>
                      <select 
                        v-model="params.limit" 
                        @change="updateLimit($event.target.value)"
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
                        v-model="params.sort_by" 
                        @change="updateSortBy($event.target.value)"
                        class="form-control form-control-sm d-inline-block" 
                        style="width: auto;"
                      >
                        <option value="created_at.desc">Mới nhất</option>
                        <option value="created_at.asc">Cũ nhất</option>
                        <option value="name.asc">Tên A-Z</option>
                        <option value="name.desc">Tên Z-A</option>
                      </select>
                    </div>
                    <div>
                      <span class="text-muted">
                        Hiển thị {{ meta.total_item }} bản ghi
                      </span>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <pagination-component
                    :current="meta.current_page"
                    :total="meta.total_page"
                    :per-page="params.limit"
                    @page-changed="changePage"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WebAppsListComponent',
  components: {
    FormInputTextComponent: window.FormInputTextComponent
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      is_loading: false,
      items: [],
      meta: {
        current_page: 1,
        total_page: 1,
        total_item: 0,
        limit: 10
      },
      params: {
        page: 1,
        limit: 10,
        search: '',
        is_active: '',
        sort_by: 'created_at.desc'
      }
    }
  },
  watch: {
    'params.search': {
      handler() {
        this.debounceSearch()
      }
    },
    'params.is_active': {
      handler() {
        this.load()
      }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    hasPermission(resource, action) {
      const permissions = this.userPermissions || {}
      return permissions[resource] && permissions[resource].some(p => p.action === action)
    },

    async load() {
      this.is_loading = true
      try {
        const response = await window.WebService.getList(this.params)
        
        if (response.data.success) {
          const data = response.data.data
          this.items = data.apps || []
          this.meta = {
            current_page: data.pagination.page,
            total_page: data.pagination.pages,
            total_item: data.pagination.total,
            limit: data.pagination.limit
          }
        }
      } catch (error) {
        window.ToastService.error('Lỗi khi tải danh sách web apps')
      } finally {
        this.is_loading = false
      }
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.load()
      }, 500)
    },

    changePage(page) {
      this.params.page = page
      this.load()
    },

    updateLimit(limit) {
      this.params.limit = parseInt(limit)
      this.params.page = 1
      this.load()
    },

    updateSortBy(sortBy) {
      this.params.sort_by = sortBy
      this.load()
    },

    handleAdd() {
      this.$emit('create')
    },

    handleEdit(item) {
      this.$emit('edit', item)
    },

    showDeleteConfirm(item) {
      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa web app "${item.name}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          this.$emit('delete', item)
        }
      })
    },

    async viewStatistics(item) {
      try {
        this.is_loading = true
        const response = await window.WebService.getStatistics(item.id)
        if (response.data.success) {
          const stats = response.data.data
          this.showStatisticsModal(item, stats)
        }
      } catch (error) {
        window.ToastService.error('Lỗi khi tải thống kê')
      } finally {
        this.is_loading = false
      }
    },

    showStatisticsModal(item, stats) {
      const modalId = `stats-${Date.now()}`
      const modalHTML = `
        <div id="${modalId}" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: white;
            border-radius: 8px;
            padding: 0;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px 24px;
              color: white;
            ">
              <h4 style="margin: 0; font-size: 20px; font-weight: 600;">
                <i class="fas fa-chart-bar"></i> Thống kê
              </h4>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">${item.name}</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 24px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                <!-- Total Conversations Card -->
                <div style="
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 20px;
                  border-radius: 8px;
                  color: white;
                  text-align: center;
                ">
                  <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">
                    ${stats.total_conversations || 0}
                  </div>
                  <div style="font-size: 13px; opacity: 0.9;">
                    <i class="fas fa-comments"></i> Tổng Conversations
                  </div>
                </div>
                
                <!-- Active Conversations Card -->
                <div style="
                  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                  padding: 20px;
                  border-radius: 8px;
                  color: white;
                  text-align: center;
                ">
                  <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">
                    ${stats.active_conversations || 0}
                  </div>
                  <div style="font-size: 13px; opacity: 0.9;">
                    <i class="fas fa-comment-dots"></i> Đang hoạt động
                  </div>
                </div>
                
                <!-- Total Messages Card -->
                <div style="
                  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                  padding: 20px;
                  border-radius: 8px;
                  color: white;
                  text-align: center;
                ">
                  <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">
                    ${stats.total_messages || 0}
                  </div>
                  <div style="font-size: 13px; opacity: 0.9;">
                    <i class="fas fa-envelope"></i> Tổng Messages
                  </div>
                </div>
              </div>
              
              <!-- Additional Info -->
              <div style="
                margin-top: 20px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #667eea;
              ">
                <div style="color: #666; font-size: 13px; line-height: 1.6;">
                  <div style="margin-bottom: 8px;">
                    <strong>Domain:</strong> <code style="background: white; padding: 2px 6px; border-radius: 3px;">${item.domain}</code>
                  </div>
                  <div>
                    <strong>Trạng thái:</strong> 
                    <span style="
                      display: inline-block;
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 11px;
                      background: ${item.is_active ? '#d4edda' : '#f8d7da'};
                      color: ${item.is_active ? '#155724' : '#721c24'};
                    ">
                      ${item.is_active ? '✅ Hoạt động' : '❌ Không hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="
              padding: 16px 24px;
              background: #f8f9fa;
              border-top: 1px solid #e9ecef;
              display: flex;
              justify-content: flex-end;
            ">
              <button id="close-stats-${modalId}" style="
                padding: 10px 24px;
                border: none;
                background: #667eea;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
              " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
                Đóng
              </button>
            </div>
          </div>
        </div>
      `

      document.body.insertAdjacentHTML('beforeend', modalHTML)
      const modal = document.getElementById(modalId)
      const closeBtn = document.getElementById(`close-stats-${modalId}`)

      const cleanup = () => {
        if (modal && modal.parentNode) {
          modal.parentNode.removeChild(modal)
        }
      }

      closeBtn.addEventListener('click', cleanup)
      modal.addEventListener('click', (e) => { if (e.target === modal) cleanup() })
      
      const handleEsc = (e) => { 
        if (e.key === 'Escape') { 
          cleanup()
          document.removeEventListener('keydown', handleEsc)
        } 
      }
      document.addEventListener('keydown', handleEsc)
    },

    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        const modalId = `confirm-${Date.now()}`
        
        const modalHTML = `
          <div id="${modalId}" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background: white;
              border-radius: 8px;
              padding: 0;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
              overflow: hidden;
            ">
              <!-- Header -->
              <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px 24px;
                color: white;
              ">
                <h4 style="margin: 0; font-size: 18px; font-weight: 600;">
                  <i class="fas fa-exclamation-triangle"></i> ${title}
                </h4>
              </div>
              
              <!-- Body -->
              <div style="padding: 24px;">
                <p style="margin: 0; color: #666; line-height: 1.6; font-size: 15px;">${message}</p>
              </div>
              
              <!-- Footer -->
              <div style="
                padding: 16px 24px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
              ">
                <button id="cancel-${modalId}" style="
                  padding: 8px 20px;
                  border: 1px solid #ddd;
                  background: white;
                  color: #666;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: all 0.2s;
                " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                  ${cancelText}
                </button>
                <button id="confirm-${modalId}" style="
                  padding: 8px 20px;
                  border: none;
                  background: #dc3545;
                  color: white;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: all 0.2s;
                " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
                  ${confirmText}
                </button>
              </div>
            </div>
          </div>
        `
        
        document.body.insertAdjacentHTML('beforeend', modalHTML)
        
        const modal = document.getElementById(modalId)
        const cancelBtn = document.getElementById(`cancel-${modalId}`)
        const confirmBtn = document.getElementById(`confirm-${modalId}`)
        
        const cleanup = () => {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal)
          }
        }
        
        const handleCancel = () => {
          cleanup()
          resolve(false)
        }
        
        const handleConfirm = () => {
          cleanup()
          resolve(true)
        }
        
        cancelBtn.addEventListener('click', handleCancel)
        confirmBtn.addEventListener('click', handleConfirm)
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            handleCancel()
          }
        })
        
        const handleEsc = (e) => {
          if (e.key === 'Escape') {
            handleCancel()
            document.removeEventListener('keydown', handleEsc)
          }
        }
        document.addEventListener('keydown', handleEsc)
      })
    },

    copyApiKey(apiKey) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(apiKey).then(() => {
          window.ToastService.success('Đã copy API Key')
        })
      } else {
        // Fallback
        const textArea = document.createElement('textarea')
        textArea.value = apiKey
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        window.ToastService.success('Đã copy API Key')
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN')
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
</style>
