<template>
  <div class="modal-dialog modal-lg">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Đang xử lý...</div>
      </div>
      
      <!-- Header -->
      <div class="modal-header bg-info text-white">
        <h4 class="modal-title mb-0">
          <i class="fas fa-users mr-2"></i>
          Quản lý vai trò cho: {{ object_info?.username || '' }} ({{ object_info?.full_name || '' }})
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body p-4" :class="{ 'overlay-wrapper': is_loading }">
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-list mr-2"></i>
                  Vai trò hiện tại ({{ userRoles.length }})
                </h5>
              </div>
              <div class="card-body">
                <div v-if="userRoles.length === 0" class="text-center py-3">
                  <i class="fas fa-exclamation-triangle fa-2x text-muted mb-2"></i>
                  <p class="text-muted">Chưa có vai trò nào</p>
                </div>
                <div v-else>
                  <div v-for="role in userRoles" :key="role.id" class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <strong>{{ role.name }}</strong>
                      <br>
                      <small class="text-muted">{{ role.description || 'Không có mô tả' }}</small>
                    </div>
                    <button 
                      class="btn btn-sm btn-danger"
                      @click="removeRole(role.id)"
                      :disabled="is_loading"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-plus mr-2"></i>
                  Thêm vai trò
                </h5>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Chọn vai trò:</label>
                  <select v-model="selectedRoleId" class="form-control">
                    <option value="">-- Chọn vai trò --</option>
                    <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                      {{ role.name }} - {{ role.description || 'Không có mô tả' }}
                    </option>
                  </select>
                </div>
                <button 
                  class="btn btn-success btn-block"
                  @click="addRole"
                  :disabled="!selectedRoleId || is_loading"
                >
                  <i class="fas fa-plus mr-1"></i>
                  Thêm vai trò
                </button>
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
  name: 'UserRolesComponent',
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
      selectedRoleId: '',
      allRoles: [],
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
        this.availableRoles = [];
        return;
      }

      this.is_loading = true;
      try {
        await Promise.all([
          this.loadUserRoles(),
          this.loadAllRoles()
        ]);
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
          this.updateAvailableRoles();
        }
      } catch (error) {
        console.error('Error loading user roles:', error);
      }
    },

    async loadAllRoles() {
      try {
        const response = await window.RoleService.getList();
        if (response.data.success) {
          this.allRoles = response.data.data || [];
          this.updateAvailableRoles();
        }
      } catch (error) {
        console.error('Error loading all roles:', error);
      }
    },

    updateAvailableRoles() {
      const userRoleIds = this.userRoles.map(role => role.id);
      this.availableRoles = this.allRoles.filter(role => !userRoleIds.includes(role.id));
    },

    async addRole() {
      if (!this.selectedRoleId) return;

      this.is_loading = true;
      try {
        const response = await window.RoleService.assignRoleToUser(this.selectedRoleId, this.id);
        if (response.data.success) {
          this.showSuccess('Thêm vai trò thành công');
          this.selectedRoleId = '';
          await this.loadUserRoles();
        } else {
          this.showError(response.data.message || 'Có lỗi xảy ra khi thêm vai trò');
        }
      } catch (error) {
        console.error('Error adding role:', error);
        this.showError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm vai trò');
      } finally {
        this.is_loading = false;
      }
    },

    async removeRole(roleId) {
      this.is_loading = true;
      try {
        const response = await window.RoleService.removeRoleFromUser(roleId, this.id);
        if (response.data.success) {
          this.showSuccess('Xóa vai trò thành công');
          await this.loadUserRoles();
        } else {
          this.showError(response.data.message || 'Có lỗi xảy ra khi xóa vai trò');
        }
      } catch (error) {
        console.error('Error removing role:', error);
        this.showError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa vai trò');
      } finally {
        this.is_loading = false;
      }
    },

    handleSave() {
      // Roles are already saved when added/removed, just close modal
      this.$emit('success');
      this.showSuccess('Cập nhật vai trò thành công');
      $('#userRolesModal').modal('hide');
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
