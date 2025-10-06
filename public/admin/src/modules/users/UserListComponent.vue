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
              <h3 class="card-title flex-grow-1">Quản lý người dùng</h3>
              <button 
                v-if="hasPermission('users', 'create')"
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
                    :is-search="true"
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
                    <th class="text-center text-nowrap">Tên đăng nhập</th>
                    <th class="text-center text-nowrap">Họ tên</th>
                    <th class="text-center text-nowrap">Email</th>
                    <th class="text-center text-nowrap">Số điện thoại</th>
                    <th class="text-center text-nowrap">Giới tính</th>
                    <th class="text-center text-nowrap">Vai trò</th>
                    <th class="text-center text-nowrap">Trạng thái</th>
                    <th class="text-center text-nowrap">Ngày tạo</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          v-if="hasPermission('users', 'update')"
                          class="btn btn-sm btn-warning"
                          @click="handleEdit(item)"
                          data-toggle="modal"
                          data-target="#form-modal"
                          title="Sửa"
                        >
                          <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('users', 'update')"
                          class="btn btn-sm btn-info"
                          @click="handleChangePassword(item)"
                          data-toggle="modal"
                          data-target="#password-modal"
                          title="Đổi mật khẩu"
                        >
                          <i class="fa fa-key"></i>
                        </button>
                        <button 
                          v-if="hasPermission('users', 'manage_roles') || hasPermission('users', 'manage_permissions')"
                          class="btn btn-sm btn-primary"
                          @click="handleManagePermissions(item)"
                          data-toggle="modal"
                          data-target="#permissions-modal"
                          title="Quản lý vai trò & phân quyền"
                        >
                          <i class="fa fa-user-shield"></i>
                        </button>
                      </div>
                    </td>
                    <td class="align-middle">{{ item.username || '' }}</td>
                    <td class="align-middle">{{ item.full_name || '' }}</td>
                    <td class="align-middle">{{ item.email || '' }}</td>
                    <td class="align-middle">{{ item.phone_number || '' }}</td>
                    <td class="align-middle text-center">
                      <span v-if="item.gender === 'male'" class="badge badge-primary">Nam</span>
                      <span v-else-if="item.gender === 'female'" class="badge badge-pink">Nữ</span>
                      <span v-else-if="item.gender === 'other'" class="badge badge-secondary">Khác</span>
                      <span v-else>-</span>
                    </td>
                    <td class="align-middle">{{ item.role?.name || 'Chưa phân quyền' }}</td>
                    <td class="align-middle text-center">
                      <span 
                        class="badge" 
                        :class="item.is_active ? 'badge-success' : 'badge-danger'"
                      >
                        {{ item.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                      </span>
                    </td>
                    <td class="align-middle text-center">{{ formatDate(item.created_at) }}</td>
                  </tr>
                  <tr v-if="items.length === 0">
                    <td colspan="9" class="text-center text-muted py-4">
                      <i class="fas fa-inbox fa-2x mb-2"></i>
                      <br>Không có dữ liệu
                    </td>
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
                        <option value="username.asc">Tên A-Z</option>
                        <option value="username.desc">Tên Z-A</option>
                        <option value="email.asc">Email A-Z</option>
                        <option value="email.desc">Email Z-A</option>
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

    <!-- User Form Modal -->
    <div class="modal fade" id="form-modal" data-backdrop="static">
      <user-form-component
        :id="selected_id"
        :object_info="selected_item"
        :list_genders="list_genders"
        @success="handleFormSuccess"
      />
    </div>

    <!-- Password Change Modal -->
    <div class="modal fade" id="password-modal" data-backdrop="static">
      <user-password-form-component
        :id="selected_id"
        :object_info="selected_item"
        @success="handlePasswordSuccess"
      />
    </div>

    <!-- User Roles Modal -->
    <div class="modal fade" id="roles-modal" data-backdrop="static">
      <user-roles-component
        :id="selected_id"
        :object_info="selected_item"
        @success="handleRolesSuccess"
      />
    </div>

    <!-- User Permissions Modal -->
    <div class="modal fade" id="permissions-modal" data-backdrop="static">
      <user-permissions-component
        :id="selected_id"
        :object_info="selected_item"
        @success="handlePermissionsSuccess"
      />
    </div>
  </div>
</template>

<script>
// All components are loaded globally

export default {
  name: 'UserListComponent',
  props: {
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    // All components are registered globally
  },
  computed: {
    visiblePages() {
      const current = this.params.page;
      const total = this.meta.total_page;
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
      }

      if (current - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push.apply(rangeWithDots, range);

      if (current + delta < total - 1) {
        rangeWithDots.push('...', total);
      } else {
        rangeWithDots.push(total);
      }

      return rangeWithDots;
    }
  },
  data() {
    return {
      is_loading: false,
      selected_id: 0,
      selected_item: {},
      params: {
        search: '',
        sort_by: 'created_at.desc',
        limit: 10,
        page: 1,
        is_active: ''
      },
      range_sorts: [
        {
          id: 'created_at.asc',
          text: 'Ngày tạo (cũ nhất)'
        },
        {
          id: 'created_at.desc',
          text: 'Ngày tạo (mới nhất)'
        },
        {
          id: 'username.asc',
          text: 'Tên đăng nhập (A-Z)'
        },
        {
          id: 'username.desc',
          text: 'Tên đăng nhập (Z-A)'
        },
        {
          id: 'full_name.asc',
          text: 'Họ tên (A-Z)'
        },
        {
          id: 'full_name.desc',
          text: 'Họ tên (Z-A)'
        },
        {
          id: 'email.asc',
          text: 'Email (A-Z)'
        },
        {
          id: 'email.desc',
          text: 'Email (Z-A)'
        }
      ],
      list_genders: [
        { id: 'male', text: 'Nam' },
        { id: 'female', text: 'Nữ' },
        { id: 'other', text: 'Khác' }
      ],
      statusOptions: [
        { value: '', label: 'Tất cả' },
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Không hoạt động' }
      ],
      items: [],
      meta: {
        total_item: 0,
        total_page: 0,
      }
    }
  },
  watch: {
    'params.limit': function(newLimit, oldLimit) {
      if (newLimit !== oldLimit) {
        this.params.page = 1;
        this.debouncedFetchData();
      }
    },
    'params.sort_by': function(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.params.page = 1;
        this.debouncedFetchData();
      }
    },
    'params.is_active': function(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.params.page = 1;
        this.debouncedFetchData();
      }
    },
    'params.search': function(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.params.page = 1;
        this.debouncedFetchData();
      }
    }
  },
  mounted() {
    this.debouncedFetchData = window.lodash.debounce(this.fetchData, 500);
    this.debouncedFetchData();
  },
  methods: {
    debouncedSearch() {
      this.params.page = 1;
      this.debouncedFetchData();
    },
    
    handleStatusChange(value) {
      this.params.is_active = value;
      this.params.page = 1;
      this.debouncedFetchData();
    },
    updateLimit(newLimit) {
      this.params.limit = parseInt(newLimit);
      this.params.page = 1;
      this.debouncedFetchData();
    },
    updateSortBy(newSortBy) {
      this.params.sort_by = newSortBy;
      this.params.page = 1;
      this.debouncedFetchData();
    },
    doPaginate(pageNum) {
      if (pageNum >= 1 && pageNum <= this.meta.total_page) {
        this.params.page = pageNum;
        this.debouncedFetchData();
      }
    },
    fetchData() {
      let _context = this;
      _context.is_loading = true;

      // Prepare params for API call
      const apiParams = Object.assign({}, this.params);
      
      // Clean up empty search
      if (!apiParams.search || apiParams.search.trim() === '') {
        delete apiParams.search;
      }
      
      // Clean up empty is_active and convert to boolean
      if (apiParams.is_active === '') {
        delete apiParams.is_active;
      } else if (apiParams.is_active !== undefined) {
        apiParams.is_active = apiParams.is_active === 'true';
      }

      window.UserService.getList(apiParams)
        .then(function(response) {
          if (response.data.success) {
            _context.items = response.data.data || [];
            _context.meta.total_item = (response.data.meta && response.data.meta.total_item) || 0;
            _context.meta.total_page = (response.data.meta && response.data.meta.total_page) || 0;
            
            // Nếu total_page = 0 nhưng có dữ liệu, tính lại
            if (_context.meta.total_page === 0 && _context.meta.total_item > 0) {
              _context.meta.total_page = Math.ceil(_context.meta.total_item / _context.params.limit);
            }
          } else {
            _context.items = [];
            _context.meta.total_item = 0;
            _context.meta.total_page = 0;
            _context.showError(response.data.message || 'Có lỗi xảy ra khi tải dữ liệu');
          }
        })
        .catch(function(error) {
          _context.items = [];
          _context.meta.total_item = 0;
          _context.meta.total_page = 0;
          _context.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi tải dữ liệu');
        })
        .finally(function() {
          _context.is_loading = false;
        });
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
      this.selected_item = Object.assign({}, item);
    },
    handleChangePassword(item) {
      this.selected_id = item.id;
      this.selected_item = Object.assign({}, item);
    },
    handleManagePermissions(item) {
      this.selected_id = item.id;
      this.selected_item = Object.assign({}, item);
    },
    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
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
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        `;
        
        modal.innerHTML = `
          <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">${title}</h4>
            <p style="margin: 0; color: #666; line-height: 1.5;">${message}</p>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancelBtn" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              background: white;
              color: #666;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">${cancelText}</button>
            <button id="confirmBtn" style="
              padding: 8px 16px;
              border: none;
              background: #dc3545;
              color: white;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">${confirmText}</button>
          </div>
        `;
        
        // Add CSS animation
        if (!document.getElementById('modal-styles')) {
          const style = document.createElement('style');
          style.id = 'modal-styles';
          style.textContent = `
            @keyframes modalSlideIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `;
          document.head.appendChild(style);
        }
        
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        // Handle button clicks
        const cancelBtn = modal.querySelector('#cancelBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');
        
        const cleanup = () => {
          document.body.removeChild(backdrop);
        };
        
        cancelBtn.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            cleanup();
            resolve(false);
          }
        });
        
        // Handle escape key
        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            cleanup();
            resolve(false);
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);
      });
    },
    handleFormSuccess() {
      this.debouncedFetchData();
      this.closeModal('form-modal');
    },
    handlePasswordSuccess() {
      this.closeModal('password-modal');
    },
    handleRolesSuccess() {
      this.closeModal('roles-modal');
    },
    handlePermissionsSuccess() {
      this.closeModal('permissions-modal');
    },
    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        // Bootstrap 4 syntax - use jQuery
        $(modal).modal('hide');
      }
    },
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        // Enhanced fallback with better styling
        this.showFallbackToast(message, 'success');
      }
    },
    showError(message) {
      if (window.toast) {
        window.toast.error(message);
      } else {
        // Enhanced fallback with better styling
        this.showFallbackToast(message, 'error');
      }
    },
    showFallbackToast(message, type) {
      const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      };
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      `;
      
      toast.innerHTML = `
        <span style="margin-right: 8px;">${icons[type]}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
    }
  },
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