<template>
  <section class="content">
    <div class="container-fluid">
      <ListComponent 
        :key="currentRoute" 
        :userPermissions="userPermissions" 
        :currentRoute="currentRoute" 
      />
    </div>
  </section>
</template>

<script>
export default {
  name: 'PageComponent',
  components: {
    ListComponent: window.ListComponent
  },
  data() {
    return {
      pageConfigs: {
        'telegram-bots': {
          title: 'Quản lý Telegram Bots',
          icon: 'fab fa-telegram'
        },
        'chatwoot-accounts': {
          title: 'Quản lý Chatwoot Accounts',
          icon: 'fas fa-comments'
        },
        'dify-apps': {
          title: 'Quản lý Dify Apps',
          icon: 'fas fa-robot'
        },
        'roles': {
          title: 'Quản lý Vai trò người dùng',
          icon: 'fas fa-user-tag'
        }
      },
      userPermissions: {}
    }
  },
  computed: {
    currentRoute() {
      return this.$route.path;
    },
    pageKey() {
      return this.currentRoute.replace('/admin/', '');
    },
    pageConfig() {
      return this.pageConfigs[this.pageKey] || {};
    },
    pageTitle() {
      return this.pageConfig.title || 'Page';
    }
  },
  mounted() {
    this.loadUserData();
  },
  watch: {
    '$route'(to, from) {
      this.currentRoute = to.path;
    }
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        this.userPermissions = user.permissions || {};
      }
    }
  }
}
</script>

<style scoped>
/* Page specific styles if needed */
</style>
