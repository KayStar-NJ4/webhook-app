<template>
  <div class="dify-apps-page">
    <dify-apps-list-component
      :apps="apps"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Dify App Form -->
    <div class="modal fade" id="difyAppFormModal" tabindex="-1" role="dialog" aria-labelledby="difyAppFormModalLabel" aria-hidden="true">
      <dify-app-form-component
        :id="isEdit ? selectedApp.id : 0"
        :object_info="selectedApp"
        @success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DifyAppsPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      apps: [],
      showModal: false,
      isEdit: false,
      selectedApp: null,
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadApps()
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

    async loadApps() {
      this.isLoading = true
      try {
        const response = await window.DifyService.getList()
        
        if (response.data.success) {
          this.apps = response.data.data.apps || response.data.data
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
      this.selectedApp = null
      this.errors = {}
      $('#difyAppFormModal').modal('show')
    },

    openEditModal(app) {
      this.isEdit = true
      this.selectedApp = Object.assign({}, app)
      this.errors = {}
      $('#difyAppFormModal').modal('show')
    },

    closeModal() {
      $('#difyAppFormModal').modal('hide')
      this.selectedApp = null
      this.errors = {}
    },

    async handleDelete(app) {
      try {
        const response = await window.DifyService.deleteApp(app.id)
        if (response.data.success) {
          this.loadApps()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa Dify app thành công')
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
      this.loadApps()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật Dify app thành công' : 'Tạo Dify app thành công')
      }
    }
  }
}
</script>

<style scoped>
.dify-apps-page {
  padding: 20px;
}
</style>
