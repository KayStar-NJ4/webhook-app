<template>
  <div class="chatwoot-accounts-page">
    <chatwoot-account-list-component
      :userPermissions="userPermissions"
    />
  </div>
</template>

<script>
export default {
  name: 'ChatwootAccountsPageComponent',
  components: {
    // Components will be registered globally
  },
  data() {
    return {
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
    }
  }
}
</script>

<style scoped>
.chatwoot-accounts-page {
  padding: 20px;
}
</style>
