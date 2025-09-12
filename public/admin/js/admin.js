const { createApp } = Vue;
const { createI18n } = VueI18n;

// Import layouts
import AdminLayout from '../src/layouts/AdminLayout.vue'
import AuthLayout from '../src/layouts/AuthLayout.vue'

// Import pages
import UsersPage from '../src/pages/UsersPage.vue'
import LoginPage from '../src/pages/LoginPage.vue'
import DashboardPage from '../src/pages/DashboardPage.vue'
import ConfigurationPage from '../src/pages/ConfigurationPage.vue'
import ChatwootAccountsPage from '../src/pages/ChatwootAccountsPage.vue'
import TelegramBotsPage from '../src/pages/TelegramBotsPage.vue'
import DifyAppsPage from '../src/pages/DifyAppsPage.vue'
import LogsPage from '../src/pages/LogsPage.vue'

// Import components
import { 
  FormButtonComponent, 
  FormModalComponent, 
  FormInputTextComponent, 
  FormCheckBoxComponent,
  FormSelectComponent,
  FormTextAreaComponent
} from '../src/components'

// Import i18n
import i18n from '../src/i18n'

// Main App
const app = createApp({
  components: {
    AdminLayout,
    AuthLayout,
    UsersPage,
    LoginPage,
    DashboardPage,
    ConfigurationPage,
    ChatwootAccountsPage,
    TelegramBotsPage,
    DifyAppsPage,
    LogsPage,
    FormButtonComponent,
    FormModalComponent,
    FormInputTextComponent,
    FormCheckBoxComponent,
    FormSelectComponent,
    FormTextAreaComponent
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

// Use i18n
app.use(i18n)

// Mount the app
app.mount('#app');