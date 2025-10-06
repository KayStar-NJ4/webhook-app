<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Danh sách vai trò</h3>
      <div class="card-tools">
        <button 
          type="button" 
          class="btn btn-primary btn-sm" 
          @click="$emit('create')"
          v-if="hasPermission('roles', 'create')"
        >
          <i class="fas fa-plus"></i> Tạo mới
        </button>
      </div>
    </div>
    <div class="card-body">
      <!-- Search and Filter Section -->
      <div class="row form border-bottom mb-3">
        <div class="col-md-4 col-sm-6">
          <div class="form-group">
            <label>Tìm kiếm</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="params.search"
              @input="debouncedFetchData"
              placeholder="Tìm kiếm theo tên vai trò..."
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
            >
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="is_loading" class="text-center py-4">
        <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
        <p class="mt-2">Đang tải dữ liệu...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="text-center py-4">
        <i class="fas fa-users fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">Chưa có vai trò nào</h4>
        <p class="text-muted">Bạn chưa có vai trò nào. Hãy tạo vai trò đầu tiên.</p>
      </div>

      <!-- Table -->
      <div v-else class="row col-12 overflow-auto">
        <table class="table table-bordered table-hover">
          <thead class="table-header">
          <tr>
            <th style="width: 120px;"></th>
            <th class="text-center text-nowrap">Tên vai trò</th>
            <th class="text-center text-nowrap">Mô tả</th>
            <th class="text-center text-nowrap">Số quyền</th>
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
                  @click="$emit('edit', item)"
                  data-toggle="modal"
                  data-target="#form-modal"
                  title="Chỉnh sửa vai trò và quyền"
                >
                  <i class="fas fa-user-shield"></i>
                </button>
                <button 
                  v-if="hasPermission('roles', 'delete')"
                  class="btn btn-sm btn-danger"
                  @click="showDeleteConfirm(item)"
                  title="Xóa"
                >
                  <i class="fa fa-trash-alt"></i>
                </button>
              </div>
            </td>
            <td class="align-middle">
              <strong>{{ item.name || '' }}</strong>
            </td>
            <td class="align-middle">{{ item.description || '-' }}</td>
            <td class="align-middle text-center">
              <span class="badge badge-info">{{ item.permissions ? item.permissions.length : 0 }}</span>
            </td>
            <td class="align-middle text-center">
              {{ formatDate(item.created_at) }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination and sorting -->
      <div v-if="!is_loading && items.length > 0" class="row mt-3">
        <div class="col-md-6">
          <div class="d-flex align-items-center">
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
</template>

<script>
export default {
  name: 'RoleListComponent',
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
        search: ''
      },
      items: [],
      meta: {
        total_item: 0,
        total_page: 0,
      },
      debouncedFetchData: null
    }
  },
  mounted() {
    this.debouncedFetchData = this.debounce(this.fetchData, 500);
    this.fetchData();
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
    async fetchData() {
      this.is_loading = true;
      try {
        const response = await window.RoleService.getList(this.params);
        
        if (response.data.success) {
          this.items = response.data.data.roles || response.data.data || [];
          this.meta = {
            total_item: response.data.data.total || response.data.data.pagination?.total || 0,
            total_page: response.data.data.total_page || response.data.data.pagination?.pages || 1,
          };
        } else {
          this.items = [];
          this.meta = { total_item: 0, total_page: 0 };
        }
      } catch (error) {
        this.items = [];
        this.meta = { total_item: 0, total_page: 0 };
        if (window.ToastService && window.ToastService.error) {
          window.ToastService.error('Lỗi kết nối mạng');
        }
      } finally {
        this.is_loading = false;
      }
    },
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false;
      return this.userPermissions[resource].some(p => p.action === action);
    },
    showDeleteConfirm(item) {
      if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${item.name}"?`)) {
        this.$emit('delete', item);
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    updateLimit(value) {
      this.params.limit = value;
      this.params.page = 1;
      this.debouncedFetchData();
    },
    updateSortBy(value) {
      this.params.sort_by = value;
      this.params.page = 1;
      this.debouncedFetchData();
    }
  }
}
</script>

<style scoped>
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
