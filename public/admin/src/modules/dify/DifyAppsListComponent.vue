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
              <h3 class="card-title flex-grow-1">Quản lý Dify Apps</h3>
              <button 
                v-if="hasPermission('dify', 'create')"
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
                      placeholder="Tìm kiếm theo tên app..."
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
                    <th style="width: 80px;"></th>
                    <th class="text-center text-nowrap">Tên App</th>
                    <th class="text-center text-nowrap">API URL</th>
                    <th class="text-center text-nowrap">App ID</th>
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
                          v-if="hasPermission('dify', 'update')"
                          class="btn btn-sm btn-warning"
                          @click="handleEdit(item)"
                          data-toggle="modal"
                          data-target="#form-modal"
                          title="Sửa"
                        >
                          <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('dify', 'read')"
                          class="btn btn-sm btn-info"
                          @click="testConnection(item)"
                          title="Test kết nối"
                        >
                          <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('dify', 'delete')"
                          class="btn btn-sm btn-danger"
                          @click="showDeleteConfirm(item)"
                          title="Xóa"
                        >
                          <i class="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                    <td class="align-middle">{{ item.name || '' }}</td>
                    <td class="align-middle">{{ item.api_url || '' }}</td>
                    <td class="align-middle">{{ item.app_id || '' }}</td>
                    <td class="align-middle">{{ item.api_key ? '***' + item.api_key.slice(-4) : '' }}</td>
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
                  <div class="d-flex justify-content-end">
                    <div class="text-right">
                      <div class="pagination-wrapper" style="max-width: 300px; overflow: hidden;">
                        <paginate-component
                          :totalPages="meta.total_page"
                          :currentPage="params.page"
                          @page-change="doPaginate"
                          class="pagination-sm"
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

    <!-- Modal -->
    <div class="modal fade" id="form-modal" data-backdrop="static">
      <dify-app-form-component
          :object_info="selected_item"
          @create:success="fetchData"
      />
    </div>

  </div>
</template>

