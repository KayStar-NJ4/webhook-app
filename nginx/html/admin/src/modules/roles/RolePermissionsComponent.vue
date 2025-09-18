<template>
  <div class="modal-dialog modal-xl">
    <div class="modal-content" :class="{'overlay-wrapper' : is_loading }">
      <div class="overlay" v-if="is_loading">
        <i class="fas fa-3x fa-spinner fa-spin"></i>
        <div class="text-bold pt-2">Đang xử lý...</div>
      </div>
      
      <!-- Header -->
      <div class="modal-header bg-info text-white">
        <h4 class="modal-title mb-0">
          <i class="fas fa-key mr-2"></i>
          {{ isReadOnly ? 'Xem quyền' : 'Quản lý quyền' }} cho vai trò: {{ object_info?.name || '' }}
        </h4>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body p-4" :class="{ 'overlay-wrapper': is_loading }">
        <!-- Warning for super_admin role -->
        <div v-if="isReadOnly" class="alert alert-danger mb-3" role="alert">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <strong>Chú ý:</strong> Vai trò <code>super_admin</code> là vai trò hệ thống và không thể chỉnh sửa quyền. Bạn chỉ có thể xem danh sách quyền hiện tại.
        </div>
        
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-list-check mr-2"></i>
                  Danh sách quyền
                </h5>
              </div>
              <div class="card-body">
                <div v-if="Object.keys(permissions).length === 0" class="text-center py-4">
                  <i class="fas fa-exclamation-triangle fa-2x text-muted mb-3"></i>
                  <p class="text-muted">Không có quyền nào được định nghĩa</p>
                </div>
                
                <div v-else>
                  <div v-for="(actions, feature) in permissions" :key="feature" class="permission-group mb-4">
                    <div class="card">
                      <div class="card-header bg-light">
                        <h6 class="mb-0 d-flex align-items-center">
                          <i class="fas fa-folder mr-2"></i>
                          {{ feature_translations[feature] || feature }}
                          <span class="badge badge-primary ml-2">{{ actions.length }} quyền</span>
                        </h6>
                      </div>
                      <div class="card-body">
                        <div class="row">
                          <div v-for="action in actions" :key="action" class="col-md-3 col-sm-4 col-6 mb-2">
                            <div class="form-check">
                              <input 
                                class="form-check-input" 
                                type="checkbox" 
                                :id="`permission_${feature}_${action}`"
                                :value="`${feature}.${action}`"
                                v-model="selectedPermissions"
                                :disabled="isReadOnly"
                              >
                              <label class="form-check-label" :for="`permission_${feature}_${action}`">
                                {{ action_translations[action] || action }}
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
          class="btn btn-info" 
          @click="handleSelectAll"
          :disabled="isReadOnly"
        >
          <i class="fas fa-check-double mr-1"></i>
          Chọn tất cả
        </button>
        <button 
          type="button" 
          class="btn btn-warning" 
          @click="handleSelectNone"
          :disabled="isReadOnly"
        >
          <i class="fas fa-times-circle mr-1"></i>
          Bỏ chọn tất cả
        </button>
        <button 
          type="button" 
          class="btn btn-success" 
          @click="handleSave"
          :disabled="is_loading || isReadOnly"
        >
          <i class="fas fa-save mr-1" v-if="!is_loading && !isReadOnly"></i>
          <i class="fas fa-times mr-1" v-if="!is_loading && isReadOnly"></i>
          <i class="fas fa-spinner fa-spin mr-1" v-if="is_loading"></i>
          {{ is_loading ? 'Đang xử lý...' : (isReadOnly ? 'Đóng' : 'Lưu quyền') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RolePermissionsComponent',
  props: {
    id: {
      type: [Number, String],
      default: 0
    },
    object_info: {
      type: Object,
      default: () => ({})
    },
    permissions: {
      type: Object,
      default: () => ({})
    },
    feature_translations: {
      type: Object,
      default: () => ({})
    },
    action_translations: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    console.log('RolePermissionsComponent mounted with permissions:', this.permissions)
  },
  data() {
    return {
      is_loading: false,
      selectedPermissions: []
    }
  },
  computed: {
    isSuperAdminRole() {
      return this.object_info?.name === 'super_admin';
    },
    isReadOnly() {
      return this.isSuperAdminRole;
    }
  },
  watch: {
    id: function (newVal) {
      if (newVal && newVal > 0) {
        this.loadRolePermissions();
      }
    },
    object_info: {
      handler: function (newVal) {
        if (newVal && newVal.id) {
          this.loadRolePermissions();
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    loadRolePermissions() {
      if (!this.id || this.id <= 0) {
        this.selectedPermissions = [];
        return;
      }

      // Lấy permissions từ object_info (đã có trong data roles)
      if (this.object_info && this.object_info.permissions) {
        this.selectedPermissions = this.object_info.permissions.map(p => p.name || p);
      } else {
        this.selectedPermissions = [];
      }
    },
    
    handleSelectAll() {
      this.selectedPermissions = [];
      for (const feature in this.permissions) {
        for (const action of this.permissions[feature]) {
          this.selectedPermissions.push(`${feature}.${action}`);
        }
      }
    },
    
    handleSelectNone() {
      this.selectedPermissions = [];
    },
    
    async handleSave() {
      // If in read-only mode, just close the modal
      if (this.isReadOnly) {
        $('#rolePermissionsModal').modal('hide');
        return;
      }

      if (!this.id || this.id <= 0) {
        this.showError('Vai trò không hợp lệ');
        return;
      }

      this.is_loading = true;
      
      try {
        const response = await window.PermissionService.updateRolePermissions(this.id, this.selectedPermissions);
        
        if (response.data.success) {
          this.$emit('success');
          this.showSuccess('Cập nhật quyền thành công');
          $('#rolePermissionsModal').modal('hide');
        } else {
          this.showError(response.data.message || 'Có lỗi xảy ra khi cập nhật quyền');
        }
      } catch (error) {
        console.error('Error saving role permissions:', error);
        this.showError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu quyền');
      } finally {
        this.is_loading = false;
      }
    },
    
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        alert(message);
      }
    },
    
    closePermissionsModal() {
      $('#rolePermissionsModal').modal('hide');
      this.selectedRole = null;
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

.permission-group .card {
  border: 1px solid #dee2e6;
}

.permission-group .card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
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
