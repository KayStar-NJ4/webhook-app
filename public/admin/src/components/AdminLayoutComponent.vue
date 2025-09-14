<template>
  <div class="wrapper">
    <!-- Sidebar -->
    <SidebarComponent 
      :activeRoute="currentRoute"
      :userPermissions="currentUser?.permissions || {}"
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
/* Fixed footer at bottom like header */
.wrapper {
  min-height: 100vh;
  padding-bottom: 60px; /* Space for fixed footer */
}

.main-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  border-top: 1px solid #dee2e6;
  background-color: #fff;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}
</style>
