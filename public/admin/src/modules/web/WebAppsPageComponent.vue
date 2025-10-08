<template>
  <div class="web-apps-page">
    <web-apps-list-component
      ref="listComponent"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Web App Form -->
    <div class="modal fade" id="form-modal" tabindex="-1" role="dialog" aria-labelledby="webAppFormModalLabel" aria-hidden="true">
      <web-app-form-component
        :id="isEdit ? selectedApp.id : 0"
        :object_info="selectedApp"
        @create:success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'WebAppsPage',
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
      this.selectedApp = null
      this.errors = {}
      $('#form-modal').modal('show')
    },

    openEditModal(app) {
      this.isEdit = true
      this.selectedApp = Object.assign({}, app)
      this.errors = {}
      $('#form-modal').modal('show')
    },

    closeModal() {
      $('#form-modal').modal('hide')
      this.selectedApp = null
      this.errors = {}
    },

    async handleDelete(app) {
      try {
        const response = await window.WebService.deleteApp(app.id)
        if (response.data.success) {
          window.ToastService.success('Xóa web app thành công')
          // Reload danh sách sau khi xóa thành công
          if (this.$refs.listComponent) {
            this.$refs.listComponent.load()
          }
        }
      } catch (error) {
        window.ToastService.error('Lỗi khi xóa web app')
      }
    },

    handleFormSuccess() {
      this.closeModal()
      if (this.$refs.listComponent) {
        this.$refs.listComponent.load()
      }
    }
  }
}
</script>

<style scoped>
.web-apps-page {
  padding: 20px;
}
</style>
