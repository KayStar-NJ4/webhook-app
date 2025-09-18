const { createApp } = Vue;
const { createI18n } = VueI18n;

// Components will be loaded dynamically via index.html
// No ES6 imports needed as we're using script tags

// Main App
const app = createApp({
  components: {
    // Components will be registered globally via index.html
  },
  data() {
    return {
      isAuthenticated: false,
      isLoading: false,
      loginError: '',
      currentUser: null,
      activeTab: 'dashboard',
      showUserMenu: false,
      
      // Forms
      loginForm: {
        username: '',
        password: ''
      },
      
      // Data
      dashboardStats: {
        totalUsers: 0,
        totalBots: 0,
        totalAccounts: 0,
        totalApps: 0
      }
    }
  },
  
  mounted() {
    this.checkAuth();
    if (this.isAuthenticated) {
      this.loadDashboard();
    }
  },
  
  methods: {
    async checkAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.isAuthenticated = true;
          this.currentUser = response.data.data;
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
    },
    
    async login() {
      this.isLoading = true;
      this.loginError = '';
      
      try {
        const response = await window.AuthService.login(this.loginForm);
        if (window.AuthService.saveAuthData(response)) {
          this.isAuthenticated = true;
          this.currentUser = response.data.data.user;
          this.loadDashboard();
        } else {
          this.loginError = response.data.message || 'Login failed';
        }
      } catch (error) {
        this.loginError = error.response?.data?.message || 'Login failed';
      } finally {
        this.isLoading = false;
      }
    },
    
    async logout() {
      try {
        await window.AuthService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        window.AuthUtils.clearAuth();
        this.isAuthenticated = false;
        this.currentUser = null;
      }
    },
    
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    
    getPageTitle() {
      const titles = {
        'dashboard': 'Dashboard',
        'users': 'Users Management',
        'telegram': 'Telegram Bots',
        'chatwoot': 'Chatwoot Accounts',
        'dify': 'Dify Apps'
      };
      return titles[this.activeTab] || 'Dashboard';
    },
    
    async loadDashboard() {
      try {
        const response = await window.AdminService.getDashboard();
        if (response.data.success) {
          this.dashboardStats = response.data.data.stats;
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
    }
  }
});

// Services and utilities are loaded via script tags in index.html
// No need to register them here as they're already global

// Mount the app
app.mount('#app');