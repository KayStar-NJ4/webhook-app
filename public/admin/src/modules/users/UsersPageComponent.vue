<template>
  <div class="users-page">
    <user-list-component
      :users="users"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="deleteUser"
    />

    <!-- Modal for User Form -->
    <div class="modal fade" id="userFormModal" tabindex="-1" role="dialog" aria-labelledby="userFormModalLabel" aria-hidden="true">
      <user-form-component
        :id="isEdit ? selectedUser.id : 0"
        :object_info="selectedUser"
        :list_genders="listGenders"
        @success="handleFormSuccess"
      />
    </div>

    <!-- Modal for Password Form -->
    <div class="modal fade" id="userPasswordModal" tabindex="-1" role="dialog" aria-labelledby="userPasswordModalLabel" aria-hidden="true">
      <user-password-form-component
        :id="selectedUser ? selectedUser.id : 0"
        :object_info="selectedUser"
        @success="handlePasswordSuccess"
      />
    </div>
  </div>
</template>

<script>
// UserService sẽ được sử dụng từ window.UserService

export default {
  name: 'UsersPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      users: [],
      showModal: false,
      isEdit: false,
      selectedUser: null,
      errors: {},
      userPermissions: {},
      listGenders: [
        { id: 'male', text: 'Nam' },
        { id: 'female', text: 'Nữ' },
        { id: 'other', text: 'Khác' }
      ]
    }
  },
  mounted() {
    this.loadUserData()
    this.loadUsers()
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

    async loadUsers() {
      this.isLoading = true
      try {
        const response = await window.UserService.getList()
        
        if (response.data.success) {
          this.users = response.data.data.users || response.data.data
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error(this.$t('errors.networkError'))
        }
      } finally {
        this.isLoading = false
      }
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedUser = null
      this.errors = {}
      $('#userFormModal').modal('show')
    },

    openEditModal(user) {
      this.isEdit = true
      this.selectedUser = Object.assign({}, user)
      this.errors = {}
      $('#userFormModal').modal('show')
    },

    closeModal() {
      $('#userFormModal').modal('hide')
      this.selectedUser = null
      this.errors = {}
    },

    openPasswordModal(user) {
      this.selectedUser = Object.assign({}, user)
      $('#userPasswordModal').modal('show')
    },

    closePasswordModal() {
      $('#userPasswordModal').modal('hide')
      this.selectedUser = null
    },

    async handleSave(formData) {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await window.UserService.update(this.selectedUser.id, formData)
          : await window.UserService.create(formData)
        
        if (response.data.success) {
          this.closeModal()
          this.loadUsers()
          if (this.$toast && this.$toast.success) {
            this.$toast.success(
              this.isEdit ? this.$t('users.messages.updated') : this.$t('users.messages.created')
            )
          }
        } else {
          this.errors = response.data.errors || {}
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          if (this.$toast && this.$toast.error) {
            this.$toast.error(this.$t('errors.networkError'))
          }
        }
      } finally {
        this.isSaving = false
      }
    },

    handleFormSuccess() {
      this.closeModal()
      this.loadUsers()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công')
      }
    },

    handlePasswordSuccess() {
      this.closePasswordModal()
      if (this.$toast && this.$toast.success) {
        this.$toast.success('Đổi mật khẩu thành công')
      }
    },

    async deleteUser(id) {
      try {
        const response = await window.UserService.delete(id)
        
        if (response.data.success) {
          this.loadUsers()
          if (this.$toast && this.$toast.success) {
            this.$toast.success(this.$t('users.messages.deleted'))
          }
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error(this.$t('errors.networkError'))
        }
      }
    }
  }
}
</script>

<style scoped>
.users-page {
  padding: 20px;
}
</style>
