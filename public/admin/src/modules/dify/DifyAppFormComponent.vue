<template>
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div class="modal-content" :class="{'overlay-wrapper' : saving }">
            <div class="overlay" v-if="saving">
                <i class="fas fa-3x fa-spinner fa-spin"></i>
                <div class="text-bold pt-2">Đang xử lý...</div>
            </div>
            
            <div class="modal-header bg-primary text-white">
                <h4 class="modal-title mb-0">
                    <i class="fas fa-robot mr-2"></i>
                    {{ object_info && object_info.id ? 'Sửa App' : 'Thêm App mới' }}
                </h4>
                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" @click="resetForm">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form @submit.prevent="save">
                        <div class="row">
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.name"
                                    label="Tên App"
                                    placeholder="Nhập tên app"
                                    :required="true"
                                />
                            </div>
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.apiUrl"
                                    type="url"
                                    label="API URL"
                                    placeholder="https://api.dify.ai"
                                    :required="true"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.appId"
                                    label="App ID"
                                    placeholder="Nhập App ID"
                                    :required="true"
                                />
                            </div>
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.apiKey"
                                    type="password"
                                    label="API Key"
                                    placeholder="Nhập API Key"
                                    :required="true"
                                    :show-password-toggle="true"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.timeout"
                                    type="number"
                                    label="Timeout (ms)"
                                    placeholder="30000"
                                    :required="true"
                                    help-text="Thời gian chờ tối đa cho API calls (1000-300000ms)"
                                />
                            </div>
                            <div class="col-md-6">
                                <div class="form-group mt-4">
                                    <div class="form-check">
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input" 
                                            id="isActive"
                                            v-model="form.isActive"
                                        >
                                        <label class="form-check-label" for="isActive">
                                            Kích hoạt app
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            <div class="modal-footer bg-light">
                <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="resetForm">
                    <i class="fas fa-times mr-1"></i>
                    Hủy
                </button>
                <button type="button" class="btn btn-primary" @click="save" :disabled="saving">
                    <i class="fas fa-save mr-1" v-if="!saving"></i>
                    <i class="fas fa-spinner fa-spin mr-1" v-if="saving"></i>
                    {{ saving ? 'Đang xử lý...' : (object_info && object_info.id ? 'Cập nhật' : 'Thêm mới') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DifyAppFormComponent',
    components: {
        FormInputTextComponent: window.FormInputTextComponent
    },
    props: {
        object_info: {
            type: Object,
            default: () => ({})
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
                timeout: 30000,
                isActive: true
            }
        }
    },
    mounted() {
        this.setupModalEvents();
        this.loadFormData();
    },
    watch: {
        object_info: {
            handler() {
                this.loadFormData();
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        loadFormData() {
            if (this.object_info && this.object_info.id) {
                this.form = {
                    name: this.object_info.name || '',
                    apiUrl: this.object_info.api_url || '',
                    appId: this.object_info.app_id || '',
                    apiKey: this.object_info.api_key || '',
                    timeout: this.object_info.timeout || 30000,
                    isActive: this.object_info.is_active !== undefined ? this.object_info.is_active : true
                };
            } else {
                this.clearFormData();
            }
        },
        async save() {
            // Validate form
            if (!this.form.name || !this.form.apiUrl || !this.form.appId || !this.form.apiKey) {
                window.ToastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            this.saving = true;
            try {
                let response;
                if (this.object_info && this.object_info.id) {
                    response = await window.DifyService.update(this.object_info.id, this.form);
                } else {
                    response = await window.DifyService.create(this.form);
                }
                
                if (response.data.success) {
                    window.ToastService.success(this.object_info && this.object_info.id ? 'Cập nhật app thành công' : 'Tạo app thành công');
                    this.$emit('create:success');
                    this.resetForm();
                    this.close();
                } else {
                    window.ToastService.error('Có lỗi xảy ra khi lưu app');
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    window.ToastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else {
                    window.ToastService.handleError(error, 'Có lỗi xảy ra khi lưu app');
                }
            } finally {
                this.saving = false;
            }
        },
        close() {
            this.resetForm();
            $('#form-modal').modal('hide');
            this.$emit('close');
        },
        resetForm() {
            this.clearFormData();
        },
        clearFormData() {
            this.form = {
                name: '',
                apiUrl: '',
                appId: '',
                apiKey: '',
                timeout: 30000,
                isActive: true
            };
        },
        setupModalEvents() {
            // Listen for modal close events
            const modal = document.getElementById('form-modal');
            if (modal) {
                modal.addEventListener('hidden.bs.modal', () => {
                    // Reset form to empty state when modal is closed
                    this.resetForm();
                });
                
                // Also listen for modal show to reset form when opening
                modal.addEventListener('show.bs.modal', () => {
                    this.resetForm();
                });
            }
        }
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
</style>