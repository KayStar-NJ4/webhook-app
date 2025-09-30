<template>
  <div class="modal-dialog modal-xl">
    <div class="modal-content" :class="{'overlay-wrapper' : saving }">
      <div class="overlay" v-if="saving">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Đang xử lý...</div>
      </div>
      
      <!-- Header -->
      <div class="modal-header bg-primary text-white">
        <h4 class="modal-title mb-0">
          <i class="fas fa-comments mr-2"></i>
          {{ isEdit ? 'Chỉnh sửa tài khoản Chatwoot' : 'Thêm tài khoản Chatwoot mới' }}
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" @click="resetForm">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <!-- Body -->
      <div class="modal-body p-6" :class="{ 'overlay-wrapper': saving }">
        <div class="row">
          <div class="col-md-6">
            <!-- Tên tài khoản -->
            <form-input-text-component
              v-model="form.name"
              :placeholder="'Nhập tên tài khoản'"
              :label="'Tên tài khoản'"
              :required="true"
              :is_row="false"
            />
          </div>
          <div class="col-md-6">
            <!-- Base URL -->
            <form-input-text-component
              v-model="form.base_url"
              :placeholder="'https://yourdomain.chatwoot.com'"
              :label="'Base URL'"
              :required="true"
              :is_row="false"
            />
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <!-- Account ID -->
            <form-input-text-component
              v-model="form.account_id"
              :placeholder="'Nhập Account ID'"
              :label="'Account ID'"
              :required="true"
              :is_row="false"
            />
          </div>
          <div class="col-md-6">
            <!-- Inbox ID -->
            <form-input-text-component
              v-model="form.inbox_id"
              :placeholder="'Nhập Inbox ID (mặc định: 1)'"
              :label="'Inbox ID'"
              :is_row="false"
            />
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-12">
            <!-- Access Token -->
            <div class="form-group">
              <label>Access Token <span class="text-danger">*</span></label>
              <div class="input-group">
                <input 
                  :type="showToken ? 'text' : 'password'" 
                  class="form-control" 
                  v-model="form.access_token" 
                  required
                  placeholder="Nhập Access Token"
                >
                <div class="input-group-append">
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary" 
                    @click="showToken = !showToken"
                  >
                    <i :class="showToken ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-12">
            <!-- Trạng thái -->
            <form-check-box-component
              :checked="form.is_active"
              :label="'Kích hoạt tài khoản'"
              :is_row="false"
              :id="'isActive'"
              :name="'is_active'"
              @update:value="form.is_active = $event"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="resetForm">
          <i class="fas fa-times mr-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="handleSave"
          :disabled="saving"
        >
          <i class="fas fa-save mr-1" v-if="!saving"></i>
          <i class="fas fa-spinner fa-spin mr-1" v-if="saving"></i>
          {{ saving ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm mới') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatwootAccountFormComponent',
  props: {
    id: {
      type: [Number, String],
      default: 0
    },
    object_info: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      saving: false,
      showToken: false,
      form: {
        name: '',
        base_url: '',
        account_id: '',
        inbox_id: '',
        access_token: '',
        is_active: true
      }
    }
  },
  computed: {
    isEdit() {
      return this.id && this.id !== 0;
    }
  },
  mounted() {
    this.clearFormData();
    this.setupModalEvents();
  },
  watch: {
    id: function (newVal, oldVal) {
      this.clearFormData();
    },
    object_info: {
      handler: function (newVal) {
        if (newVal && newVal.name) {
          this.form.name = newVal.name || '';
          this.form.base_url = newVal.base_url || '';
          this.form.account_id = newVal.account_id || '';
          this.form.inbox_id = newVal.inbox_id || '';
          this.form.access_token = newVal.access_token || '';
          this.form.is_active = newVal.is_active !== undefined ? newVal.is_active : true;
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    async handleSave() {
      this.saving = true;
      try {
        // Validate form
        if (!this.form.name?.trim() || !this.form.base_url?.trim() || !this.form.account_id?.trim() || !this.form.access_token?.trim()) {
          this.showError('Vui lòng điền đầy đủ thông tin bắt buộc: Tên, Base URL, Account ID và Access Token');
          this.saving = false;
          return;
        }

        // Prepare data for API - try both formats
        const data = {
          name: this.form.name.trim(),
          baseUrl: this.form.base_url.trim(),
          base_url: this.form.base_url.trim(),
          accountId: this.form.account_id.trim(),
          account_id: this.form.account_id.trim(),
          accessToken: this.form.access_token.trim(),
          access_token: this.form.access_token.trim(),
          inboxId: this.form.inbox_id || 1,
          inbox_id: this.form.inbox_id || 1,
          isActive: this.form.is_active,
          is_active: this.form.is_active
        };

        if (this.isEdit) {
          const response = await window.ChatwootService.update(this.id, data);
          this.showSuccess('Cập nhật tài khoản Chatwoot thành công');
        } else {
          const response = await window.ChatwootService.create(data);
          this.showSuccess('Thêm tài khoản Chatwoot thành công');
        }
        
        this.$emit('success');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu tài khoản Chatwoot';
        this.showError(errorMessage);
      } finally {
        this.saving = false;
      }
    },
           clearFormData() {
             this.form = {
               name: '',
               base_url: '',
               account_id: '',
               inbox_id: '',
               access_token: '',
               is_active: true
             };
             this.showToken = false;
           },
           resetForm() {
             this.clearFormData();
           },
           setupModalEvents() {
             // Listen for modal close events
             const modal = document.getElementById('chatwootAccountFormModal');
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
        warning: '#ffc107',
        info: '#17a2b8'
      };
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      `;
      
      toast.innerHTML = `
        <span style="margin-right: 8px;">${icons[type]}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
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
