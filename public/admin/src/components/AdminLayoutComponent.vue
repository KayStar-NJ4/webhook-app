<template>
  <div class="wrapper">
    <!-- Sidebar -->
    <SidebarComponent 
      :activeRoute="currentRoute"
      @navigate="handleNavigation"
    />
    
    <!-- Content Wrapper -->
    <div class="content-wrapper">
      <!-- Header -->
      <HeaderComponent 
        :user="currentUser"
        :pageTitle="pageTitle"
        @logout="handleLogout"
      />
      
      <!-- Main Content -->
      <div class="content">
        <router-view></router-view>
      </div>
      
      <!-- Footer -->
      <footer class="main-footer">
        <div class="float-right d-none d-sm-block">
          <b>Version</b> 3.0.0
        </div>
        <strong>Copyright &copy; 2025 <a href="#">Turbo Chatwoot Webhook</a>.</strong>
        All rights reserved.
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminLayoutComponent',
  components: {
    SidebarComponent: window.SidebarComponent,
    HeaderComponent: window.HeaderComponent
  },
  data() {
    return {
      currentUser: null,
      currentRoute: '/admin/dashboard',
      pageConfigs: {
        'dashboard': 'Dashboard',
        'users': 'Quản lý người dùng',
        'telegram-bots': 'Quản lý Telegram Bots',
        'chatwoot-accounts': 'Quản lý Chatwoot Accounts',
        'dify-apps': 'Quản lý Dify Apps',
        'configurations': 'Cấu hình hệ thống',
        'logs': 'Logs hệ thống',
        'roles': 'Quản lý Vai trò người dùng'
      }
    }
  },
  computed: {
    pageKey() {
      return this.currentRoute.replace('/admin/', '').replace('/', '');
    },
    pageTitle() {
      return this.pageConfigs[this.pageKey] || 'Page';
    }
  },
  mounted() {
    this.loadUserData();
    this.currentRoute = this.$route.path;
    console.log('AdminLayoutComponent mounted');
  },
  watch: {
    '$route'(to) {
      this.currentRoute = to.path;
    }
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    },
    handleNavigation(route) {
      this.$router.push(route);
    },
    async handleLogout() {
      try {
        await window.AuthService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        window.AuthUtils.clearAuth();
        this.$router.push('/admin/login');
      }
    }
  }
}
</script>

<style scoped>
/* Layout specific styles if needed */
</style>
