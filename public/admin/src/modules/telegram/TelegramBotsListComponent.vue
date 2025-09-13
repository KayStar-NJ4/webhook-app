<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12" :class="{'overlay-wrapper' : is_loading}">
        <div class="overlay" v-if="is_loading">
          <i class="fas fa-3x fa-spinner fa-spin"></i>
          <div class="text-bold pt-2">Loading...</div>
        </div>

        <div class="card">
          <div class="card-header d-flex align-items-center">
            <h3 class="card-title flex-grow-1">Quản lý Telegram Bots</h3>
            <div class="form-group">
              <a v-if="!! permission?.create"
                 class="btn btn-success float-right pt-md-1 pb-md-1"
                 href="javascript:void(0);"
                 data-toggle="modal"
                 data-target="#form-modal"
                 @click="selected_id = 0; selected_item = {};"
              ><i class="fa fa-plus"></i> Thêm mới</a>
            </div>
          </div>

          <div class="card-body">
            <div class="row col-12 overflow-auto px-0 min-h-35">
              <div class="w-100">
                <table class="table table-bordered table-hover">
                  <thead class="table-header">
                  <tr>
                    <th></th>
                    <th class="text-center text-nowrap">Tên Bot</th>
                    <th class="text-center text-nowrap">Bot Token</th>
                    <th class="text-center text-nowrap">Webhook URL</th>
                    <th class="text-center text-nowrap">Username</th>
                    <th class="text-center text-nowrap">Trạng thái</th>
                    <th class="text-center text-nowrap">Ngày tạo</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="text-right align-middle pr-2 text-nowrap pl-2" style="width: 66px">
                      <a href="javascript:void(0);" data-toggle="modal" data-target="#form-modal"
                         @click="selected_id = item.id; selected_item = {...item}">
                        <i class="fa text-primary"
                           :class="!!permission?.update ? 'fa-pencil-alt' : 'fa-eye'"
                        ></i>
                      </a>
                    </td>
                    <td class="align-middle">{{ item.name || '' }}</td>
                    <td class="align-middle">{{ item.bot_token ? '***' + item.bot_token.slice(-4) : '' }}</td>
                    <td class="align-middle">{{ item.webhook_url || '' }}</td>
                    <td class="align-middle">{{ item.username || '' }}</td>
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
            </div>

            <div class="float-left mt-2" v-if="this.meta.total_item > 0">
              <div class="form-group d-inline-block mr-3">
                <label>Sắp xếp theo:</label>
                <select v-model="params.sort_by" class="form-control form-control-sm d-inline-block w-auto ml-2">
                  <option value="created_at.desc">Ngày tạo (mới nhất)</option>
                  <option value="created_at.asc">Ngày tạo (cũ nhất)</option>
                  <option value="name.asc">Tên Bot (A-Z)</option>
                  <option value="name.desc">Tên Bot (Z-A)</option>
                </select>
              </div>
              <div class="form-group d-inline-block">
                <label>Hiển thị:</label>
                <select v-model="params.limit" class="form-control form-control-sm d-inline-block w-auto ml-2">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div class="float-right mt-3">
              <nav aria-label="Page navigation">
                <ul class="pagination">
                  <li class="page-item" :class="{ disabled: params.page <= 1 }">
                    <a class="page-link" href="#" @click.prevent="doPaginate(params.page - 1)">«</a>
                  </li>
                  <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === params.page }">
                    <a class="page-link" href="#" @click.prevent="doPaginate(page)">{{ page }}</a>
                  </li>
                  <li class="page-item" :class="{ disabled: params.page >= meta.total_page }">
                    <a class="page-link" href="#" @click.prevent="doPaginate(params.page + 1)">»</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="form-modal" data-backdrop="static">
    <TelegramBotFormComponent
        :object_info="selected_item"
        :permission="permission"
        @create:success="this.debouncedFetchData()"
    />
  </div>
</template>

<script>
export default {
  name: 'TelegramBotsListComponent',
  components: {
    TelegramBotFormComponent: window.TelegramBotFormComponent
  },
  props: [
    'permission',
  ],
  data() {
    return {
      controller_key: 'telegram_bot',
      service_factory_key: 'telegram_bot',
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
          id: 'name.asc',
          text: 'Tên Bot (A-Z)'
        },
        {
          id: 'name.desc',
          text: 'Tên Bot (Z-A)'
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

      // Mock data for now - replace with actual API call
      setTimeout(() => {
        _context.items = [
          {
            id: 1,
            name: 'Support Bot',
            bot_token: '1234567890:ABCDEFghijklmnopqrstuvwxyz1234567890',
            webhook_url: 'https://webhook.example.com/telegram',
            username: 'support_bot',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Sales Bot',
            bot_token: '9876543210:ZYXWVUTSRQPONMLKJIHGFEDCBA0987654321',
            webhook_url: 'https://webhook.example.com/telegram-sales',
            username: 'sales_bot',
            is_active: true,
            created_at: '2024-01-02T00:00:00Z'
          },
          {
            id: 3,
            name: 'Marketing Bot',
            bot_token: '5555555555:ABCDEFghijklmnopqrstuvwxyz5555555555',
            webhook_url: 'https://webhook.example.com/telegram-marketing',
            username: 'marketing_bot',
            is_active: false,
            created_at: '2024-01-03T00:00:00Z'
          }
        ];
        _context.meta.total_page = 1;
        _context.meta.total_item = 3;
        _context.is_loading = false;
      }, 500);
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('vi-VN');
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