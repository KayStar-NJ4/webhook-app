<template>
  <div class="modal-dialog modal-xl">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Đang xử lý...</div>
      </div>
      
      <!-- Header -->
      <div class="modal-header bg-primary text-white">
        <h4 class="modal-title mb-0">
          <i class="fas fa-user-edit mr-2"></i>
          {{ title || (id == 0 ? 'Thêm người dùng mới' : 'Chỉnh sửa thông tin người dùng') }}
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body p-4" :class="{ 'overlay-wrapper': is_loading }">
        <div class="row">
          <!-- Left Column - Basic Info -->
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header bg-light">
                <h5 class="card-title mb-0">
                  <i class="fas fa-info-circle text-primary mr-2"></i>
                  Thông tin cơ bản
                </h5>
              </div>
              <div class="card-body">
                <!-- Username -->
                <form-input-text-component
                  v-model="form_data.username"
                  :placeholder="'Nhập tên đăng nhập'"
                  :label="'Tên đăng nhập'"
                  :required="true"
                  :error="errors.username"
                  :is_row="false"
                  @blur="validateField('username')"
                />

                <!-- Email -->
                <form-input-text-component
                  v-model="form_data.email"
                  type="email"
                  :placeholder="'Nhập địa chỉ email'"
                  :label="'Email'"
                  :required="true"
                  :error="errors.email"
                  :is_row="false"
                  @blur="validateField('email')"
                />

                <!-- Full Name -->
                <form-input-text-component
                  v-model="form_data.full_name"
                  :placeholder="'Nhập họ và tên đầy đủ'"
                  :label="'Họ và tên'"
                  :required="true"
                  :error="errors.full_name"
                  :is_row="false"
                  @blur="validateField('full_name')"
                />

                <!-- Phone Number -->
                <form-input-text-component
                  v-model="form_data.phone_number"
                  type="tel"
                  :placeholder="'Nhập số điện thoại'"
                  :label="'Số điện thoại'"
                  :error="errors.phone_number"
                  :is_row="false"
                  @blur="validateField('phone_number')"
                />
              </div>
            </div>
          </div>

          <!-- Right Column - Additional Info -->
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header bg-light">
                <h5 class="card-title mb-0">
                  <i class="fas fa-user-cog text-primary mr-2"></i>
                  Thông tin bổ sung
                </h5>
              </div>
              <div class="card-body">
                <!-- Avatar -->
                <form-image-component
                  v-model="form_data.avatar"
                  :label="'Ảnh đại diện'"
                  :placeholder="'Chọn ảnh đại diện'"
                  :folder="'user' + (id == 0 ? '/new' : '/'+id)"
                />

                <!-- Gender -->
                <form-select-component
                  v-model="form_data.gender"
                  :label="'Giới tính'"
                  :placeholder="'Chọn giới tính'"
                  :options="list_genders"
                  :value-key="'id'"
                  :label-key="'text'"
                  :is_row="false"
                />

                <!-- Date of Birth -->
                <form-input-date-component
                  id="date_of_birth"
                  name="date_of_birth"
                  label="Ngày sinh"
                  v-model="form_data.date_of_birth"
                  placeholder="Chọn ngày sinh"
                  :is_row="false"
                />

                <!-- Status -->
                <form-check-box-component
                  id="is_active"
                  name="is_active"
                  :label="'Trạng thái'"
                  :checked="form_data.is_active"
                  @update:value="form_data.is_active = $event"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Password Section (only for new users) -->
        <div class="row mt-3" v-if="id == 0">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-warning text-dark">
                <h5 class="card-title mb-0">
                  <i class="fas fa-key mr-2"></i>
                  Mật khẩu đăng nhập
                </h5>
              </div>
              <div class="card-body">
                <form-input-text-component
                  v-model="form_data.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="'Nhập mật khẩu (tối thiểu 8 ký tự)'"
                  :label="'Mật khẩu'"
                  :required="true"
                  :error="errors.password"
                  :show-password-toggle="true"
                  :is_row="false"
                  @blur="validateField('password')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary btn-lg" data-dismiss="modal">
          <i class="fas fa-times mr-2"></i>
          Hủy bỏ
        </button>
        <button 
          type="button" 
          class="btn btn-primary btn-lg" 
          @click="handleSave" 
          :disabled="is_loading || !isFormValid"
        >
          <i class="fas fa-save mr-2"></i>
          {{ is_loading ? 'Đang lưu...' : 'Lưu thông tin' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// All components are loaded globally

export default {
  name: 'UserFormComponent',
  components: {
    // All components are registered globally
  },
  props: ['id', 'object_info', 'list_genders'],
  data() {
    return {
      is_loading: false,
      title: '',
      showPassword: false,
      errors: {},
      form_data: {
        id: '',
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        avatar: '',
        gender: '',
        date_of_birth: '',
        is_active: true,
        password: ''
      }
    }
  },
  computed: {
    isFormValid() {
      // Check required fields
      const requiredFields = ['username', 'email', 'full_name'];
      if (this.id == 0) {
        requiredFields.push('password');
      }
      
      for (let field of requiredFields) {
        if (!this.form_data[field] || this.form_data[field].trim() === '') {
          return false;
        }
      }
      
      // Check if there are any validation errors
      return Object.keys(this.errors).length === 0;
    }
  },
  // validations() {
  //   return {
  //     form_data: {
  //       username: {required: window.required || (() => true)},
  //       email: {email: window.email || (() => true), required: window.required || (() => true)},
  //       full_name: {required: window.required || (() => true)},
  //       password: this.id == 0 ? {required: window.required || (() => true), minLength: window.minLength ? window.minLength(8) : (() => true)} : {}
  //     },
  //   };
  // },
  methods: {
    validateField(fieldName) {
      this.errors[fieldName] = '';
      
      switch (fieldName) {
        case 'username':
          if (!this.form_data.username || this.form_data.username.trim() === '') {
            this.errors.username = 'Tên đăng nhập không được để trống';
          } else if (this.form_data.username.length < 3) {
            this.errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
          } else if (!/^[a-zA-Z0-9_]+$/.test(this.form_data.username)) {
            this.errors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
          }
          break;
          
        case 'email':
          if (!this.form_data.email || this.form_data.email.trim() === '') {
            this.errors.email = 'Email không được để trống';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form_data.email)) {
            this.errors.email = 'Email không đúng định dạng';
          }
          break;
          
        case 'full_name':
          if (!this.form_data.full_name || this.form_data.full_name.trim() === '') {
            this.errors.full_name = 'Họ và tên không được để trống';
          } else if (this.form_data.full_name.length < 2) {
            this.errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
          }
          break;
          
        case 'phone_number':
          if (this.form_data.phone_number && !/^[0-9+\-\s()]+$/.test(this.form_data.phone_number)) {
            this.errors.phone_number = 'Số điện thoại không đúng định dạng';
          }
          break;
          
        case 'password':
          if (this.id == 0) {
            if (!this.form_data.password || this.form_data.password.trim() === '') {
              this.errors.password = 'Mật khẩu không được để trống';
            } else if (this.form_data.password.length < 8) {
              this.errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
            } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(this.form_data.password)) {
              this.errors.password = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số';
            }
          }
          break;
      }
    },
    
    validateAllFields() {
      this.errors = {};
      this.validateField('username');
      this.validateField('email');
      this.validateField('full_name');
      this.validateField('phone_number');
      this.validateField('password');
    },
    
    clearFormData() {
      this.errors = {};
      this.form_data = {
        id: '',
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        avatar: '',
        gender: '',
        date_of_birth: '',
        is_active: true,
        password: ''
      }
      if (this.id != 0 && this.object_info) {
        this.form_data = {
          id: this.id,
          username: this.object_info.username || '',
          email: this.object_info.email || '',
          full_name: this.object_info.full_name || '',
          phone_number: this.object_info.phone_number || '',
          avatar: this.object_info.avatar || '',
          gender: this.object_info.gender || '',
          date_of_birth: this.object_info.date_of_birth || '',
          is_active: this.object_info.is_active !== false,
          password: ''
        }
      }
    },
    handleSave: async function() {
      // Validate all fields before submit
      this.validateAllFields();
      
      if (!this.isFormValid) {
        this.showError('Vui lòng kiểm tra lại thông tin và sửa các lỗi được đánh dấu');
        return;
      }

      this.is_loading = true;
      let _context = this;
      let request;

      // Prepare data for API
      const submitData = Object.assign({}, this.form_data);
      if (this.id == 0) {
        // Creating new user
        delete submitData.id;
      } else {
        // Updating existing user
        delete submitData.password; // Don't send password for updates
      }

      request = this.id == 0 
        ? window.UserService.create(submitData)
        : window.UserService.update(this.id, submitData);

      request
          .then(function(response) {
            _context.is_loading = false;
            if (response.data.success) {
              this.$emit('success');
              this.showSuccess('Lưu thông tin thành công!');
            } else {
              this.showError(response.data.message || 'Có lỗi xảy ra khi lưu dữ liệu');
            }
          }.bind(this))
          .catch(function(error) {
            _context.is_loading = false;
            this.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi lưu dữ liệu');
          }.bind(this));
    },
    showError(message) {
      // You can implement toast notification here
      alert(message);
    },
    showSuccess(message) {
      // You can implement toast notification here
      alert(message);
    }
  },
  watch: {
    id: function (newVal, oldVal) {
      this.clearFormData();
      if (newVal == 0) {
        this.title = 'Thêm người dùng';
      } else {
        this.title = 'Sửa người dùng';
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
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 0.375rem;
}

.modal-xl {
  max-width: 1200px;
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

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border-radius: 0.75rem;
}

.card-header {
  border-bottom: 1px solid #e9ecef;
  border-radius: 0.75rem 0.75rem 0 0 !important;
  padding: 1rem 1.25rem;
}

.card-body {
  padding: 1.25rem;
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

.invalid-feedback {
  display: block;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.text-muted {
  color: #6c757d !important;
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

.pt-2 {
  padding-top: 0.5rem !important;
}

.text-bold {
  font-weight: bold;
}

.font-italic {
  font-style: italic;
}

/* Animation for form validation */
.form-control-lg.is-invalid {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
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
</style>
