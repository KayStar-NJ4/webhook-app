<template>
  <div class="platform-mappings-page">
    <platform-mapping-list-component
      :userPermissions="userPermissions"
    />
  </div>
</template>

<script>
export default {
  name: 'PlatformMappingsPageComponent',
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
.platform-mappings-page {
  padding: 20px;
}
</style>
