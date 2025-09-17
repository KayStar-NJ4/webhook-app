<template>
  <div class="roles-page">
    <role-list-component
      :roles="roles"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      :permissions="permissions"
      :feature_translations="feature_translations"
      :action_translations="action_translations"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="deleteRole"
    />

    <!-- Modal for Role Form -->
    <div class="modal fade" id="roleFormModal" tabindex="-1" role="dialog" aria-labelledby="roleFormModalLabel" aria-hidden="true">
      <role-form-component
        :id="isEdit ? selectedRole.id : 0"
        :object_info="selectedRole"
        @success="handleFormSuccess"
      />
    </div>

    <!-- Modal for Role Permissions -->
    <div class="modal fade" id="rolePermissionsModal" tabindex="-1" role="dialog" aria-labelledby="rolePermissionsModalLabel" aria-hidden="true">
      <role-permissions-component
        :id="selectedRole ? selectedRole.id : 0"
        :object_info="selectedRole"
        :permissions="permissions"
        :feature_translations="feature_translations"
        :action_translations="action_translations"
        @success="handlePermissionsSuccess"
      />
    </div>
  </div>
</template>

<script>
// RoleService sẽ được sử dụng từ window.RoleService

export default {
  name: 'RolePage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      roles: [],
      showModal: false,
      isEdit: false,
      selectedRole: null,
      errors: {},
      userPermissions: {},
      permissions: {},
      feature_translations: {},
      action_translations: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadRoles()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          this.userPermissions = user?.permissions || {}
        } catch (error) {
          this.userPermissions = {}
        }
      }
    },

    async loadRoles() {
      this.isLoading = true
      try {
        const response = await window.RoleService.getList()
        
        if (response.data.success) {
          this.roles = response.data.data || []
          // Extract permissions from roles data if available
          if (this.roles.length > 0 && this.roles[0].permissions) {
            this.extractPermissionsFromRoles()
          } else {
            // Fallback to separate permissions API if roles don't include permissions
            this.loadPermissions()
          }
        }
      } catch (error) {
        console.error('Error loading roles:', error)
        this.roles = []
      } finally {
        this.isLoading = false
      }
    },

    extractPermissionsFromRoles() {
      // Extract all unique permissions from roles
      const allPermissions = new Set()
      this.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            allPermissions.add(permission)
          })
        }
      })

      // Group permissions by feature
      const groupedPermissions = {}
      allPermissions.forEach(permission => {
        const [feature, action] = permission.split('.')
        if (feature && action) {
          if (!groupedPermissions[feature]) {
            groupedPermissions[feature] = []
          }
          groupedPermissions[feature].push(action)
        }
      })

      this.permissions = groupedPermissions
    },

    async loadPermissions() {
      try {
        const response = await window.PermissionService.getPermissionsForAssignment()
        const permissionsData = response.data.permissions || []
        
        // Convert new format to old format for compatibility
        const groupedPermissions = {}
        const featureTranslations = {}
        const actionTranslations = {}
        
        permissionsData.forEach(group => {
          const resource = group.resource
          featureTranslations[resource] = group.resourceName
          
          if (!groupedPermissions[resource]) {
            groupedPermissions[resource] = []
          }
          
          group.actions.forEach(action => {
            groupedPermissions[resource].push(action.action)
            actionTranslations[action.action] = action.actionName
          })
        })
        
        this.permissions = groupedPermissions
        this.feature_translations = featureTranslations
        this.action_translations = actionTranslations
      } catch (error) {
        console.error('Error loading permissions:', error)
        this.permissions = {}
        this.feature_translations = {}
        this.action_translations = {}
      }
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedRole = null
      this.errors = {}
      $('#roleFormModal').modal('show')
    },

    openEditModal(role) {
      this.isEdit = true
      this.selectedRole = Object.assign({}, role)
      this.errors = {}
      $('#roleFormModal').modal('show')
    },

    openPermissionsModal(role) {
      this.selectedRole = Object.assign({}, role)
      $('#rolePermissionsModal').modal('show')
    },

    closeModal() {
      $('#roleFormModal').modal('hide')
      this.selectedRole = null
      this.errors = {}
    },

    closePermissionsModal() {
      $('#rolePermissionsModal').modal('hide')
      this.selectedRole = null
    },

    async deleteRole(role) {
      if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) {
        try {
          await window.RoleService.delete({ id: role.id })
          this.loadRoles()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa vai trò thành công!')
          }
        } catch (error) {
          console.error('Error deleting role:', error)
          if (this.$toast && this.$toast.error) {
            this.$toast.error('Có lỗi xảy ra khi xóa vai trò!')
          }
        }
      }
    },

    handleFormSuccess() {
      this.closeModal()
      this.loadRoles()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật vai trò thành công' : 'Tạo vai trò thành công')
      }
    },

    handlePermissionsSuccess() {
      this.closePermissionsModal()
      this.loadRoles()
      if (this.$toast && this.$toast.success) {
        this.$toast.success('Cập nhật quyền thành công')
      }
    }
  }
}
</script>

<style scoped>
.roles-page {
  padding: 20px;
}
</style>
