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
              <ActionButtonsComponent
                :permission="permission"
                :selectedItem="null"
                @add="handleAdd"
              />
            </div>

            <div class="card-body">
              <div class="row col-12 overflow-auto px-0 min-h-35">
                <div class="w-100">
                  <table class="table table-bordered table-hover">
                    <thead class="table-header">
                    <tr>
                      <th></th>
                      <th class="text-center text-nowrap">Tên đăng nhập</th>
                      <th class="text-center text-nowrap">Họ tên</th>
                      <th class="text-center text-nowrap">Email</th>
                      <th class="text-center text-nowrap">Vai trò</th>
                      <th class="text-center text-nowrap">Trạng thái</th>
                      <th class="text-center text-nowrap">Ngày tạo</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="item in items" :key="item.id">
                      <td class="text-right align-middle pr-2 text-nowrap pl-2" style="width: 66px">
                        <ActionButtonsComponent
                          :permission="permission"
                          :selectedItem="item"
                          @edit="handleEdit"
                          @delete="handleDelete"
                          @view="handleView"
                        />
                      </td>
                      <td class="align-middle">{{ item.username || '' }}</td>
                      <td class="align-middle">{{ item.full_name || '' }}</td>
                      <td class="align-middle">{{ item.email || '' }}</td>
                      <td class="align-middle">{{ item.role?.name || 'Chưa phân quyền' }}</td>
                      <td class="align-middle text-center">
                        <FormCheckBoxComponent
                          :id="`user_active_${item.id}`"
                          name="is_active"
                          :checked="item.is_active"
                          :is_disabled="true"
                        />
                      </td>
                      <td class="align-middle">{{ formatDate(item.created_at) }}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="float-left mt-2" v-if="this.meta.total_item > 0">
                <FormListingSortComponent
                  :range_sorts="range_sorts"
                  :limit="params.limit"
                  :sort_by="params.sort_by"
                  @update:limit="params.limit = $event"
                  @update:sort_by="params.sort_by = $event"
                />
              </div>

              <div class="float-right mt-3">
                <PaginateComponent
                  :totalPages="meta.total_page"
                  :currentPage="params.page"
                  @page-change="doPaginate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="form-modal" data-backdrop="static">
      <UserFormComponent
          :object_info="selected_item"
          :permission="permission"
          @create:success="this.debouncedFetchData()"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserListComponent',
  components: {
    UserFormComponent: window.UserFormComponent,
    ActionButtonsComponent: window.ActionButtonsComponent,
    FormCheckBoxComponent: window.FormCheckBoxComponent,
    FormListingSortComponent: window.FormListingSortComponent,
    PaginateComponent: window.PaginateComponent
  },
  props: [
    'permission',
  ],
  data() {
    return {
      controller_key: 'user',
      service_factory_key: 'user',
      is_loading: false,
      selected_id: 0,
      selected_item: {},
      params: {
        sort_by: 'created_at.desc',
        limit: '10',
        page: 1,
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
      ],
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
    visiblePages() {
      const current = this.params.page;
      const total = this.meta.total_page;
      const pages = [];
      
      // Show max 5 pages
      let start = Math.max(1, current - 2);
      let end = Math.min(total, current + 2);
      
      // Adjust if we're near the beginning or end
      if (end - start < 4) {
        if (start === 1) {
          end = Math.min(total, start + 4);
        } else {
          start = Math.max(1, end - 4);
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
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
    submitSearch() {
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

      // TODO: Implement actual API call
      _context.items = [];
      _context.meta.total_page = 0;
      _context.meta.total_item = 0;
      _context.is_loading = false;
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
    handleDelete(item) {
      if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        // Handle delete logic here
        console.log('Delete user:', item.id);
      }
    },
    handleView(item) {
      this.selected_id = item.id;
      this.selected_item = {...item};
    }
  },
  watch: {
    'params.limit': function (newVal, oldVal) {
      this.submitSearch();
    },
    'params.sort_by': function (newVal, oldVal) {
      this.submitSearch();
    },
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