<template>
  <div class="modal-dialog modal-xl" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="rolePermissionsModalLabel">
          Quyền của vai trò {{ role.name }}
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div v-if="isLoading" class="text-center">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Đang tải...</p>
        </div>
        <div v-else>
          <div class="row">
            <div class="col-md-6">
              <h6>Quyền có sẵn</h6>
              <div class="permission-list">
                <div 
                  v-for="permission in availablePermissions" 
                  :key="permission.id"
                  class="form-check"
                >
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :id="`permission_${permission.id}`"
                    :value="permission.id"
                    v-model="selectedPermissions"
                  >
                  <label class="form-check-label" :for="`permission_${permission.id}`">
                    <strong>{{ permission.resource }}</strong>: {{ permission.action }}
                    <small class="text-muted d-block">{{ permission.description }}</small>
                  </label>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6>Quyền đã chọn</h6>
              <div class="selected-permissions">
                <div 
                  v-for="permissionId in selectedPermissions" 
                  :key="permissionId"
                  class="selected-permission-item"
                >
                  <span class="badge badge-primary">
                    {{ getPermissionById(permissionId).resource }}:{{ getPermissionById(permissionId).action }}
                  </span>
                </div>
                <div v-if="selectedPermissions.length === 0" class="text-muted">
                  Chưa chọn quyền nào
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="handleSave"
          :disabled="isSaving"
        >
          <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
          {{ isSaving ? 'Đang lưu...' : 'Lưu' }}
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
    }
  },
  data() {
    return {
      role: {},
      availablePermissions: [],
      selectedPermissions: [],
      isLoading: false,
      isSaving: false
    }
  },
  watch: {
    object_info: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.role = newVal
          this.loadRolePermissions()
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadAvailablePermissions()
  },
  methods: {
    async loadAvailablePermissions() {
      this.isLoading = true
      try {
        const response = await window.PermissionService.getList()
        if (response.data.success) {
          this.availablePermissions = response.data.data.permissions || response.data.data
        }
      } catch (error) {
        console.error('Error loading permissions:', error)
      } finally {
        this.isLoading = false
      }
    },
    async loadRolePermissions() {
      if (!this.id) return
      
      try {
        const response = await window.RoleService.getRolePermissions(this.id)
        if (response.data.success) {
          this.selectedPermissions = (response.data.data.permissions || []).map(p => p.id)
        }
      } catch (error) {
        console.error('Error loading role permissions:', error)
      }
    },
    getPermissionById(id) {
      return this.availablePermissions.find(p => p.id === id) || {}
    },
    async handleSave() {
      this.isSaving = true
      try {
        const response = await window.RoleService.updateRolePermissions(this.id, this.selectedPermissions)
        if (response.data.success) {
          this.$emit('success', response.data.data)
        }
      } catch (error) {
        console.error('Error saving role permissions:', error)
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
.permission-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  padding: 10px;
  border-radius: 4px;
}

.selected-permissions {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  padding: 10px;
  border-radius: 4px;
}

.selected-permission-item {
  margin-bottom: 5px;
}
</style>
