<template>
  <div class="zalo-oas-page">
    <zalo-oas-list-component
      :oas="oas"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Zalo OA Form -->
    <div class="modal fade" id="zaloOAFormModal" tabindex="-1" role="dialog" aria-labelledby="zaloOAFormModalLabel" aria-hidden="true">
      <zalo-oa-form-component
        :id="isEdit ? selectedOA.id : 0"
        :object_info="selectedOA"
        @success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ZaloOAsPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      oas: [],
      showModal: false,
      isEdit: false,
      selectedOA: null,
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadOAs()
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

    async loadOAs() {
      this.isLoading = true
      try {
        const response = await window.ZaloOAService.getList()
        
        if (response.data.success) {
          this.oas = response.data.data.oas || response.data.data || []
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
      this.selectedOA = null
      this.errors = {}
      $('#zaloOAFormModal').modal('show')
    },

    openEditModal(oa) {
      this.isEdit = true
      this.selectedOA = Object.assign({}, oa)
      this.errors = {}
      $('#zaloOAFormModal').modal('show')
    },

    closeModal() {
      $('#zaloOAFormModal').modal('hide')
      this.selectedOA = null
      this.errors = {}
    },

    async handleDelete(oa) {
      try {
        const response = await window.ZaloOAService.deleteOA(oa.id)
        if (response.data.success) {
          this.loadOAs()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa Zalo OA thành công')
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
      this.loadOAs()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật Zalo OA thành công' : 'Tạo Zalo OA thành công')
      }
    }
  }
}
</script>

<style scoped>
.zalo-oas-page {
  padding: 20px;
}
</style>

