<template>
  <div class="zalo-bots-page">
    <zalo-bots-list-component
      :bots="bots"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
    />

    <!-- Modal for Zalo Bot Form -->
    <div class="modal fade" id="zaloBotFormModal" tabindex="-1" role="dialog" aria-labelledby="zaloBotFormModalLabel" aria-hidden="true">
      <zalo-bot-form-component
        :id="isEdit ? selectedBot.id : 0"
        :object_info="selectedBot"
        @success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ZaloBotsPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      bots: [],
      showModal: false,
      isEdit: false,
      selectedBot: null,
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadBots()
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

    async loadBots() {
      this.isLoading = true
      try {
        const response = await window.ZaloService.getList()
        
        if (response.data.success) {
          this.bots = response.data.data.bots || response.data.data
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
      this.selectedBot = null
      this.errors = {}
      $('#zaloBotFormModal').modal('show')
    },

    openEditModal(bot) {
      this.isEdit = true
      this.selectedBot = Object.assign({}, bot)
      this.errors = {}
      $('#zaloBotFormModal').modal('show')
    },

    closeModal() {
      $('#zaloBotFormModal').modal('hide')
      this.selectedBot = null
      this.errors = {}
    },

    async handleDelete(bot) {
      try {
        const response = await window.ZaloService.deleteBot(bot.id)
        if (response.data.success) {
          this.loadBots()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa Zalo bot thành công')
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
      this.loadBots()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật Zalo bot thành công' : 'Tạo Zalo bot thành công')
      }
    }
  }
}
</script>

<style scoped>
.zalo-bots-page {
  padding: 20px;
}
</style>

