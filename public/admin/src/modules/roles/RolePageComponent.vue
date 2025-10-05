<template>
  <div class="roles-page">
    <role-list-component
      :roles="roles"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @permissions="openPermissionsModal"
      @delete="handleDelete"
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
        @success="handlePermissionsSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'RolesPage',
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
      userPermissions: {}
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
          this.roles = response.data.data.roles || response.data.data
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error('Lỗi kết nối mạng')
        }
      } finally {
        this.isLoading = false
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

    async handleDelete(role) {
      try {
        const response = await window.RoleService.delete(role.id)
        if (response.data.success) {
          this.loadRoles()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa vai trò thành công')
          }
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error('Lỗi kết nối mạng')
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
