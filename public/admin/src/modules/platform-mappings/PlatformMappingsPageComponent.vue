<template>
  <div class="platform-mappings-page">
    <platform-mapping-list-component
      :mappings="mappings"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Platform Mapping Form -->
    <div class="modal fade" id="platformMappingFormModal" tabindex="-1" role="dialog" aria-labelledby="platformMappingFormModalLabel" aria-hidden="true">
      <platform-mapping-form-component
        :id="isEdit ? selectedMapping.id : 0"
        :object_info="selectedMapping"
        @success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlatformMappingsPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      mappings: [],
      showModal: false,
      isEdit: false,
      selectedMapping: {},
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadMappings()
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

    async loadMappings() {
      this.isLoading = true
      try {
        const response = await window.PlatformMappingService.getList()
        
        if (response.data.success) {
          this.mappings = response.data.data.mappings || response.data.data
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
      this.selectedMapping = {}
      this.errors = {}
      $('#platformMappingFormModal').modal('show')
    },

    openEditModal(mapping) {
      this.isEdit = true
      this.selectedMapping = Object.assign({}, mapping)
      this.errors = {}
      $('#platformMappingFormModal').modal('show')
    },

    closeModal() {
      try { if (document.getElementById('platformMappingFormModal')) { $('#platformMappingFormModal').modal('hide') } } catch (_) {}
      this.selectedMapping = {}
      this.errors = {}
    },

    async handleDelete(mapping) {
      try {
        const response = await window.PlatformMappingService.delete(mapping.id)
        if (response.data.success) {
          this.loadMappings()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa platform mapping thành công')
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
      this.loadMappings()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật platform mapping thành công' : 'Tạo platform mapping thành công')
      }
    }
  }
}
</script>

<style scoped>
.platform-mappings-page {
  padding: 20px;
}
</style>
