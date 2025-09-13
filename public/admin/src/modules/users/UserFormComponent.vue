<template>
  <div class="modal-dialog modal-lg">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Loading...</div>
      </div>
      <div class="modal-header">
        <h4 class="modal-title">
          {{ title || (id == 0 ? 'Thêm người dùng' : 'Sửa người dùng') }}
          <span class="text-bold font-italic">{{ form_data.username }}</span>
        </h4>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div class="modal-body" :class="{ 'overlay-wrapper': is_loading }">
      <form-input-text-component
          v-model="form_data.username"
          :placeholder="'Tên đăng nhập'"
          :label="'Tên đăng nhập'"
          :required="true"
      />

      <form-input-text-component
          v-model="form_data.email"
        type="email"
          :placeholder="'Email'"
          :label="'Email'"
        :required="true"
      />

      <form-input-text-component
          v-model="form_data.full_name"
          :placeholder="'Họ và tên'"
          :label="'Họ và tên'"
          :required="true"
      />

      <form-input-text-component
          v-model="form_data.phone_number"
          :placeholder="'Số điện thoại'"
          :label="'Số điện thoại'"
        />

        <form-image-component
          v-model="form_data.avatar"
          :placeholder="'Ảnh đại diện'"
          :label="'Ảnh đại diện'"
          :folder="'user' + (id == 0 ? '/new' : '/'+id)"
        />

        <form-select-component
          v-model="form_data.gender"
          :placeholder="'Chọn giới tính'"
          :label="'Giới tính'"
          :options="list_genders"
          value-key="id"
          label-key="text"
        />

        <form-input-date-component
          id="date_of_birth"
          name="date_of_birth"
          label="Ngày sinh"
          v-model="form_data.date_of_birth"
          placeholder="Chọn ngày sinh"
        />

        <form-check-box-component
          id="form_data_is_active"
          name="is_active"
          :label="'Trạng thái hoạt động'"
          :checked="form_data.is_active"
          @change="form_data.is_active = $event"
        />


        <form-input-text-component
          v-if="id == 0"
          v-model="form_data.password"
          :type="is_view_password ? 'text' : 'password'"
          :placeholder="'Mật khẩu'"
          :label="'Mật khẩu'"
          :required="true"
        />

      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-danger" data-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" @click="handleSave" :disabled="is_loading">
          {{ is_loading ? 'Đang lưu...' : 'Lưu' }}
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
  // setup() {
  //   return {
  //     v$: window.useVuelidate ? window.useVuelidate() : null
  //   }
  // },
  data() {
    return {
      is_loading: false,
      title: '',
      is_view_password: false,
      form_data: {
        id: '',
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        avatar: '',
        gender: '',
        date_of_birth: '',
        presenter_phone_number: '',
        is_active: true,
        phone_number_verified: false,
        email_verified: false,
        password: ''
      }
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
    clearFormData() {
      this.form_data = {
        id: '',
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        avatar: '',
        gender: '',
        date_of_birth: '',
        presenter_phone_number: '',
        is_active: true,
        phone_number_verified: false,
        email_verified: false,
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
          presenter_phone_number: this.object_info.presenter_phone_number || '',
          is_active: this.object_info.is_active !== false,
          phone_number_verified: this.object_info.phone_number_verified || false,
          email_verified: this.object_info.email_verified || false,
          password: ''
        }
      }
    },
    randomPassword() {
      let length = 8,
          charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+",
          retVal = "";
      for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
      }

      this.form_data.password = retVal;
      this.is_view_password = true;
    },
    handleSave: async function() {
      // Validation disabled for now
      // if (!result) {
      //   return
      // }

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

.text-bold {
  font-weight: bold;
}

.font-italic {
  font-style: italic;
}
</style>
