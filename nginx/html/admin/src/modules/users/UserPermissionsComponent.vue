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
          <i class="fas fa-user-shield mr-2"></i>
          Quản lý vai trò: {{ object_info?.username || '' }} ({{ object_info?.full_name || '' }})
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body p-4" :class="{ 'overlay-wrapper': is_loading }">
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-users mr-2"></i>
                  Chọn vai trò cho người dùng
                </h5>
              </div>
              <div class="card-body">
                <div v-if="availableRoles.length === 0" class="text-center py-4">
                  <i class="fas fa-exclamation-triangle fa-2x text-muted mb-3"></i>
                  <p class="text-muted">Không có vai trò nào được định nghĩa</p>
                </div>
                
                <div v-else>
                  <div class="row">
                    <div v-for="role in availableRoles" :key="role.id" class="col-md-6 col-lg-4 mb-3">
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          :id="`role_${role.id}`"
                          :value="role.id"
                          v-model="selectedRoles"
                          :disabled="is_loading"
                        >
                        <label class="form-check-label" :for="`role_${role.id}`">
                          <strong>{{ role.name }}</strong>
                          <br>
                          <small class="text-muted">{{ role.description || 'Không có mô tả' }}</small>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">
          <i class="fas fa-times mr-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-success" 
          @click="handleSave"
          :disabled="is_loading"
        >
          <i class="fas fa-save mr-1" v-if="!is_loading"></i>
          <i class="fas fa-spinner fa-spin mr-1" v-if="is_loading"></i>
          {{ is_loading ? 'Đang xử lý...' : 'Lưu thay đổi' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserPermissionsComponent',
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
      userRoles: [],
      selectedRoles: [],
      availableRoles: []
    }
  },
  watch: {
    id: function (newVal) {
      if (newVal && newVal > 0) {
        this.loadUserData();
      }
    },
    object_info: {
      handler: function (newVal) {
        if (newVal && newVal.id) {
          this.loadUserData();
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    async loadUserData() {
      if (!this.id || this.id <= 0) {
        this.userRoles = [];
        this.selectedRoles = [];
        return;
      }

      this.is_loading = true;
      try {
        // Load user data
        await Promise.all([
          this.loadUserRoles(),
          this.loadAvailableRoles()
        ]);
        
        // Set selected roles based on user's current roles
        this.selectedRoles = this.userRoles.map(role => role.id);
      } catch (error) {
        console.error('Error loading user data:', error);
        this.showError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        this.is_loading = false;
      }
    },


    async loadUserRoles() {
      try {
        const response = await window.UserService.getUserRoles(this.id);
        if (response.data.success) {
          this.userRoles = response.data.data || [];
        }
      } catch (error) {
        console.error('Error loading user roles:', error);
      }
    },

    async loadAvailableRoles() {
      try {
        const response = await window.RoleService.getList();
        if (response.data.success) {
          this.availableRoles = response.data.data || [];
        }
      } catch (error) {
        console.error('Error loading available roles:', error);
      }
    },



    async handleSave() {
      this.is_loading = true;
      
      try {
        // Update user roles only
        await this.updateUserRoles();
        
        this.$emit('success');
        this.showSuccess('Cập nhật vai trò thành công');
        $('#permissions-modal').modal('hide');
      } catch (error) {
        console.error('Error saving user data:', error);
        this.showError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu');
      } finally {
        this.is_loading = false;
      }
    },

    async updateUserRoles() {
      try {
        const response = await window.UserService.updateUserRoles(this.id, this.selectedRoles);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Có lỗi xảy ra khi cập nhật vai trò');
        }
      } catch (error) {
        console.error('Error updating user roles:', error);
        throw error;
      }
    },

    
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        alert(message);
      }
    },
    
    showError(message) {
      if (window.toast) {
        window.toast.error(message);
      } else {
        alert(message);
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

.form-check {
  padding-left: 1.5rem;
}

.form-check-input {
  margin-top: 0.25rem;
}

.form-check-label {
  font-size: 0.9rem;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
