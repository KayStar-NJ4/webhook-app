<template>
  <div class="roles-page">
    <role-list-component
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Role Form -->
    <div class="modal fade" id="form-modal" tabindex="-1" role="dialog" aria-labelledby="formModalLabel" aria-hidden="true">
      <role-form-component
        :id="isEdit ? selectedRole.id : 0"
        :object_info="selectedRole"
        @success="handleFormSuccess"
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
      isEdit: false,
      selectedRole: null,
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
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

    openCreateModal() {
      this.isEdit = false
      this.selectedRole = null
      $('#form-modal').modal('show')
    },

    openEditModal(role) {
      this.isEdit = true
      this.selectedRole = Object.assign({}, role)
      $('#form-modal').modal('show')
    },


    async handleDelete(role) {
      try {
        const response = await window.RoleService.delete(role.id)
        if (response.data.success) {
          if (window.ToastService && window.ToastService.success) {
            window.ToastService.success('Xóa vai trò thành công')
          }
        }
      } catch (error) {
        if (window.ToastService && window.ToastService.error) {
          window.ToastService.error('Lỗi kết nối mạng')
        }
      }
    },

    handleFormSuccess() {
      $('#form-modal').modal('hide')
      if (window.ToastService && window.ToastService.success) {
        window.ToastService.success(this.isEdit ? 'Cập nhật vai trò và quyền thành công' : 'Tạo vai trò thành công')
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
