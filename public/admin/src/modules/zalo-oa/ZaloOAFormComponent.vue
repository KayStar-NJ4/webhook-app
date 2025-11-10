<template>
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div class="modal-content" :class="{'overlay-wrapper' : saving }">
            <div class="overlay" v-if="saving">
                <i class="fas fa-3x fa-spinner fa-spin"></i>
                <div class="text-bold pt-2">Đang xử lý...</div>
            </div>
            
            <div class="modal-header bg-primary text-white">
                <h4 class="modal-title mb-0">
                    <i class="fas fa-building mr-2"></i>
                    {{ object_info && object_info.id ? 'Sửa OA' : 'Thêm OA mới' }}
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
                                    label="Tên OA"
                                    placeholder="Nhập tên Official Account"
                                    :required="true"
                                    help-text="Tên để quản lý OA trong hệ thống (có thể tự đặt)"
                                />
                            </div>
                            <div class="col-md-6">
                                <form-input-text-component
                                    v-model="form.oaId"
                                    label="OA ID"
                                    placeholder="Nhập OA ID"
                                    :required="true"
                                    help-text="OA ID từ Zalo Developer Console (Thông tin ứng dụng → OA ID)"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <form-input-text-component
                                    v-model="form.accessToken"
                                    type="password"
                                    label="Access Token"
                                    placeholder="Nhập Access Token"
                                    :required="true"
                                    :show-password-toggle="true"
                                    auto-complete="off"
                                    :is-token="true"
                                    help-text="Access Token từ Zalo Developer Console. Vào 'Công cụ' → 'API Explorer' → Chọn 'OA Access Token' → Nhấn 'Lấy Access Token' và chọn OA để lấy token."
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <form-input-text-component
                                    v-model="form.refreshToken"
                                    type="password"
                                    label="Refresh Token"
                                    placeholder="Nhập Refresh Token (tùy chọn)"
                                    help-text="Token để làm mới Access Token khi hết hạn"
                                    :show-password-toggle="true"
                                    auto-complete="off"
                                    :is-token="true"
                                />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <form-input-text-component
                                    v-model="form.secretKey"
                                    type="password"
                                    label="Secret Key"
                                    placeholder="Nhập Secret Key (tùy chọn)"
                                    help-text="Key bí mật để xác thực webhook từ Zalo. Tự động tạo khi tạo OA mới."
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
                                            Kích hoạt OA
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row" v-if="object_info && object_info.id && object_info.webhook_url">
                            <div class="col-md-12">
                                <div class="alert alert-info">
                                    <strong>Webhook URL:</strong><br>
                                    <code>{{ object_info.webhook_url }}</code><br>
                                    <small>Sử dụng URL này để cấu hình webhook trên Zalo Developer Console</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Hướng dẫn lấy thông tin -->
                        <div class="row mt-3" v-if="!object_info || !object_info.id">
                            <div class="col-md-12">
                                <div class="alert alert-info">
                                    <h6 class="mb-2">
                                        <i class="fas fa-info-circle mr-2"></i>
                                        <strong>Hướng dẫn lấy thông tin từ Zalo Developer Console</strong>
                                    </h6>
                                    <div class="small">
                                        <p class="mb-2"><strong>Bước 1: Đăng nhập Zalo Developer Console</strong></p>
                                        <ul class="mb-2 pl-3">
                                            <li>Truy cập: <a href="https://developers.zalo.me/" target="_blank">https://developers.zalo.me/</a></li>
                                            <li>Đăng nhập bằng tài khoản Zalo của bạn</li>
                                        </ul>
                                        
                                        <p class="mb-2"><strong>Bước 2: Tạo hoặc chọn ứng dụng</strong></p>
                                        <ul class="mb-2 pl-3">
                                            <li>Vào <strong>"Ứng dụng"</strong> → Tạo mới hoặc chọn ứng dụng có sẵn</li>
                                            <li>Chọn loại ứng dụng: <strong>"Official Account"</strong></li>
                                        </ul>
                                        
                                        <p class="mb-2"><strong>Bước 3: Lấy thông tin</strong></p>
                                        <ul class="mb-2 pl-3">
                                            <li><strong>Tên OA:</strong> Tên Official Account của bạn (tự đặt để quản lý trong hệ thống)</li>
                                            <li><strong>OA ID:</strong> 
                                                <ul class="mt-1 pl-3">
                                                    <li>Vào <strong>"Thông tin ứng dụng"</strong> → Copy <strong>"ID ứng dụng"</strong></li>
                                                    <li>Ví dụ: <code>3289040014649103195</code></li>
                                                </ul>
                                            </li>
                                            <li><strong>Access Token:</strong> 
                                                <ul class="mt-1 pl-3">
                                                    <li><strong>Cách 1:</strong> Vào <strong>"Công cụ"</strong> → <strong>"API Explorer"</strong></li>
                                                    <li>Chọn ứng dụng của bạn</li>
                                                    <li>Chọn loại <strong>"OA Access Token"</strong></li>
                                                    <li>Nhấn <strong>"Lấy Access Token"</strong> và chọn OA tương ứng</li>
                                                    <li>Đồng ý cho phép ứng dụng quản lý OA</li>
                                                    <li>Copy <strong>"Access Token"</strong> được hiển thị</li>
                                                    <li><strong>Cách 2:</strong> Vào <strong>"API và Cấp quyền"</strong> → <strong>"Đăng ký sử dụng API"</strong></li>
                                                    <li>Đăng ký sử dụng API nếu chưa có</li>
                                                    <li>Tìm phần Access Token sau khi đăng ký</li>
                                                    <li><strong>Lưu ý:</strong> Access Token có thời hạn ngắn (thường 1 giờ), cần refresh định kỳ</li>
                                                </ul>
                                            </li>
                                            <li><strong>Refresh Token:</strong> 
                                                <ul class="mt-1 pl-3">
                                                    <li>Thường được hiển thị cùng với Access Token trong <strong>"API Explorer"</strong></li>
                                                    <li>Copy <strong>"Refresh Token"</strong> (nếu có)</li>
                                                    <li><strong>Lưu ý:</strong> Refresh Token có thời hạn dài hơn (thường 30 ngày) và dùng để lấy Access Token mới</li>
                                                    <li>Nếu không có Refresh Token, bạn có thể để trống (không bắt buộc)</li>
                                                </ul>
                                            </li>
                                            <li><strong>Secret Key:</strong> 
                                                <ul class="mt-1 pl-3">
                                                    <li>Vào <strong>"Webhook"</strong> trong ứng dụng</li>
                                                    <li>Tìm phần <strong>"Secret Key"</strong> hoặc <strong>"Khóa bí mật"</strong></li>
                                                    <li>Copy Secret Key hoặc để hệ thống tự tạo (sẽ hiển thị sau khi tạo OA)</li>
                                                    <li><strong>Lưu ý:</strong> Secret Key dùng để xác thực webhook từ Zalo</li>
                                                </ul>
                                            </li>
                                        </ul>
                                        
                                        <p class="mb-0"><strong>Lưu ý:</strong> Sau khi tạo OA, bạn cần cấu hình Webhook URL trên Zalo Developer Console để nhận tin nhắn từ người dùng.</p>
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
    name: 'ZaloOAFormComponent',
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
                oaId: '',
                accessToken: '',
                refreshToken: '',
                secretKey: '',
                isActive: true
            }
        }
    },
  computed: {
    activeId() {
      return `zaloOAActive_${this.object_info?.id || 'new'}`
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
                    oaId: this.object_info.oa_id || '',
                    accessToken: this.object_info.access_token || '',
                    refreshToken: this.object_info.refresh_token || '',
                    secretKey: this.object_info.secret_key || '',
                    isActive: this.object_info.is_active !== undefined ? this.object_info.is_active : true
                };
            } else {
                // Create mode - auto-generate secret key
                this.clearFormData();
                this.form.secretKey = this.generateSecretKey();
            }
        },
        async save() {
            // Validate form
            if (!this.form.name || !this.form.oaId || !this.form.accessToken) {
                window.ToastService.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            this.saving = true;
            try {
                let response;
                if (this.object_info && this.object_info.id) {
                    response = await window.ZaloOAService.update(this.object_info.id, this.form);
                } else {
                    response = await window.ZaloOAService.create(this.form);
                }
                
                if (response.data.success) {
                    window.ToastService.success(this.object_info && this.object_info.id ? 'Cập nhật OA thành công' : 'Tạo OA thành công');
                    this.$emit('create:success');
                    this.resetForm();
                    this.close();
                } else {
                    window.ToastService.error('Có lỗi xảy ra khi lưu OA');
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    window.ToastService.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else {
                    window.ToastService.handleError(error, 'Có lỗi xảy ra khi lưu OA');
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
                oaId: '',
                accessToken: '',
                refreshToken: '',
                secretKey: '',
                isActive: true
            };
        },
        generateSecretKey() {
            // Generate random secret key following Zalo's requirements:
            // 8-256 characters, only A-Z, a-z, 0-9, _ and - are allowed
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
            let key = 'zalo_oa_' + Date.now() + '_';
            for (let i = 0; i < 16; i++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return key;
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

