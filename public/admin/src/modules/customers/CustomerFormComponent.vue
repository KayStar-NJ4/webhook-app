<template>
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div class="modal-content" :class="{'overlay-wrapper' : saving }">
            <div class="overlay" v-if="saving">
                <i class="fas fa-3x fa-spinner fa-spin"></i>
                <div class="text-bold pt-2">Đang xử lý...</div>
            </div>
            
            <div class="modal-header bg-primary text-white">
                <h4 class="modal-title mb-0">
                    <i class="fas fa-user mr-2"></i>
                    {{ object_info && object_info.id ? 'Sửa Khách hàng' : 'Thêm Khách hàng mới' }}
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
                                label="Tên khách hàng"
                                placeholder="Nhập tên khách hàng"
                                :required="true"
                            />
                        </div>
                        <div class="col-md-6">
                            <form-input-text-component
                                v-model="form.email"
                                type="email"
                                label="Email"
                                placeholder="Nhập email"
                                :required="true"
                            />
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <form-input-text-component
                                v-model="form.company"
                                label="Công ty"
                                placeholder="Nhập tên công ty"
                            />
                        </div>
                        <div class="col-md-6">
                            <form-input-text-component
                                v-model="form.subject"
                                label="Chủ đề"
                                placeholder="Nhập chủ đề"
                                :required="true"
                            />
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <form-select-component
                                v-model="form.status"
                                label="Trạng thái"
                                :options="[
                                    { value: 'new', label: 'Mới' },
                                    { value: 'contacted', label: 'Đã liên hệ' },
                                    { value: 'in_progress', label: 'Đang xử lý' },
                                    { value: 'resolved', label: 'Đã giải quyết' },
                                    { value: 'closed', label: 'Đóng' }
                                ]"
                                :required="true"
                            />
                        </div>
                        <div class="col-md-6">
                            <form-input-text-component
                                v-model="form.source"
                                label="Nguồn"
                                placeholder="Nhập nguồn"
                                readonly
                            />
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Nội dung *</label>
                                <textarea 
                                    v-model="form.message"
                                    class="form-control"
                                    rows="4"
                                    placeholder="Nhập nội dung"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Ghi chú</label>
                                <textarea 
                                    v-model="form.notes"
                                    class="form-control"
                                    rows="3"
                                    placeholder="Nhập ghi chú"
                                ></textarea>
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
    name: 'CustomerFormComponent',
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
                email: '',
                company: '',
                subject: '',
                message: '',
                status: 'new',
                source: 'admin',
                notes: ''
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
    computed: {
        statusOptions() {
            return [
                { value: 'new', label: 'Mới' },
                { value: 'contacted', label: 'Đã liên hệ' },
                { value: 'in_progress', label: 'Đang xử lý' },
                { value: 'resolved', label: 'Đã giải quyết' },
                { value: 'closed', label: 'Đã đóng' }
            ];
        }
    },
    methods: {
        loadFormData() {
            if (this.object_info && this.object_info.id) {
                this.form = {
                    name: this.object_info.name || '',
                    email: this.object_info.email || '',
                    company: this.object_info.company || '',
                    subject: this.object_info.subject || '',
                    message: this.object_info.message || '',
                    status: this.object_info.status || 'new',
                    source: this.object_info.source || 'admin',
                    notes: this.object_info.notes || ''
                };
            } else {
                this.resetForm();
            }
        },
        resetForm() {
            this.form = {
                name: '',
                email: '',
                company: '',
                subject: '',
                message: '',
                status: 'new',
                source: 'admin',
                notes: ''
            };
            this.saving = false;
        },
        async save() {
            // Validate required fields
            if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) {
                this.showError('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }

            this.saving = true;
            
            try {
                let response;
                if (this.object_info && this.object_info.id) {
                    // Update existing
                    response = await window.CustomerService.update(this.object_info.id, this.form);
                } else {
                    // Create new
                    response = await window.CustomerService.create(this.form);
                }
                
                if (response.data.success) {
                    this.showSuccess(this.object_info && this.object_info.id ? 'Cập nhật khách hàng thành công' : 'Thêm khách hàng thành công');
                    this.$emit('create:success');
                    this.resetForm();
                    $('#form-modal').modal('hide');
                }
            } catch (error) {
                console.error('Save customer error:', error);
                this.showError(this.object_info && this.object_info.id ? 'Không thể cập nhật khách hàng' : 'Không thể tạo khách hàng');
            } finally {
                this.saving = false;
            }
        },
        showSuccess(message) {
            if (window.toast) {
                window.toast.success(message);
            } else {
                this.showFallbackToast(message, 'success');
            }
        },
        showError(message) {
            if (window.toast) {
                window.toast.error(message);
            } else {
                this.showFallbackToast(message, 'error');
            }
        },
        showFallbackToast(message, type) {
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                info: '#17a2b8'
            };
            const toastId = `toast-${Date.now()}`;
            const toastHTML = `
                <div id="${toastId}" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${colors[type]};
                    color: white;
                    padding: 16px 24px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 350px;
                    animation: slideIn 0.3s ease-out;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="font-size: 20px;"></i>
                        <span style="flex: 1;">${message}</span>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', toastHTML);
            
            setTimeout(() => {
                const toast = document.getElementById(toastId);
                if (toast) {
                    toast.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 3000);
        },
        close() {
            this.resetForm();
            $('#form-modal').modal('hide');
            this.$emit('close');
        },
        setupModalEvents() {
            const modal = document.getElementById('form-modal');
            if (modal) {
                modal.addEventListener('hidden.bs.modal', () => {
                    this.resetForm();
                });
                modal.addEventListener('show.bs.modal', () => {
                    this.loadFormData();
                });
            }
        }
    }
}
</script>
