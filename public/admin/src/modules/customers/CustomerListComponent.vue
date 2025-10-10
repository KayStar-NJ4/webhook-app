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
              <h3 class="card-title flex-grow-1">Quản lý Khách hàng</h3>
              <button 
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
                      placeholder="Tìm theo tên, email, công ty..."
                      autocomplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="form-group">
                    <label>Trạng thái</label>
                    <select class="form-control" v-model="params.status">
                      <option value="">Tất cả</option>
                      <option value="new">Mới</option>
                      <option value="contacted">Đã liên hệ</option>
                      <option value="in_progress">Đang xử lý</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đóng</option>
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
                      <th class="text-center text-nowrap">Tên</th>
                      <th class="text-center text-nowrap">Email</th>
                      <th class="text-center text-nowrap">Công ty</th>
                      <th class="text-center text-nowrap">Chủ đề</th>
                      <th class="text-center text-nowrap">Trạng thái</th>
                      <th class="text-center text-nowrap">Nguồn</th>
                      <th class="text-center text-nowrap">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in items" :key="item.id">
                      <td class="text-center">
                        <div class="btn-group" role="group">
                          <button 
                            v-if="hasPermission('customers', 'update')"
                            class="btn btn-sm btn-warning"
                            @click="handleEdit(item)"
                            data-toggle="modal"
                            data-target="#form-modal"
                            title="Sửa"
                          >
                            <i class="fa fa-pencil-alt"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-info"
                            @click="handleView(item)"
                            data-toggle="modal"
                            data-target="#view-modal"
                            title="Xem chi tiết"
                          >
                            <i class="fa fa-eye"></i>
                          </button>
                          <button 
                            v-if="hasPermission('customers', 'delete')"
                            class="btn btn-sm btn-danger"
                            @click="handleDelete(item.id)"
                            title="Xóa"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                      <td class="align-middle">{{ item.name || '' }}</td>
                      <td class="align-middle">{{ item.email || '' }}</td>
                      <td class="align-middle">{{ item.company || '-' }}</td>
                      <td class="align-middle">{{ item.subject || '' }}</td>
                      <td class="align-middle text-center">
                        <span :class="getStatusBadgeClass(item.status)">
                          {{ getStatusText(item.status) }}
                        </span>
                      </td>
                      <td class="align-middle text-center">
                        <span class="badge badge-info">{{ item.source }}</span>
                      </td>
                      <td class="align-middle text-center text-nowrap">{{ formatDate(item.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div class="row mt-2">
                <div class="col-md-6">
                  <div class="text-left">
                    <span class="text-muted">Hiển thị {{ items.length }} / {{ meta.total_item }} kết quả</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-flex justify-content-end">
                    <div class="text-right">
                      <div class="pagination-wrapper" style="max-width: 300px; overflow: hidden;">
                        <paginate-component
                          :current-page="params.page"
                          :total-pages="meta.total_page"
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

    <!-- View Modal -->
    <div class="modal fade" id="view-modal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content" v-if="selectedItem">
          <div class="modal-header bg-info">
            <h5 class="modal-title text-white">Chi tiết Khách hàng</h5>
            <button type="button" class="close text-white" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <dl class="row">
              <dt class="col-sm-3">Tên:</dt>
              <dd class="col-sm-9">{{ selectedItem.name }}</dd>
              
              <dt class="col-sm-3">Email:</dt>
              <dd class="col-sm-9">
                <a :href="'mailto:' + selectedItem.email">{{ selectedItem.email }}</a>
              </dd>
              
              <dt class="col-sm-3">Công ty:</dt>
              <dd class="col-sm-9">{{ selectedItem.company || '-' }}</dd>
              
              <dt class="col-sm-3">Chủ đề:</dt>
              <dd class="col-sm-9"><strong>{{ selectedItem.subject }}</strong></dd>
              
              <dt class="col-sm-3">Nội dung:</dt>
              <dd class="col-sm-9" style="white-space: pre-wrap;">{{ selectedItem.message }}</dd>
              
              <dt class="col-sm-3">Trạng thái:</dt>
              <dd class="col-sm-9">
                <span :class="getStatusBadgeClass(selectedItem.status)">
                  {{ getStatusText(selectedItem.status) }}
                </span>
              </dd>
              
              <dt class="col-sm-3">Nguồn:</dt>
              <dd class="col-sm-9"><span class="badge badge-info">{{ selectedItem.source }}</span></dd>
              
              <dt class="col-sm-3">IP Address:</dt>
              <dd class="col-sm-9">{{ selectedItem.ip_address || '-' }}</dd>
              
              <dt class="col-sm-3">Ghi chú:</dt>
              <dd class="col-sm-9">{{ selectedItem.notes || '-' }}</dd>
              
              <dt class="col-sm-3">Ngày tạo:</dt>
              <dd class="col-sm-9">{{ formatDate(selectedItem.created_at) }}</dd>
            </dl>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div class="modal fade" id="form-modal" data-backdrop="static">
      <customer-form-component
        :object_info="selected_item"
        @create:success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomerListComponent',
  props: {
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    FormInputTextComponent: window.FormInputTextComponent,
    FormSelectComponent: window.FormSelectComponent,
    PaginateComponent: window.PaginateComponent,
    CustomerFormComponent: window.CustomerFormComponent
  },
  data() {
    return {
      items: [],
      is_loading: false,
      selectedItem: null,
      selected_item: {},
      params: {
        page: 1,
        limit: 10,
        search: '',
        status: '',
        sort_by: 'created_at.desc'
      },
      meta: {
        total_item: 0,
        total_page: 0,
        current_page: 1,
        per_page: 10
      },
      statusOptions: [
        { value: '', label: 'Tất cả' },
        { value: 'new', label: 'Mới' },
        { value: 'contacted', label: 'Đã liên hệ' },
        { value: 'in_progress', label: 'Đang xử lý' },
        { value: 'resolved', label: 'Đã giải quyết' },
        { value: 'closed', label: 'Đóng' }
      ]
    }
  },
  mounted() {
    this.debouncedFetchData = this.debounce(this.fetchData, 500);
    this.fetchData();
  },
  watch: {
    'params.search': function() {
      this.params.page = 1;
      this.debouncedFetchData();
    },
    'params.status': function() {
      this.params.page = 1;
      this.debouncedFetchData();
    }
  },
  methods: {
    
    doPaginate(pageNum) {
      if (pageNum >= 1 && pageNum <= this.meta.total_page) {
        this.params.page = pageNum;
        this.debouncedFetchData();
      }
    },
    
    fetchData() {
      const _context = this;
      _context.is_loading = true;

      // Prepare params for API call
      const apiParams = Object.assign({}, this.params);
      
      // Clean up empty values
      if (!apiParams.search || apiParams.search.trim() === '') {
        delete apiParams.search;
      }
      if (apiParams.status === '') {
        delete apiParams.status;
      }

      window.CustomerService.getList(apiParams)
        .then(function(response) {
          if (response.data.success) {
            _context.items = response.data.data || [];
            _context.meta.total_item = (response.data.meta && response.data.meta.total_item) || 0;
            _context.meta.total_page = (response.data.meta && response.data.meta.total_page) || 0;
            _context.meta.current_page = (response.data.meta && response.data.meta.current_page) || 1;
            _context.meta.per_page = (response.data.meta && response.data.meta.per_page) || 10;
          }
        })
        .catch(function(error) {
          console.error('Load customers error:', error);
          _context.showError('Không thể tải danh sách khách hàng');
        })
        .finally(function() {
          _context.is_loading = false;
        });
    },
    
    handleView(item) {
      this.selectedItem = item;
    },
    
    handleEdit(item) {
      this.selected_item = Object.assign({}, item);
    },
    
    handleAdd() {
      this.selected_item = {};
    },
    
    handleFormSuccess() {
      this.fetchData();
    },
    
    async handleDelete(id) {
      const confirmed = await this.showConfirmDialog(
        'Xác nhận xóa',
        'Bạn có chắc muốn xóa khách hàng này? (Xóa mềm, có thể khôi phục sau)'
      );
      
      if (!confirmed) return;
      
      try {
        const response = await window.CustomerService.delete(id);
        if (response.data.success) {
          this.showSuccess('Đã xóa thành công');
          this.fetchData();
        }
      } catch (error) {
        console.error('Delete customer error:', error);
        this.showError('Không thể xóa khách hàng');
      }
    },
    
    getStatusBadgeClass(status) {
      const classes = {
        'new': 'badge badge-primary',
        'contacted': 'badge badge-info',
        'in_progress': 'badge badge-warning',
        'resolved': 'badge badge-success',
        'closed': 'badge badge-secondary'
      };
      return classes[status] || 'badge badge-secondary';
    },
    
    getStatusText(status) {
      const texts = {
        'new': 'Mới',
        'contacted': 'Đã liên hệ',
        'in_progress': 'Đang xử lý',
        'resolved': 'Đã giải quyết',
        'closed': 'Đóng'
      };
      return texts[status] || status;
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
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
    
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false;
      return this.userPermissions[resource].some(p => p.action === action);
    },
    
    showConfirmDialog(title, message) {
      return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.zIndex = '1040';
        
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.zIndex = '1050';
        modal.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="close" data-dismiss="modal">
                  <span>&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <p>${message}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-danger" id="confirm-btn">Xác nhận</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        const cleanup = () => {
          document.body.removeChild(modal);
          document.body.removeChild(backdrop);
        };
        
        const closeBtn = modal.querySelector('[data-dismiss="modal"]');
        const confirmBtn = modal.querySelector('#confirm-btn');
        
        closeBtn.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        backdrop.addEventListener('click', () => {
          cleanup();
          resolve(false);
        });
      });
    },
    
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        this.showFallbackToast(message, 'success');
      }
    },
    
    showError(message) {
      if (window.toast) {
        window.toast.error(message);
      } else {
        this.showFallbackToast(message, 'error');
      }
    },
    
    showFallbackToast(message, type) {
      const colors = {
        success: '#28a745',
        error: '#dc3545'
      };
      const icons = {
        success: '✅',
        error: '❌'
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
        font-size: 14px;
      `;
      
      toast.innerHTML = `
        <span style="margin-right: 8px;">${icons[type]}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentElement) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  }
}
</script>
