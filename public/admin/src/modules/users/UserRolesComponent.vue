<template>
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="userRolesModalLabel">
          Vai trò của {{ user.name }}
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
              <h6>Vai trò có sẵn</h6>
              <div class="role-list">
                <div 
                  v-for="role in availableRoles" 
                  :key="role.id"
                  class="form-check"
                >
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :id="`role_${role.id}`"
                    :value="role.id"
                    v-model="selectedRoles"
                  >
                  <label class="form-check-label" :for="`role_${role.id}`">
                    <strong>{{ role.name }}</strong>
                    <small class="text-muted d-block">{{ role.description }}</small>
                  </label>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6>Vai trò đã chọn</h6>
              <div class="selected-roles">
                <div 
                  v-for="roleId in selectedRoles" 
                  :key="roleId"
                  class="selected-role-item"
                >
                  <span class="badge badge-primary">
                    {{ getRoleById(roleId).name }}
                  </span>
                </div>
                <div v-if="selectedRoles.length === 0" class="text-muted">
                  Chưa chọn vai trò nào
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
      user: {},
      availableRoles: [],
      selectedRoles: [],
      isLoading: false,
      isSaving: false
    }
  },
  watch: {
    object_info: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.user = newVal
          this.loadUserRoles()
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadAvailableRoles()
  },
  methods: {
    async loadAvailableRoles() {
      this.isLoading = true
      try {
        const response = await window.RoleService.getList()
        if (response.data.success) {
          this.availableRoles = response.data.data.roles || response.data.data
        }
      } catch (error) {
        console.error('Error loading roles:', error)
      } finally {
        this.isLoading = false
      }
    },
    async loadUserRoles() {
      if (!this.id) return
      
      try {
        const response = await window.UserService.getUserRoles(this.id)
        if (response.data.success) {
          this.selectedRoles = (response.data.data.roles || []).map(r => r.id)
        }
      } catch (error) {
        console.error('Error loading user roles:', error)
      }
    },
    getRoleById(id) {
      return this.availableRoles.find(r => r.id === id) || {}
    },
    async handleSave() {
      this.isSaving = true
      try {
        const response = await window.UserService.updateUserRoles(this.id, this.selectedRoles)
        if (response.data.success) {
          this.$emit('success', response.data.data)
        }
      } catch (error) {
        console.error('Error saving user roles:', error)
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
.role-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  padding: 10px;
  border-radius: 4px;
}

.selected-roles {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  padding: 10px;
  border-radius: 4px;
}

.selected-role-item {
  margin-bottom: 5px;
}
</style>
