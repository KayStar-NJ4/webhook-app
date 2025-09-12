<template>
  <div class="users-page">
    <UserListComponent
      :users="users"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="deleteUser"
    />

    <UserFormComponent
      :isVisible="showModal"
      :user="selectedUser"
      :isEdit="isEdit"
      :isSaving="isSaving"
      :errors="errors"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script>
import UserListComponent from '../modules/users/UserListComponent.vue'
import UserFormComponent from '../modules/users/UserFormComponent.vue'
import { UserService } from '../services'

export default {
  name: 'UsersPage',
  components: {
    UserListComponent,
    UserFormComponent
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
      userPermissions: {}
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
        const user = JSON.parse(userData)
        this.userPermissions = user.permissions || {}
      }
    },

    async loadUsers() {
      this.isLoading = true
      try {
        const response = await UserService.getList()
        
        if (response.data.success) {
          this.users = response.data.data.users || response.data.data
        }
      } catch (error) {
        console.error('Failed to load users:', error)
        this.$toast?.error(this.$t('errors.networkError'))
      } finally {
        this.isLoading = false
      }
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedUser = null
      this.errors = {}
      this.showModal = true
    },

    openEditModal(user) {
      this.isEdit = true
      this.selectedUser = user
      this.errors = {}
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedUser = null
      this.errors = {}
    },

    async handleSave(formData) {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await UserService.update(this.selectedUser.id, formData)
          : await UserService.create(formData)
        
        if (response.data.success) {
          this.closeModal()
          this.loadUsers()
          this.$toast?.success(
            this.isEdit 
              ? this.$t('users.messages.updated')
              : this.$t('users.messages.created')
          )
        }
      } catch (error) {
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors
        } else {
          this.$toast?.error(error.response?.data?.message || this.$t('errors.serverError'))
        }
      } finally {
        this.isSaving = false
      }
    },

    async deleteUser(id) {
      try {
        const response = await UserService.delete(id)
        
        if (response.data.success) {
          this.loadUsers()
          this.$toast?.success(this.$t('users.messages.deleted'))
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || this.$t('errors.serverError'))
      }
    }
  }
}
</script>

<style scoped>
.users-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>