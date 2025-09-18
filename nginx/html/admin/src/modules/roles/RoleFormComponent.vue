<template>
  <div class="modal-dialog modal-lg">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Đang xử lý...</div>
      </div>
      
      <!-- Header -->
      <div class="modal-header bg-primary text-white">
        <h4 class="modal-title mb-0">
          <i class="fas fa-user-tag mr-2"></i>
          {{ title || (id == 0 ? 'Thêm vai trò mới' : 'Chỉnh sửa vai trò') }}
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" @click="resetForm">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body p-6" :class="{ 'overlay-wrapper': is_loading }">
        <!-- Warning for super_admin role -->
        <div v-if="isSuperAdminRole" class="alert alert-warning mb-3" role="alert">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <strong>Chú ý:</strong> Vai trò <code>super_admin</code> là vai trò hệ thống. Bạn chỉ có thể chỉnh sửa mô tả, không thể thay đổi tên vai trò.
        </div>
        
        <div class="row">
          <div class="col-12">
            <!-- Role Name -->
            <form-input-text-component
              v-model="form_data.name"
              :placeholder="'Nhập tên vai trò'"
              :label="'Tên vai trò'"
              :required="true"
              :error="errors.name"
              :is_row="false"
              :disabled="isSuperAdminRole"
              @blur="validateField('name')"
            />

            <!-- Description -->
            <FormInputTextAreaComponent
              v-model="form_data.description"
              :placeholder="'Nhập mô tả vai trò'"
              :label="'Mô tả'"
              :rows="3"
              :is_row="false"
              :error="errors.description"
              @blur="validateField('description')"
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
          :disabled="is_loading || !isFormValid"
        >
          <i class="fas fa-save mr-1" v-if="!is_loading"></i>
          <i class="fas fa-spinner fa-spin mr-1" v-if="is_loading"></i>
          {{ is_loading ? 'Đang xử lý...' : (id == 0 ? 'Thêm mới' : 'Cập nhật') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleFormComponent',
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
      is_loading: false,
      title: '',
      form_data: {
        name: '',
        description: ''
      },
      errors: {}
    }
  },
  mounted() {
    this.clearFormData();
    this.setupModalEvents();
  },
  watch: {
    id: function (newVal, oldVal) {
      this.clearFormData();
      if (newVal == 0) {
        this.title = 'Thêm vai trò mới';
      } else {
        this.title = 'Chỉnh sửa vai trò';
      }
    },
    object_info: {
      handler: function (newVal) {
        if (newVal && newVal.name) {
          this.form_data.name = newVal.name || '';
          this.form_data.description = newVal.description || '';
        }
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    isFormValid() {
      // Check required fields
      if (!this.form_data.name || this.form_data.name.trim() === '') {
        return false;
      }
      
      // Check if there are any validation errors
      const hasErrors = Object.keys(this.errors).length > 0;
      
      return !hasErrors;
    },
    isSuperAdminRole() {
      return this.form_data.name === 'super_admin';
    },
    isReadOnly() {
      return false; // Không còn sử dụng isReadOnly nữa, chỉ dùng isSuperAdminRole
    }
  },
  methods: {
    clearFormData() {
      this.errors = {};
      this.form_data = {
        name: '',
        description: ''
      }
      if (this.id != 0 && this.object_info && this.object_info.name) {
        this.form_data.name = this.object_info.name || '';
        this.form_data.description = this.object_info.description || '';
      }
    },
    
    resetForm() {
      this.form_data = {
        name: '',
        description: ''
      };
      this.errors = {};
      
      if (this.id != 0 && this.object_info && this.object_info.name) {
        this.form_data.name = this.object_info.name || '';
        this.form_data.description = this.object_info.description || '';
      }
    },
    
    validateField(field) {
      if (field === 'name' && !this.form_data.name.trim()) {
        this.errors.name = 'Tên vai trò là bắt buộc';
      } else {
        delete this.errors.name;
      }
      
      if (field === 'description' && this.form_data.description && this.form_data.description.length > 500) {
        this.errors.description = 'Mô tả không được vượt quá 500 ký tự';
      } else {
        delete this.errors.description;
      }
    },
    
    validateAllFields() {
      this.errors = {};
      this.validateField('name');
      this.validateField('description');
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      if (!this.form_data.name.trim()) {
        this.errors.name = 'Tên vai trò là bắt buộc';
        isValid = false;
      }
      
      if (this.form_data.description && this.form_data.description.length > 500) {
        this.errors.description = 'Mô tả không được vượt quá 500 ký tự';
        isValid = false;
      }
      
      return isValid;
    },
    
    async handleSave() {
      this.validateAllFields();
      
      if (!this.isFormValid) {
        this.showError('Vui lòng kiểm tra lại thông tin và sửa các lỗi được đánh dấu');
        return;
      }

      this.is_loading = true;
      
      try {
        let formData;
        
        if (this.isSuperAdminRole) {
          // Đối với super_admin, chỉ cập nhật mô tả
          formData = {
            description: this.form_data.description.trim()
          };
        } else {
          // Đối với các vai trò khác, cập nhật cả tên và mô tả
          formData = {
            name: this.form_data.name.trim(),
            description: this.form_data.description.trim()
          };
        }

        let response;
        if (this.id == 0) {
          response = await window.RoleService.create(formData);
        } else {
          response = await window.RoleService.update({ id: this.id, ...formData });
        }

        if (response.data.success) {
          this.$emit('success');
          this.showSuccess('Lưu vai trò thành công!');
          this.resetForm();
        } else {
          this.errors = response.data.errors || {};
          this.showError(response.data.message || 'Có lỗi xảy ra');
        }
      } catch (error) {
        console.error('Error saving role:', error);
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors;
        }
        this.showError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu vai trò');
      } finally {
        this.is_loading = false;
      }
    },
    
    showError(message) {
      if (window.toast) {
        window.toast.error(message);
      } else {
        this.showFallbackToast(message, 'error');
      }
    },
    
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        this.showFallbackToast(message, 'success');
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
    },
    
    setupModalEvents() {
      // Listen for modal close events
      const modal = document.getElementById('roleFormModal');
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

.modal-header {
  border-bottom: 1px solid #dee2e6;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animation for form validation */
.form-control.is-invalid {
  animation: shake 0.5s ease-in-out;
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.invalid-feedback {
  display: block;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: #dc3545;
}

.form-label {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.form-control-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.form-control-lg:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control-lg.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes slideIn {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

/* Hover effects */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15);
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.bg-primary {
  background-color: #007bff !important;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.bg-warning {
  background-color: #ffc107 !important;
}

.font-weight-bold {
  font-weight: 700 !important;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.mr-1 {
  margin-right: 0.25rem !important;
}

.mr-2 {
  margin-right: 0.5rem !important;
}

.mt-3 {
  margin-top: 1rem !important;
}

.p-4 {
  padding: 1.5rem !important;
}

.p-6 {
  padding: 2rem !important;
}

.pt-2 {
  padding-top: 0.5rem !important;
}

.text-bold {
  font-weight: bold;
}

.font-italic {
  font-style: italic;
}

.custom-switch .custom-control-label::before {
  border-radius: 0.5rem;
  height: 1.5rem;
  width: 3rem;
}

.custom-switch .custom-control-input:checked ~ .custom-control-label::after {
  background-color: #28a745;
  border-radius: 50%;
  height: 1.25rem;
  width: 1.25rem;
  transform: translateX(1.5rem);
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.form-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.text-muted {
  color: #6c757d !important;
}

.modal-lg {
  max-width: 800px;
}

.h-100 {
  height: 100% !important;
}

.justify-content-between {
  justify-content: space-between !important;
}

.text-primary {
  color: #007bff !important;
}

.text-white {
  color: #fff !important;
}

.text-dark {
  color: #343a40 !important;
}

.col-12 {
  flex: 0 0 100%;
  max-width: 100%;
}

.col-md-6 {
  flex: 0 0 50%;
  max-width: 50%;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15px;
  margin-left: -15px;
}

.d-flex {
  display: flex !important;
}

.align-items-center {
  align-items: center !important;
}

.ml-2 {
  margin-left: 0.5rem !important;
}

.badge {
  display: inline-block;
  padding: 0.25em 0.4em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
}

.badge-primary {
  color: #fff;
  background-color: #007bff;
}

.form-check {
  position: relative;
  display: block;
  padding-left: 1.25rem;
}

.form-check-input {
  position: absolute;
  margin-top: 0.3rem;
  margin-left: -1.25rem;
}

.form-check-label {
  margin-bottom: 0;
  font-size: 0.9rem;
  cursor: pointer;
}

.form-group {
  margin-bottom: 1rem;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  color: #495057;
  background-color: #fff;
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control:disabled {
  background-color: #e9ecef;
  opacity: 1;
}

.form-control:read-only {
  background-color: #e9ecef;
  opacity: 1;
}

.form-control-plaintext {
  display: block;
  width: 100%;
  padding: 0.375rem 0;
  margin-bottom: 0;
  line-height: 1.5;
  color: #212529;
  background-color: transparent;
  border: solid transparent;
  border-width: 1px 0;
}

.form-control:valid {
  border-color: #28a745;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='m2.3 6.73.94-.94 1.88 1.88L7.7 4.5l.94.94L4.12 10.5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control:invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 4.6 1.4 1.4m0-1.4-1.4 1.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}
</style>
