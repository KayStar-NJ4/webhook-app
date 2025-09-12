<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h2 class="logo">
          <i class="fas fa-robot"></i>
          <span v-if="!sidebarCollapsed">{{ $t('app.name') }}</span>
        </h2>
        <button @click="toggleSidebar" class="sidebar-toggle">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/admin/dashboard" class="nav-link">
              <i class="fas fa-tachometer-alt"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.dashboard') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('users', 'read')" class="nav-item">
            <router-link to="/admin/users" class="nav-link">
              <i class="fas fa-users"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.users') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('chatwoot', 'read')" class="nav-item">
            <router-link to="/admin/chatwoot-accounts" class="nav-link">
              <i class="fas fa-comments"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.chatwootAccounts') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('telegram', 'read')" class="nav-item">
            <router-link to="/admin/telegram-bots" class="nav-link">
              <i class="fab fa-telegram"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.telegramBots') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('dify', 'read')" class="nav-item">
            <router-link to="/admin/dify-apps" class="nav-link">
              <i class="fas fa-robot"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.difyApps') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('mappings', 'read')" class="nav-item">
            <router-link to="/admin/configurations" class="nav-link">
              <i class="fas fa-cogs"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.configurations') }}</span>
            </router-link>
          </li>
          
          <li v-if="hasPermission('system', 'logs')" class="nav-item">
            <router-link to="/admin/logs" class="nav-link">
              <i class="fas fa-file-alt"></i>
              <span v-if="!sidebarCollapsed">{{ $t('nav.logs') }}</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="mobile-menu-btn">
            <i class="fas fa-bars"></i>
          </button>
          <h1 class="page-title">{{ getPageTitle() }}</h1>
        </div>
        
        <div class="header-right">
          <!-- Language Switcher -->
          <div class="language-switcher">
            <select v-model="currentLanguage" @change="changeLanguage" class="lang-select">
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
          
          <!-- User Menu -->
          <div class="user-menu">
            <button @click="toggleUserMenu" class="user-btn">
              <i class="fas fa-user-circle"></i>
              <span>{{ user.fullName || user.username }}</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            
            <div v-if="showUserMenu" class="user-dropdown">
              <a @click="logout" class="dropdown-item">
                <i class="fas fa-sign-out-alt"></i>
                {{ $t('auth.logout') }}
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data() {
    return {
      sidebarCollapsed: false,
      showUserMenu: false,
      currentLanguage: 'vi',
      user: {},
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadLanguage()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        this.user = JSON.parse(userData)
        this.userPermissions = this.user.permissions || {}
      }
    },

    loadLanguage() {
      const savedLang = localStorage.getItem('language')
      if (savedLang) {
        this.currentLanguage = savedLang
        this.$i18n.locale = savedLang
      }
    },

    changeLanguage(lang) {
      this.currentLanguage = lang.target.value
      this.$i18n.locale = this.currentLanguage
      localStorage.setItem('language', this.currentLanguage)
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },

    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },

    getPageTitle() {
      const route = this.$route
      const titles = {
        '/admin/dashboard': this.$t('nav.dashboard'),
        '/admin/users': this.$t('nav.users'),
        '/admin/chatwoot-accounts': this.$t('nav.chatwootAccounts'),
        '/admin/telegram-bots': this.$t('nav.telegramBots'),
        '/admin/dify-apps': this.$t('nav.difyApps'),
        '/admin/configurations': this.$t('nav.configurations')
      }
      return titles[route.path] || this.$t('app.name')
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/admin/login')
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  transition: width 0.3s ease;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
}

.sidebar--collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo i {
  color: #3498db;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.sidebar-toggle:hover {
  background: #34495e;
}

.sidebar-nav {
  padding: 20px 0;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin-bottom: 5px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #34495e;
  color: white;
  border-left-color: #3498db;
}

.nav-link i {
  width: 20px;
  text-align: center;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

.sidebar--collapsed + .main-content {
  margin-left: 60px;
}

.main-header {
  background: white;
  padding: 0 30px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.mobile-menu-btn:hover {
  background: #f8f9fa;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.language-switcher select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.user-btn:hover {
  background: #f8f9fa;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 150px;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s ease;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.page-content {
  padding: 30px;
  min-height: calc(100vh - 60px);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar--collapsed {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .page-content {
    padding: 20px;
  }
}
</style>
