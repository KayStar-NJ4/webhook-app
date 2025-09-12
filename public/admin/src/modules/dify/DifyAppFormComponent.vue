<template>
    <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ app ? 'Sửa App' : 'Thêm App mới' }}</h4>
                    <button type="button" class="close" @click="close">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form @submit.prevent="save">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Tên App</label>
                                    <input type="text" class="form-control" v-model="form.name" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>API URL</label>
                                    <input type="url" class="form-control" v-model="form.apiUrl" required
                                           placeholder="https://api.dify.ai">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>App ID</label>
                                    <input type="text" class="form-control" v-model="form.appId" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>API Key</label>
                                    <input type="password" class="form-control" v-model="form.apiKey" required>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Mô tả</label>
                            <textarea class="form-control" v-model="form.description" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" v-model="form.isActive" id="isActive">
                                <label class="form-check-label" for="isActive">
                                    Kích hoạt app
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="close">Hủy</button>
                    <button type="button" class="btn btn-primary" @click="save" :disabled="saving">
                        <span v-if="saving" class="spinner-border spinner-border-sm mr-2"></span>
                        {{ saving ? 'Đang lưu...' : (app ? 'Cập nhật' : 'Thêm') }}
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    </div>
</template>

<script>
export default {
    name: 'DifyAppFormComponent',
    props: {
        app: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            saving: false,
            form: {
                name: '',
                apiUrl: '',
                appId: '',
                apiKey: '',
                description: '',
                isActive: true
            }
        }
    },
    mounted() {
        if (this.app) {
            this.form = { ...this.app };
        }
    },
    methods: {
        async save() {
            this.saving = true;
            try {
                if (this.app) {
                    await this.$apiCall('put', `/api/admin/dify-apps/${this.app.id}`, this.form);
                } else {
                    await this.$apiCall('post', '/api/admin/dify-apps', this.form);
                }
                this.$emit('saved');
            } catch (error) {
                console.error('Error saving app:', error);
                if (error.response?.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    this.$router.push('/admin/login');
                } else {
                    alert('Có lỗi xảy ra khi lưu app: ' + (error.response?.data?.message || error.message));
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
