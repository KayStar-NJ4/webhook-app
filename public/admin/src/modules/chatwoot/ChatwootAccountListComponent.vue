<template>
  <div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12" :class="{'overlay-wrapper' : isLoading}">
          <div class="overlay" v-if="isLoading">
            <i class="fas fa-3x fa-spinner fa-spin"></i>
            <div class="text-bold pt-2">Loading...</div>
          </div>

          <div class="card">
            <div class="card-header d-flex align-items-center">
              <h3 class="card-title flex-grow-1">Quản lý tài khoản Chatwoot</h3>
              <button 
                v-if="hasPermission('chatwoot', 'create')"
                class="btn btn-success float-right"
                @click="$emit('create')"
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
                      <th>Tên</th>
                      <th>Base URL</th>
                      <th>Account ID</th>
                      <th>Inbox ID</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="accounts.length === 0">
                      <td colspan="6" class="text-center py-4">
                        <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">Chưa có tài khoản Chatwoot</h4>
                        <p class="text-muted">Bạn chưa có tài khoản Chatwoot nào. Hãy tạo tài khoản đầu tiên.</p>
                      </td>
                    </tr>
                    <tr v-for="account in accounts" :key="account.id">
                      <td class="text-center">
                        <div class="btn-group" role="group">
                          <button 
                            v-if="hasPermission('chatwoot', 'update')"
                            class="btn btn-sm btn-warning"
                            @click="$emit('edit', account)"
                            data-toggle="modal"
                            data-target="#form-modal"
                            title="Sửa"
                          >
                            <i class="fa fa-pencil-alt"></i>
                          </button>
                          <button 
                            v-if="hasPermission('chatwoot', 'read')"
                            class="btn btn-sm btn-info"
                            @click="testConnection(account)"
                            title="Test kết nối"
                          >
                            <i class="fas fa-exchange-alt"></i>
                          </button>
                          <button 
                            v-if="hasPermission('chatwoot', 'delete')"
                            class="btn btn-sm btn-danger"
                            @click="showDeleteConfirm(account)"
                            title="Xóa"
                          >
                            <i class="fa fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <i class="fas fa-comments text-primary mr-2"></i>
                          <strong>{{ account.name }}</strong>
                        </div>
                      </td>
                      <td>
                        <span class="text-muted">{{ account.base_url }}</span>
                      </td>
                      <td>
                        <span class="badge badge-info">{{ account.account_id }}</span>
                      </td>
                      <td>
                        <span class="badge badge-secondary">{{ account.inbox_id || 1 }}</span>
                      </td>
                      <td>
                        <span :class="account.is_active ? 'badge badge-success' : 'badge badge-danger'">
                          <i :class="account.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="mr-1"></i>
                          {{ account.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                        </span>
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
                        <option value="base_url.asc">URL A-Z</option>
                        <option value="base_url.desc">URL Z-A</option>
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
  </div>
</template>

<script>
export default {
  name: 'ChatwootAccountListComponent',
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
    },
    meta: {
      type: Object,
      default: () => ({
        total_item: 0,
        total_page: 1
      })
    }
  },
  data() {
    return {
      params: {
        search: '',
        is_active: '',
        page: 1,
        limit: 10,
        sort_by: 'created_at.desc'
      },
      statusOptions: [
        { value: '', label: 'Tất cả' },
        { value: 'true', label: 'Hoạt động' },
        { value: 'false', label: 'Không hoạt động' }
      ],
      searchTimeout: null
    }
  },
  methods: {
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false;
      return this.userPermissions[resource].some(p => p.action === action);
    },
    showDeleteConfirm(account) {
      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa tài khoản "${account.name}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          this.$emit('delete', account);
        }
      });
    },
    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        const modalId = `confirm-${Date.now()}`;
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

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(modalId);
        const cancelBtn = document.getElementById(`cancel-${modalId}`);
        const confirmBtn = document.getElementById(`confirm-${modalId}`);

        const cleanup = () => {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        };

        const handleCancel = () => { cleanup(); resolve(false); };
        const handleConfirm = () => { cleanup(); resolve(true); };

        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        modal.addEventListener('click', (e) => { if (e.target === modal) handleCancel(); });
        const handleEsc = (e) => { if (e.key === 'Escape') { handleCancel(); document.removeEventListener('keydown', handleEsc); } };
        document.addEventListener('keydown', handleEsc);
      });
    },
    debouncedSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.params.page = 1;
        this.$emit('search', this.params);
      }, 500);
    },
    handleStatusChange() {
      this.params.page = 1;
      this.$emit('search', this.params);
    },
    updateLimit(limit) {
      this.params.limit = parseInt(limit);
      this.params.page = 1;
      this.$emit('search', this.params);
    },
    updateSortBy(sortBy) {
      this.params.sort_by = sortBy;
      this.params.page = 1;
      this.$emit('search', this.params);
    },
    doPaginate(page) {
      this.params.page = page;
      this.$emit('search', this.params);
    },
    async testConnection(account) {
      try {
        const response = await window.ChatwootService.testConnection(account.id);
        
        if (response.data.success && response.data.data.connected) {
          this.showTestResult(account, true, 'Kết nối thành công');
        } else {
          this.showTestResult(account, false, response.data.data?.message || 'Kết nối thất bại');
        }
      } catch (error) {
        this.showTestResult(account, false, 'Lỗi: ' + error.message);
      }
    },
    showTestResult(account, success, message) {
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
              Tài khoản: <strong>${account.name}</strong>
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
    }
  }
}
</script>

