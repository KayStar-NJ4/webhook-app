<template>
  <div class="chatwoot-accounts-page">
    <ChatwootListComponent
      :accounts="accounts"
      :isLoading="isLoading"
      :userPermissions="userPermissions"
      @create="openCreateModal"
      @edit="openEditModal"
      @delete="deleteAccount"
      @test="testConnection"
    />

    <ChatwootFormComponent
      :isVisible="showModal"
      :account="selectedAccount"
      :isEdit="isEdit"
      :isSaving="isSaving"
      :errors="errors"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script>
import ChatwootListComponent from '../modules/chatwoot/ChatwootListComponent.vue'
import ChatwootFormComponent from '../modules/chatwoot/ChatwootFormComponent.vue'
import { ChatwootService } from '../services'
import AuthUtils from '../utils/auth'

export default {
  name: 'ChatwootAccountsPage',
  components: {
    ChatwootListComponent,
    ChatwootFormComponent
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      accounts: [],
      showModal: false,
      isEdit: false,
      selectedAccount: null,
      errors: {},
      userPermissions: {}
    }
  },
  mounted() {
    // Debug auth status
    AuthUtils.debugAuth()
    
    if (!AuthUtils.isAuthenticated()) {
      this.$router.push('/admin/login')
      return
    }
    
    this.loadUserData()
    this.loadAccounts()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        this.userPermissions = user.permissions || {}
      }
    },

    async loadAccounts() {
      this.isLoading = true
      try {
        const response = await ChatwootService.getList()
        
        if (response.data.success) {
          this.accounts = response.data.data.accounts || response.data.data
        }
      } catch (error) {
        console.error('❌ Failed to load accounts:', error)
        console.error('❌ Error details:', error.response?.data)
        this.$toast?.error(this.$t('errors.networkError'))
      } finally {
        this.isLoading = false
      }
    },

    openCreateModal() {
      this.isEdit = false
      this.selectedAccount = null
      this.errors = {}
      this.showModal = true
    },

    openEditModal(account) {
      this.isEdit = true
      this.selectedAccount = account
      this.errors = {}
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedAccount = null
      this.errors = {}
    },

    async handleSave(formData) {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await ChatwootService.update(this.selectedAccount.id, formData)
          : await ChatwootService.create(formData)
        
        if (response.data.success) {
          this.closeModal()
          this.loadAccounts()
          this.$toast?.success(
            this.isEdit 
              ? this.$t('chatwoot.messages.updated')
              : this.$t('chatwoot.messages.created')
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

    async deleteAccount(id) {
      try {
        const response = await ChatwootService.delete(id)
        
        if (response.data.success) {
          this.loadAccounts()
          this.$toast?.success(this.$t('chatwoot.messages.deleted'))
        }
      } catch (error) {
        this.$toast?.error(error.response?.data?.message || this.$t('errors.serverError'))
      }
    },

    async testConnection(id) {
      try {
        const response = await ChatwootService.testConnection(id)
        
        if (response.data.success) {
          this.$toast?.success(this.$t('chatwoot.messages.testSuccess'))
        } else {
          this.$toast?.error(this.$t('chatwoot.messages.testFailed') + ': ' + response.data.message)
        }
      } catch (error) {
        this.$toast?.error(this.$t('chatwoot.messages.testFailed') + ': ' + (error.response?.data?.message || this.$t('errors.networkError')))
      }
    }
  }
}
</script>

<style scoped>
.chatwoot-accounts-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>