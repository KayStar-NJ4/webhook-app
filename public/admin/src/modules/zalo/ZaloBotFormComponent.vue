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
                    {{ object_info && object_info.id ? 'Sửa Bot' : 'Thêm Bot mới' }}
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
                                    label="Tên Bot"
                                    placeholder="Nhập tên bot"
                                    :required="true"
                                />
                            </div>
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.botToken"
                                    type="password"
                                    label="Bot Token"
                                    placeholder="Nhập Bot Token"
                                    :required="true"
                                    :show-password-toggle="true"
                                    auto-complete="off"
                                    :is-token="true"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <form-input-text-component
                                    v-model="form.secretToken"
                                    type="password"
                                    label="Secret Token"
                                    placeholder="Nhập Secret Token (tùy chọn)"
                                    help-text="Token bí mật để bảo mật webhook (chỉ A-Z, a-z, 0-9, _, -). Tự động tạo khi tạo bot mới."
                                    :show-password-toggle="true"
                                    auto-complete="off"
                                    :is-token="true"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group mt-4">
                                    <div class="form-check">
                                        <input 
                                            type="checkbox" 
                                            class="form-check-input" 
                                            :id="activeId"
                                            v-model="form.isActive"
                                        >
                                        <label class="form-check-label" :for="activeId">
                                            Kích hoạt bot
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
    name: 'ZaloBotFormComponent',
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
                botToken: '',
                secretToken: '',
                apiUrl: 'https://bot.zapps.me',
                isActive: true
            }
        }
    },
  computed: {
    activeId() {
      return `zaloBotActive_${this.object_info?.id || 'new'}`
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
                // Edit mode - load existing data
                this.form = {
                    name: this.object_info.name || '',
                    botToken: this.object_info.bot_token || '',
                    secretToken: this.object_info.secret_token || '',
                    isActive: this.object_info.is_active !== undefined ? this.object_info.is_active : true
                };
            } else {
                // Create mode - auto-generate secret token
                this.clearFormData();
                this.form.secretToken = this.generateSecretToken();
            }
        },
        async save() {
            // Validate form
            if (!this.form.name || !this.form.botToken) {
                window.ToastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            this.saving = true;
            try {
                let response;
                if (this.object_info && this.object_info.id) {
                    response = await window.ZaloService.update(this.object_info.id, this.form);
                } else {
                    response = await window.ZaloService.create(this.form);
                }
                
                if (response.data.success) {
                    window.ToastService.success(this.object_info && this.object_info.id ? 'Cập nhật bot thành công' : 'Tạo bot thành công');
                    this.$emit('create:success');
                    this.resetForm();
                    this.close();
                } else {
                    window.ToastService.error('Có lỗi xảy ra khi lưu bot');
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    window.ToastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else {
                    window.ToastService.handleError(error, 'Có lỗi xảy ra khi lưu bot');
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
                botToken: '',
                secretToken: '',
                isActive: true
            };
        },
        generateSecretToken() {
            // Generate random secret token following Zalo's requirements:
            // 8-256 characters, only A-Z, a-z, 0-9, _ and - are allowed
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
            let token = 'zalo_' + Date.now() + '_';
            for (let i = 0; i < 16; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return token;
        },
        setupModalEvents() {
            const modal = document.getElementById('form-modal');
            if (modal) {
                modal.addEventListener('hidden.bs.modal', () => {
                    this.resetForm();
                });
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
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>

