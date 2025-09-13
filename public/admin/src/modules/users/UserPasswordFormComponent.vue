<template>
  <div class="modal-dialog modal-lg">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Loading...</div>
      </div>
      <div class="modal-header">
        <h4 class="modal-title">Đổi mật khẩu</h4>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div class="modal-body" :class="{ 'overlay-wrapper': is_loading }">
        <form-input-text-component
          v-model="form_data.password"
          :type="is_view_password ? 'text' : 'password'"
          :placeholder="'Mật khẩu mới'"
          :label="'Mật khẩu mới'"
          :required="true"
        />

        <form-input-text-component
          v-model="form_data.password_confirm"
          :type="is_view_password_confirm ? 'text' : 'password'"
          :placeholder="'Xác nhận mật khẩu'"
          :label="'Xác nhận mật khẩu'"
          :required="true"
        />

        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          <strong>Lưu ý:</strong> Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất một chữ cái và một số.
        </div>

      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-danger" data-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" @click="handleSave" :disabled="is_loading">
          {{ is_loading ? 'Đang lưu...' : 'Lưu mật khẩu' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// All components are loaded globally

export default {
  name: 'UserPasswordFormComponent',
  components: {
    // All components are registered globally
  },
  props: ['id', 'object_info'],
  // setup() {
  //   return {
  //     v$: window.useVuelidate ? window.useVuelidate() : null
  //   }
  // },
  data() {
    return {
      is_loading: false,
      form_data: {
        password: '',
        password_confirm: '',
      },
      is_view_password: false,
      is_view_password_confirm: false,
    }
  },
  // validations() {
  //   return {
  //     form_data: {
  //       password: {required: window.required || (() => true), minLength: window.minLength ? window.minLength(6) : (() => true)},
  //       password_confirm: {required: window.required || (() => true), minLength: window.minLength ? window.minLength(6) : (() => true)},
  //     },
  //   };
  // },
  methods: {
    clearFormData() {
      this.form_data = {
        password: '',
        password_confirm: '',
      }

      this.is_view_password = false;
      this.is_view_password_confirm = false;
    },
    updateFormData(key, value) {
      this.form_data[key] = value;
    },
    randomPassword() {
      let length = 12,
          charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+",
          retVal = "";
      for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
      }

      this.form_data.password = retVal;
      this.form_data.password_confirm = retVal;
      this.is_view_password = true;
      this.is_view_password_confirm = false;
    },
    handleSave: async function() {
      // Validation disabled for now
      // if (!result) {
      //   return
      // }

      if (this.form_data.password !== this.form_data.password_confirm) {
        this.showError('Mật khẩu xác nhận không khớp');
        return
      }

      // Validate password strength
      if (!this.validatePasswordStrength(this.form_data.password)) {
        this.showError('Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất một chữ cái và một số');
        return
      }

      this.is_loading = true;
      let _context = this;

      window.UserService.changePassword(this.id, this.form_data.password)
        .then(function(response) {
          _context.is_loading = false;
          if (response.data.success) {
            this.$emit('success');
            this.clearFormData();
          } else {
            this.showError(response.data.message || 'Có lỗi xảy ra khi đổi mật khẩu');
          }
        }.bind(this))
        .catch(function(error) {
          _context.is_loading = false;
          this.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        }.bind(this));
    },
    validatePasswordStrength(password) {
      // At least 8 characters
      if (password.length < 8) return false;
      
      // At least one letter
      if (!/[a-zA-Z]/.test(password)) return false;
      
      // At least one number
      if (!/\d/.test(password)) return false;
      
      return true;
    },
    showError(message) {
      // You can implement toast notification here
      alert(message);
    }
  },
  watch: {
    id: function (newVal, oldVal) {
      this.clearFormData();
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

.cursor_pointer {
  cursor: pointer;
}

.text-danger {
  color: #dc3545 !important;
}

.is-invalid {
  border-color: #dc3545;
}

.form-group {
  margin-bottom: 1rem;
}

.input-group-text {
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  color: #495057;
}

.input-group-text:hover {
  background-color: #dee2e6;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.text-bold {
  font-weight: bold;
}
</style>
