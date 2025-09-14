<template>
    <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ account ? 'Sửa Account' : 'Thêm Account mới' }}</h4>
                    <button type="button" class="close" @click="close">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form @submit.prevent="save">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Tên Account</label>
                                    <input type="text" class="form-control" v-model="form.name" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>URL</label>
                                    <input type="url" class="form-control" v-model="form.url" required
                                           placeholder="https://yourdomain.chatwoot.com">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Account ID</label>
                                    <input type="text" class="form-control" v-model="form.accountId" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Inbox ID</label>
                                    <input type="text" class="form-control" v-model="form.inboxId">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>API Token</label>
                                    <input type="password" class="form-control" v-model="form.apiToken" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Webhook Token</label>
                                    <input type="password" class="form-control" v-model="form.webhookToken" required>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" v-model="form.isActive" id="isActive">
                                <label class="form-check-label" for="isActive">
                                    Kích hoạt account
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="close">Hủy</button>
                    <button type="button" class="btn btn-primary" @click="save" :disabled="saving">
                        <span v-if="saving" class="spinner-border spinner-border-sm mr-2"></span>
                        {{ saving ? 'Đang lưu...' : (account ? 'Cập nhật' : 'Thêm') }}
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    </div>
</template>

<script>
export default {
    name: 'ChatwootAccountFormComponent',
    props: {
        account: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            saving: false,
            form: {
                name: '',
                url: '',
                accountId: '',
                inboxId: '',
                apiToken: '',
                webhookToken: '',
                isActive: true
            }
        }
    },
    mounted() {
        if (this.account) {
            this.form = { ...this.account };
        }
    },
    methods: {
        async save() {
            this.saving = true;
            try {
                if (this.account) {
                    await this.$apiCall('put', `/api/admin/chatwoot-accounts/${this.account.id}`, this.form);
                } else {
                    await this.$apiCall('post', '/api/admin/chatwoot-accounts', this.form);
                }
                this.$emit('saved');
            } catch (error) {
                console.error('Error saving account:', error);
                if (error.response?.status === 401) {
                    window.ToastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    this.$router.push('/admin/login');
                } else {
                    window.ToastService.handleError(error, 'Có lỗi xảy ra khi lưu account');
                }
            } finally {
                this.saving = false;
            }
        },
        close() {
            this.$emit('close');
        }
    }
}
</script>
