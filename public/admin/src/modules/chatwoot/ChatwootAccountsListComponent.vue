<template>
    <div>
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0">Chatwoot Accounts</h1>
                    </div>
                    <div class="col-sm-6">
                        <button class="btn btn-primary float-right" @click="showAddModal = true">
                            <i class="fas fa-plus"></i> Thêm Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <section class="content">
        <div class="container-fluid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách Chatwoot Accounts</h3>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải...
                    </div>
                    <div v-else-if="accounts.length === 0" class="text-center text-muted">
                        <i class="fas fa-comments fa-3x mb-3"></i>
                        <p>Chưa có account nào được cấu hình</p>
                        <button class="btn btn-primary" @click="showAddModal = true">
                            <i class="fas fa-plus"></i> Thêm Account đầu tiên
                        </button>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Tên Account</th>
                                    <th>URL</th>
                                    <th>Account ID</th>
                                    <th>Inbox ID</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="account in accounts" :key="account.id">
                                    <td>{{ account.name }}</td>
                                    <td>{{ account.url }}</td>
                                    <td>{{ account.accountId }}</td>
                                    <td>{{ account.inboxId || 'N/A' }}</td>
                                    <td>
                                        <span class="badge" :class="account.isActive ? 'badge-success' : 'badge-danger'">
                                            {{ account.isActive ? 'Hoạt động' : 'Tạm dừng' }}
                                        </span>
                                    </td>
                                    <td>{{ formatDate(account.createdAt) }}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" @click="testAccount(account)">
                                            <i class="fas fa-play"></i> Test
                                        </button>
                                        <button class="btn btn-sm btn-warning" @click="editAccount(account)">
                                            <i class="fas fa-edit"></i> Sửa
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteAccount(account)">
                                            <i class="fas fa-trash"></i> Xóa
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Add/Edit Modal -->
            <ChatwootAccountFormComponent 
                v-if="showAddModal"
                :account="editingAccount"
                @close="closeModal"
                @saved="onAccountSaved"
            />
        </div>
        </section>
    </div>
</template>

<script>
import ChatwootAccountFormComponent from './ChatwootAccountFormComponent.vue'

export default {
    name: 'ChatwootAccountsListComponent',
    components: {
        ChatwootAccountFormComponent
    },
    data() {
        return {
            loading: false,
            accounts: [],
            showAddModal: false,
            editingAccount: null
        }
    },
    mounted() {
        this.loadAccounts();
    },
    methods: {
        async loadAccounts() {
            this.loading = true;
            try {
                const response = await this.$apiCall('get', '/api/admin/chatwoot-accounts');
                this.accounts = response.data.data || [];
            } catch (error) {
                console.error('Error loading accounts:', error);
                if (error.response?.status === 401) {
                    this.$router.push('/admin/login');
                }
                this.accounts = [];
            } finally {
                this.loading = false;
            }
        },
        editAccount(account) {
            this.editingAccount = account;
            this.showAddModal = true;
        },
        async deleteAccount(account) {
            if (confirm(`Bạn có chắc muốn xóa account "${account.name}"?`)) {
                try {
                    await this.$apiCall('delete', `/api/admin/chatwoot-accounts/${account.id}`);
                    this.loadAccounts();
                } catch (error) {
                    console.error('Error deleting account:', error);
                    if (error.response?.status === 401) {
                        this.$router.push('/admin/login');
                    } else {
                        alert('Có lỗi xảy ra khi xóa account');
                    }
                }
            }
        },
        async testAccount(account) {
            try {
                await this.$apiCall('post', '/api/admin/chatwoot-accounts/test', { accountId: account.id });
                alert('Test account thành công!');
            } catch (error) {
                console.error('Error testing account:', error);
                if (error.response?.status === 401) {
                    this.$router.push('/admin/login');
                } else {
                    alert('Có lỗi xảy ra khi test account');
                }
            }
        },
        closeModal() {
            this.showAddModal = false;
            this.editingAccount = null;
        },
        onAccountSaved() {
            this.closeModal();
            this.loadAccounts();
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('vi-VN');
        }
    }
}
</script>
