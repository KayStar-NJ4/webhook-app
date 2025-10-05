<template>
  <div class="chatwoot-accounts-page">
    <chatwoot-account-list-component
      :accounts="accounts"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      :meta="meta"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="handleDelete"
      @search="handleSearch"
    />

    <!-- Modal for Chatwoot Account Form -->
    <div class="modal fade" id="chatwootAccountFormModal" tabindex="-1" role="dialog" aria-labelledby="chatwootAccountFormModalLabel" aria-hidden="true">
      <chatwoot-account-form-component
        :id="isEdit ? selectedAccount.id : 0"
        :object_info="selectedAccount"
        @success="handleFormSuccess"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatwootAccountsPage',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      accounts: [],
      showModal: false,
      isEdit: false,
      selectedAccount: {},
      errors: {},
      userPermissions: {},
      params: {
        search: '',
        is_active: '',
        page: 1,
        limit: 10,
        sort_by: 'created_at.desc'
      },
      meta: {
        total_item: 0,
        total_page: 1
      }
    }
  },
  mounted() {
    this.loadUserData()
    this.loadAccounts()
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

    async loadAccounts() {
      this.isLoading = true
      try {
        const response = await window.ChatwootService.getList(this.params)
        
        if (response.data.success) {
          this.accounts = response.data.data || []
          this.meta = {
            total_item: response.data.meta?.total_item || response.data.data?.length || 0,
            total_page: response.data.meta?.total_page  || 1
          }
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error('Lỗi kết nối mạng')
        }
      } finally {
        this.isLoading = false
      }
    },

    handleSearch(params) {
      this.params = { ...params }
      this.loadAccounts()
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedAccount = {}
      this.errors = {}
      $('#chatwootAccountFormModal').modal('show')
    },

    openEditModal(account) {
      this.isEdit = true
      this.selectedAccount = Object.assign({}, account)
      this.errors = {}
      $('#chatwootAccountFormModal').modal('show')
    },

    closeModal() {
      try { if (document.getElementById('chatwootAccountFormModal')) { $('#chatwootAccountFormModal').modal('hide') } } catch (_) {}
      this.selectedAccount = {}
      this.errors = {}
    },

    async handleDelete(account) {
      try {
        const response = await window.ChatwootService.delete(account.id)
        if (response.data.success) {
          this.loadAccounts()
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Xóa tài khoản thành công')
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
      this.loadAccounts()
      if (this.$toast && this.$toast.success) {
        this.$toast.success(this.isEdit ? 'Cập nhật Chatwoot account thành công' : 'Tạo Chatwoot account thành công')
      }
    }
  }
}
</script>

<style scoped>
.chatwoot-accounts-page {
  padding: 20px;
}
</style>