<script>
export default {
  name: 'DifyAppsListComponent',
  components: {
    PaginateComponent: window.PaginateComponent
  },
  props: {
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      is_loading: false,
      selected_id: 0,
      selected_item: {},
      params: {
        sort_by: 'created_at.desc',
        limit: '10',
        page: 1,
        search: '',
        is_active: ''
      },
      items: [],
      meta: {
        total_item: 0,
        total_page: 0,
      }
    }
  },
  mounted() {
    this.debouncedFetchData = this.debounce(this.fetchData, 500);
    this.debouncedFetchData();
  },
  computed: {
  },
  methods: {
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    doPaginate(pageNum) {
      if (pageNum >= 1 && pageNum <= this.meta.total_page) {
        this.params.page = pageNum;
        this.fetchData();
      }
    },
    async testConnection(app) {
      try {
        const response = await window.DifyService.testConnection(app.id);
        
        if (response.data.success && response.data.data.connected) {
          this.showTestResult(app, true, 'Kết nối thành công');
        } else {
          this.showTestResult(app, false, response.data.data?.message || 'Kết nối thất bại');
        }
      } catch (error) {
        this.showTestResult(app, false, 'Lỗi: ' + error.message);
      }
    },
    showTestResult(app, success, message) {
      const modalId = `test-result-${Date.now()}`;
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
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          ">
            <h4 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">
              Kết quả test kết nối
            </h4>
            <p style="margin: 0 0 16px 0; color: #666; line-height: 1.5;">
              App: <strong>${app.name}</strong>
            </p>
            <div style="
              padding: 16px;
              background: ${success ? '#d4edda' : '#f8d7da'};
              border: 1px solid ${success ? '#c3e6cb' : '#f5c6cb'};
              border-radius: 4px;
              color: ${success ? '#155724' : '#721c24'};
              margin-bottom: 16px;
            ">
              <strong>${success ? '✅ Thành công' : '❌ Thất bại'}</strong>
              <br>
              ${message}
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="close-test-${modalId}" style="
                padding: 8px 16px;
                border: none;
                background: #007bff;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">Đóng</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById(modalId);
      const closeBtn = document.getElementById(`close-test-${modalId}`);

      const cleanup = () => {
        if (modal && modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      };

      closeBtn.addEventListener('click', cleanup);
      modal.addEventListener('click', (e) => { if (e.target === modal) cleanup() });
      
      const handleEsc = (e) => { 
        if (e.key === 'Escape') { 
          cleanup();
          document.removeEventListener('keydown', handleEsc);
        } 
      };
      document.addEventListener('keydown', handleEsc);
    },
    updateLimit(value) {
      this.params.limit = value;
      this.params.page = 1;
      this.fetchData();
    },
    updateSortBy(value) {
      this.params.sort_by = value;
      this.params.page = 1;
      this.fetchData();
    },
    async fetchData() {
      this.is_loading = true;

      try {
        // Convert is_active to isActive for backend
        const params = { ...this.params };
        if (params.is_active !== '') {
          params.isActive = params.is_active;
        }
        delete params.is_active;
        
        const response = await window.DifyService.getList(params);
        
        if (response.data.success) {
          this.items = response.data.data.apps || [];
          this.meta.total_page = response.data.data.pagination?.pages || 0;
          this.meta.total_item = response.data.data.pagination?.total || 0;
        } else {
          this.items = [];
          this.meta.total_page = 0;
          this.meta.total_item = 0;
        }
      } catch (error) {
        this.items = [];
        this.meta.total_page = 0;
        this.meta.total_item = 0;
        
        if (error.response?.status === 401) {
          window.ToastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          window.ToastService.handleError(error, 'Có lỗi xảy ra khi tải danh sách Dify apps');
        }
      } finally {
        this.is_loading = false;
      }
    },
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('vi-VN');
    },
    handleAdd() {
      this.selected_id = 0;
      this.selected_item = {};
    },
    handleEdit(item) {
      this.selected_id = item.id;
      this.selected_item = {...item};
    },
    showDeleteConfirm(item) {
      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa app "${item.name}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          this.performDelete(item);
        }
      });
    },
    async performDelete(item) {
      try {
        this.is_loading = true;
        const response = await window.DifyService.deleteApp(item.id);
        
        if (response.data.success) {
          window.ToastService.success(`Đã xóa app "${item.name}" thành công`);
          this.fetchData();
        } else {
          window.ToastService.error(`Không thể xóa app "${item.name}"`);
        }
      } catch (error) {
        window.ToastService.handleError(error, `Có lỗi xảy ra khi xóa app "${item.name}"`);
      } finally {
        this.is_loading = false;
      }
    },
    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        // Tạo unique ID để tránh conflict
        const modalId = `confirm-${Date.now()}`;
        
        // Tạo modal HTML đơn giản
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
              padding: 24px;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            ">
              <h4 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">${title}</h4>
              <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancel-${modalId}" style="
                  padding: 8px 16px;
                  border: 1px solid #ddd;
                  background: white;
                  color: #666;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">${cancelText}</button>
                <button id="confirm-${modalId}" style="
                  padding: 8px 16px;
                  border: none;
                  background: #dc3545;
                  color: white;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">${confirmText}</button>
              </div>
            </div>
          </div>
        `;
        
        // Thêm modal vào DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Lấy elements
        const modal = document.getElementById(modalId);
        const cancelBtn = document.getElementById(`cancel-${modalId}`);
        const confirmBtn = document.getElementById(`confirm-${modalId}`);
        
        // Cleanup function
        const cleanup = () => {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        };
        
        // Event handlers
        const handleCancel = () => {
          cleanup();
          resolve(false);
        };
        
        const handleConfirm = () => {
          cleanup();
          resolve(true);
        };
        
        // Gắn event listeners
        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        
        // Click outside để đóng
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            handleCancel();
          }
        });
        
        // ESC để đóng
        const handleEsc = (e) => {
          if (e.key === 'Escape') {
            handleCancel();
            document.removeEventListener('keydown', handleEsc);
          }
        };
        document.addEventListener('keydown', handleEsc);
      });
    }
  },
  watch: {
    'params.limit': function () {
      this.params.page = 1;
      this.fetchData();
    },
    'params.sort_by': function () {
      this.params.page = 1;
      this.fetchData();
    },
    'params.search': function () {
      this.params.page = 1;
      this.debouncedFetchData();
    },
    'params.is_active': function () {
      this.params.page = 1;
      this.fetchData();
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

.min-h-35 {
  min-height: 350px;
}

.table-header {
  background-color: #f8f9fa;
}

.table-header th {
  border-top: none;
  font-weight: 600;
}

.pagination {
  margin: 0;
}

.page-link {
  color: #007bff;
  text-decoration: none;
}

.page-link:hover {
  color: #0056b3;
}

.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
}
</style>