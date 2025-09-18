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
              <h3 class="card-title flex-grow-1">Quản lý vai trò</h3>
              <button 
                v-if="hasPermission('roles', 'create')"
                class="btn btn-success float-right"
                @click="handleAdd"
                data-toggle="modal"
                data-target="#form-modal"
              >
                <i class="fa fa-plus"></i> Thêm mới
              </button>
            </div>

            <div class="card-body">
              <!-- Search -->
              <div class="row form border-bottom mb-3">
                <div class="col-md-4 col-sm-6">
                  <form-input-text-component
                    v-model="params.search"
                    label="Tìm kiếm"
                    placeholder="Tìm kiếm..."
                    @update:modelValue="debouncedSearch"
                  />
                </div>
              </div>

              <!-- Table -->
              <div class="row col-12 overflow-auto">
                <table class="table table-bordered table-hover">
                  <thead class="table-header">
                  <tr>
                    <th style="width: 80px;"></th>
                    <th class="text-center text-nowrap">Tên vai trò</th>
                    <th class="text-center text-nowrap">Mô tả</th>
                    <th class="text-center text-nowrap">Số quyền</th>
                    <th class="text-center text-nowrap">Số người dùng</th>
                    <th class="text-center text-nowrap">Ngày tạo</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="text-center">
                      <div class="btn-group" role="group">
                        <button 
                          v-if="hasPermission('roles', 'update')"
                          class="btn btn-sm btn-warning"
                          @click="handleEdit(item)"
                          data-toggle="modal"
                          data-target="#form-modal"
                          :title="isSystemRole(item) ? 'Sửa mô tả' : 'Sửa'"
                        >
                          <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="hasPermission('roles', 'update') && !isSystemRole(item)"
                          class="btn btn-sm btn-info"
                          @click="handleManagePermissions(item)"
                          data-toggle="modal"
                          data-target="#permissions-modal"
                          title="Quản lý quyền"
                        >
                          <i class="fa fa-key"></i>
                        </button>
                        <button 
                          v-if="hasPermission('roles', 'read') && isSystemRole(item)"
                          class="btn btn-sm btn-secondary"
                          @click="handleViewPermissions(item)"
                          data-toggle="modal"
                          data-target="#permissions-modal"
                          title="Xem quyền"
                        >
                          <i class="fa fa-key"></i>
                        </button>
                        <button 
                          v-if="hasPermission('roles', 'delete') && !isSystemRole(item)"
                          class="btn btn-sm btn-danger"
                          @click="handleDelete(item)"
                          title="Xóa"
                        >
                          <i class="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                    <td class="align-middle">
                      {{ item.name || '' }}
                      <i v-if="isSystemRole(item)" class="fa text-warning fa-star ml-1" title="Vai trò hệ thống"></i>
                    </td>
                    <td class="align-middle">{{ item.description || '-' }}</td>
                    <td class="align-middle text-center">
                      <span class="badge badge-info">{{ item.permission_count || 0 }}</span>
                    </td>
                    <td class="align-middle text-center">
                      <span class="badge badge-secondary">{{ item.user_count || 0 }}</span>
                    </td>
                    <td class="align-middle text-center">{{ formatDate(item.created_at) }}</td>
                  </tr>
                  <tr v-if="items.length === 0">
                    <td colspan="6" class="text-center text-muted py-4">
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

    <!-- Role Form Modal -->
    <div class="modal fade" id="form-modal" data-backdrop="static">
      <role-form-component
        :id="selected_id"
        :object_info="selected_item"
        @success="handleFormSuccess"
      />
    </div>

    <!-- Permissions Management Modal -->
    <div class="modal fade" id="permissions-modal" data-backdrop="static">
      <role-permissions-component
        :id="selected_id"
        :object_info="selected_item"
        :permissions="permissions"
        :feature_translations="feature_translations"
        :action_translations="action_translations"
        @success="handlePermissionsSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleListComponent',
  props: {
    userPermissions: {
      type: Object,
      default: () => ({})
    },
    permissions: {
      type: Object,
      default: () => ({})
    },
    feature_translations: {
      type: Object,
      default: () => ({})
    },
    action_translations: {
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
        search: '',
        sort_by: 'created_at.desc',
        limit: 10,
        page: 1
      },
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

      window.RoleService.getList(apiParams)
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
    handleView(item) {
      this.selected_id = item.id;
      this.selected_item = Object.assign({}, item);
    },
    handleViewPermissions(item) {
      this.selected_id = item.id;
      this.selected_item = Object.assign({}, item);
    },
    handleManagePermissions(item) {
      this.selected_id = item.id;
      this.selected_item = Object.assign({}, item);
    },
    handleDelete(item) {
      if (this.isSystemRole(item)) {
        this.showError('Không thể xóa vai trò hệ thống');
        return;
      }

      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa vai trò "${item.name}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          this.performDelete(item.id);
        }
      });
    },
    async performDelete(id) {
      try {
        this.is_loading = true;
        await window.RoleService.deleteRole(id);
        this.showSuccess('Xóa vai trò thành công');
        this.debouncedFetchData();
      } catch (error) {
        this.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi xóa vai trò');
      } finally {
        this.is_loading = false;
      }
    },
    isSystemRole(item) {
      const systemRoles = ['super_admin', 'admin', 'operator', 'viewer'];
      return systemRoles.includes(item.name);
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
        
        const handleBackdrop = (e) => {
          if (e.target === modal) {
            cleanup();
            resolve(false);
          }
        };
        
        // Add event listeners
        cancelBtn.onclick = handleCancel;
        confirmBtn.onclick = handleConfirm;
        modal.onclick = handleBackdrop;
        
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
    handlePermissionsSuccess() {
      this.debouncedFetchData();
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
      
      // Tạo unique ID cho toast
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const toast = document.createElement('div');
      toast.id = toastId;
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
      
      // Auto remove sau 5 giây
      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement && toastElement.parentNode) {
          toastElement.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => {
            if (toastElement.parentNode) {
              toastElement.parentNode.removeChild(toastElement);
            }
          }, 300);
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

.select2-container .select2-selection--single {
  height: 37px;
}

.select2-container--default .select2-selection--single .select2-selection__arrow {
  top: 5px;
}
</style>
