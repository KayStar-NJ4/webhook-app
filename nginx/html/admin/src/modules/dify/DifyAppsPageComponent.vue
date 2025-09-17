<template>
  <div class="dify-apps-page">
    <dify-apps-list-component
      :userPermissions="userPermissions"
    />
  </div>
</template>

<script>

export default {
  name: 'DifyAppsPageComponent',
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
.dify-apps-page {
  padding: 20px;
}
</style>
