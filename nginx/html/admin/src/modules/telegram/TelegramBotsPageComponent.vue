<template>
  <div class="telegram-bots-page">
    <telegram-bots-list-component
      :userPermissions="userPermissions"
    />
  </div>
</template>

<script>
export default {
  name: 'TelegramBotsPageComponent',
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
