// Generic List Component - Handle all list pages (Xịn xò version)
window.ListComponent = {
    template: `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12" :class="{'overlay-wrapper' : is_loading}">
                    <div class="overlay" v-if="is_loading">
                        <i class="fas fa-3x fa-spinner fa-spin"></i>
                        <div class="text-bold pt-2">Loading...</div>
                    </div>

                    <div class="card">
                        <div class="card-header d-flex align-items-center">
                            <h3 class="card-title flex-grow-1">{{ pageTitle }}</h3>
                            <button v-if="hasPermission(resource, 'create')" 
                                    class="btn btn-success float-right" 
                                    @click="openCreateModal">
                                <i class="fa fa-plus"></i> New {{ resourceName }}
                            </button>
                        </div>

                        <div class="card-body">
                            <div class="col-12 overflow-auto px-0 min-h-35">
                                <div class="w-100">
                                    <table class="table table-bordered table-hover">
                                        <thead class="table-header">
                                            <tr>
                                                <th></th>
                                                <th v-for="column in columns" :key="column.key" 
                                                    class="text-center text-nowrap">
                                                    {{ column.label }}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="item in items" :key="item.id">
                                                <td class="text-right align-middle pr-2 text-nowrap pl-2" style="width: 66px">
                                                    <button v-if="hasPermission(resource, 'update')" 
                                                            class="btn btn-sm btn-warning" 
                                                            @click="openEditModal(item)"
                                                            title="Edit">
                                                        <i class="fa fa-pencil-alt text-primary"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-info" 
                                                            @click="testConnection(item.id)"
                                                            title="Test Connection">
                                                        <i class="fa fa-play text-info ml-1"></i>
                                                    </button>
                                                    <button v-if="hasPermission(resource, 'delete')" 
                                                            class="btn btn-sm btn-danger" 
                                                            @click="deleteItem(item.id)"
                                                            title="Delete">
                                                        <i class="fa fa-trash text-danger ml-1"></i>
                                                    </button>
                                                </td>
                                                <td v-for="column in columns" :key="column.key" 
                                                    class="align-middle text-center">
                                                    <span v-if="column.type === 'badge'" 
                                                          class="badge" 
                                                          :class="getBadgeClass(item[column.key])">
                                                        {{ getBadgeText(item[column.key]) }}
                                                    </span>
                                                    <span v-else-if="column.type === 'token'">
                                                        {{ maskToken(item[column.key]) }}
                                                    </span>
                                                    <span v-else-if="column.type === 'date'">
                                                        {{ formatDate(item[column.key]) }}
                                                    </span>
                                                    <span v-else>{{ item[column.key] || '' }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="float-left mt-2" v-if="meta.total_item > 0">
                                <div class="d-flex align-items-center">
                                    <span class="mr-2">Show:</span>
                                    <select v-model="params.limit" @change="submitSearch" class="form-control form-control-sm" style="width: 80px;">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span class="ml-2">entries</span>
                                </div>
                            </div>

                            <div class="float-right mt-3" v-if="meta.total_page > 1">
                                <nav>
                                    <ul class="pagination pagination-sm">
                                        <li class="page-item" :class="{disabled: params.page <= 1}">
                                            <button class="page-link" @click="doPaginate(params.page - 1)" :disabled="params.page <= 1">«</button>
                                        </li>
                                        <li v-for="page in visiblePages" :key="page" 
                                            class="page-item" 
                                            :class="{active: page === params.page}">
                                            <button class="page-link" @click="doPaginate(page)">{{ page }}</button>
                                        </li>
                                        <li class="page-item" :class="{disabled: params.page >= meta.total_page}">
                                            <button class="page-link" @click="doPaginate(params.page + 1)" :disabled="params.page >= meta.total_page">»</button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: ['userPermissions'],
    data() {
        return {
            is_loading: false,
            items: [],
            resource: '',
            resourceName: '',
            pageTitle: '',
            columns: [],
            service: null,
            params: {
                sort_by: 'created_at.desc',
                limit: '10',
                page: 1,
            },
            meta: {
                total_item: 0,
                total_page: 0,
            }
        }
    },
    computed: {
        visiblePages() {
            const current = this.params.page;
            const total = this.meta.total_page;
            const pages = [];
            
            let start = Math.max(1, current - 2);
            let end = Math.min(total, current + 2);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            return pages;
        }
    },
    mounted() {
        this.setupPage();
        this.debouncedFetchData = this.debounce(this.fetchData, 500);
        this.debouncedFetchData();
    },
    methods: {
        setupPage() {
            const route = this.$route.path;
            if (route.includes('telegram-bots')) {
                this.resource = 'telegram';
                this.resourceName = 'Bot';
                this.pageTitle = 'Quản lý Telegram Bots';
                this.service = window.TelegramService;
                this.columns = [
                    { key: 'name', label: 'Name' },
                    { key: 'token', label: 'Token', type: 'token' },
                    { key: 'webhook_url', label: 'Webhook URL' },
                    { key: 'is_active', label: 'Status', type: 'badge' },
                    { key: 'created_at', label: 'Created', type: 'date' }
                ];
            } else if (route.includes('chatwoot-accounts')) {
                this.resource = 'chatwoot';
                this.resourceName = 'Account';
                this.pageTitle = 'Quản lý Chatwoot Accounts';
                this.service = window.ChatwootService;
                this.columns = [
                    { key: 'name', label: 'Name' },
                    { key: 'api_url', label: 'API URL' },
                    { key: 'access_token', label: 'Access Token', type: 'token' },
                    { key: 'account_id', label: 'Account ID' },
                    { key: 'is_active', label: 'Status', type: 'badge' },
                    { key: 'created_at', label: 'Created', type: 'date' }
                ];
            } else if (route.includes('dify-apps')) {
                this.resource = 'dify';
                this.resourceName = 'App';
                this.pageTitle = 'Quản lý Dify Apps';
                this.service = window.DifyService;
                this.columns = [
                    { key: 'name', label: 'Name' },
                    { key: 'api_url', label: 'API URL' },
                    { key: 'app_id', label: 'App ID' },
                    { key: 'api_key', label: 'API Key', type: 'token' },
                    { key: 'timeout', label: 'Timeout' },
                    { key: 'is_active', label: 'Status', type: 'badge' },
                    { key: 'created_at', label: 'Created', type: 'date' }
                ];
            }
        },
        hasPermission(resource, action) {
            if (!this.userPermissions[resource]) return false;
            return this.userPermissions[resource].some(p => p.action === action);
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
        submitSearch() {
            this.params.page = 1;
            this.debouncedFetchData();
        },
        doPaginate(pageNum) {
            this.params.page = pageNum;
            this.debouncedFetchData();
        },
        fetchData() {
            if (!this.service) return;
            
            this.is_loading = true;
            const _context = this;

            const request = this.service.getList(this.params);

            request
                .then(response => {
                    _context.items = response.data.data || [];
                    _context.meta.total_page = response.data.meta?.total_page || 1;
                    _context.meta.total_item = response.data.meta?.total_item || 0;
                    _context.is_loading = false;
                })
                .catch(error => {
                    _context.is_loading = false;
                    _context.items = [];
                    _context.meta.total_page = 1;
                    _context.meta.total_item = 0;
                    console.error('Failed to load items:', error);
                });
        },
        openCreateModal() {
            console.log('Create modal for', this.resource);
        },
        openEditModal(item) {
            console.log('Edit', this.resource, ':', item);
        },
        async deleteItem(id) {
            if (!confirm(`Bạn có chắc muốn xóa ${this.resourceName.toLowerCase()} này?`)) return;
            try {
                const response = await this.service.delete(id);
                if (response.data.success) {
                    this.fetchData();
                    alert(`${this.resourceName} deleted successfully!`);
                }
            } catch (error) {
                alert(`Failed to delete ${this.resourceName.toLowerCase()}: ` + (error.response?.data?.message || 'Unknown error'));
            }
        },
        async testConnection(id) {
            try {
                const response = await this.service.testConnection(id);
                if (response.data.success) {
                    alert('Connection test successful!');
                } else {
                    alert('Connection test failed: ' + response.data.message);
                }
            } catch (error) {
                alert('Connection test failed: ' + (error.response?.data?.message || 'Unknown error'));
            }
        },
        maskToken(token) {
            if (!token) return '';
            return token.substring(0, 8) + '...' + token.substring(token.length - 8);
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString();
        },
        getBadgeClass(value) {
            return value ? 'badge-success' : 'badge-danger';
        },
        getBadgeText(value) {
            return value ? 'Active' : 'Inactive';
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
};
