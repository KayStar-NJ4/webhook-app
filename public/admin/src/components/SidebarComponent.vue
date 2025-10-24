<template>
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- Brand Logo -->
    <a href="#" class="brand-link">
      <span class="brand-text font-weight-light">Turbo Webhook App</span>
    </a>
    
    <!-- Sidebar -->
    <div class="sidebar">
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
          <!-- Dashboard -->
          <li class="nav-item" v-if="hasPermission('system', 'dashboard')">
            <a href="#" 
               class="nav-link" 
               :class="{ active: activeRoute === '/admin/dashboard' }"
               @click="navigate('/admin/dashboard')">
              <i class="nav-icon fas fa-tachometer-alt"></i>
              <p>Dashboard</p>
            </a>
          </li>


          <!-- Dữ liệu nguồn -->
          <li class="nav-item has-treeview" 
              v-if="hasAnyDataSourcePermission()"
              :class="{ 'menu-open': isMenuOpen('data-source') }">
            <a href="#" class="nav-link" :class="{ 'active': isMenuActive('data-source') }" @click="toggleMenu('data-source')">
              <i class="nav-icon fas fa-database"></i>
              <p>
                Dữ liệu nguồn
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview" :style="{ display: isMenuOpen('data-source') ? 'block' : 'none' }">
              <li class="nav-item" v-if="hasPermission('chatwoot', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/chatwoot-accounts' }"
                   @click="navigate('/admin/chatwoot-accounts')">
                  <i class="nav-icon fas fa-comments"></i>
                  <p>Tài khoản Chatwoot</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('dify', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/dify-apps' }"
                   @click="navigate('/admin/dify-apps')">
                  <i class="nav-icon fas fa-robot"></i>
                  <p>Dify</p>
                </a>
              </li>
            </ul>
          </li>

          <!-- Mạng xã hội -->
          <li class="nav-item has-treeview" 
              v-if="hasPermission('telegram', 'read') || hasPermission('zalo', 'read') || hasPermission('web', 'read')"
              :class="{ 'menu-open': isMenuOpen('social-network') }">
            <a href="#" class="nav-link" :class="{ 'active': isMenuActive('social-network') }" @click="toggleMenu('social-network')">
              <i class="nav-icon fas fa-share-alt"></i>
              <p>
                Mạng xã hội
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview" :style="{ display: isMenuOpen('social-network') ? 'block' : 'none' }">
              <li class="nav-item" v-if="hasPermission('telegram', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/telegram-bots' }"
                   @click="navigate('/admin/telegram-bots')">
                  <i class="nav-icon fab fa-telegram"></i>
                  <p>Telegram</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('zalo', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/zalo-bots' }"
                   @click="navigate('/admin/zalo-bots')">
                  <i class="nav-icon fas fa-comment"></i>
                  <p>Zalo</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('web', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/web-apps' }"
                   @click="navigate('/admin/web-apps')">
                  <i class="nav-icon fas fa-globe"></i>
                  <p>Web Apps</p>
                </a>
              </li>
            </ul>
          </li>

          <!-- Marketing -->
          <li class="nav-item has-treeview" 
              v-if="hasPermission('customers', 'read') || hasPermission('platform_mappings', 'read')"
              :class="{ 'menu-open': isMenuOpen('marketing') }">
            <a href="#" class="nav-link" :class="{ 'active': isMenuActive('marketing') }" @click="toggleMenu('marketing')">
              <i class="nav-icon fas fa-bullhorn"></i>
              <p>
                Marketing
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview" :style="{ display: isMenuOpen('marketing') ? 'block' : 'none' }">
              <li class="nav-item" v-if="hasPermission('customers', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/customers' }"
                   @click="navigate('/admin/customers')">
                  <i class="nav-icon fas fa-address-book"></i>
                  <p>Khách hàng</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('platform_mappings', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/platform-mappings' }"
                   @click="navigate('/admin/platform-mappings')">
                  <i class="nav-icon fas fa-link"></i>
                  <p>Liên kết Platform</p>
                </a>
              </li>
            </ul>
          </li>

          <!-- Cài đặt hệ thống -->
          <li class="nav-item has-treeview" 
              v-if="hasAnySystemSettingsPermission()"
              :class="{ 'menu-open': isMenuOpen('system-settings') }">
            <a href="#" class="nav-link" :class="{ 'active': isMenuActive('system-settings') }" @click="toggleMenu('system-settings')">
              <i class="nav-icon fas fa-cogs"></i>
              <p>
                Cài đặt hệ thống
                <i class="right fas fa-angle-left"></i>
              </p>
            </a>
            <ul class="nav nav-treeview" :style="{ display: isMenuOpen('system-settings') ? 'block' : 'none' }">
              <li class="nav-item" v-if="hasPermission('users', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/users' }"
                   @click="navigate('/admin/users')">
                  <i class="nav-icon fas fa-users"></i>
                  <p>Người dùng</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('roles', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/roles' }"
                   @click="navigate('/admin/roles')">
                  <i class="nav-icon fas fa-user-tag"></i>
                  <p>Vai trò người dùng</p>
                </a>
              </li>
              <li class="nav-item" v-if="hasPermission('configurations', 'read')">
                <a href="#" 
                   class="nav-link" 
                   :class="{ active: activeRoute === '/admin/configurations' }"
                   @click="navigate('/admin/configurations')">
                  <i class="nav-icon fas fa-sliders-h"></i>
                  <p>Cấu hình</p>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'SidebarComponent',
  props: {
    activeRoute: {
      type: String,
      default: '/admin/dashboard'
    },
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      openMenus: new Set()
    }
  },
  methods: {
    navigate(route) {
      this.$emit('navigate', route);
    },
    toggleMenu(menuKey) {
      // Đóng tất cả menu khác trước
      this.openMenus.clear();
      
      // Nếu menu hiện tại đang mở thì đóng, nếu đang đóng thì mở
      if (this.openMenus.has(menuKey)) {
        // Đóng menu
        this.openMenus.delete(menuKey);
      } else {
        // Mở menu
        this.openMenus.add(menuKey);
      }
    },
    isMenuOpen(menuKey) {
      return this.openMenus.has(menuKey);
    },
    isMenuActive(menuKey) {
      // Menu cha chỉ active khi có menu con được chọn
      if (menuKey === 'data-source') {
        return this.activeRoute.includes('/admin/chatwoot-accounts') || this.activeRoute.includes('/admin/dify-apps');
      } else if (menuKey === 'social-network') {
        return this.activeRoute.includes('/admin/telegram-bots') || this.activeRoute.includes('/admin/zalo-bots') || this.activeRoute.includes('/admin/web-apps');
      } else if (menuKey === 'marketing') {
        return this.activeRoute.includes('/admin/customers') || this.activeRoute.includes('/admin/platform-mappings');
      } else if (menuKey === 'system-settings') {
        return this.activeRoute.includes('/admin/users') || this.activeRoute.includes('/admin/roles') || this.activeRoute.includes('/admin/configurations');
      }
      return false;
    },
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },
    hasAnyPermission(permissions) {
      return permissions.some(({ resource, action }) => this.hasPermission(resource, action))
    },
    hasAnyDataSourcePermission() {
      return this.hasPermission('chatwoot', 'read') || 
             this.hasPermission('dify', 'read')
    },
    hasAnySystemSettingsPermission() {
      return this.hasPermission('users', 'read') || 
             this.hasPermission('roles', 'read') || 
             this.hasPermission('configurations', 'read')
    }
  },
  mounted() {
    // Auto-open menu if current route is in a submenu
    const currentRoute = this.activeRoute;
    if (currentRoute.includes('/admin/chatwoot-accounts') || currentRoute.includes('/admin/dify-apps')) {
      this.openMenus.add('data-source');
    } else if (currentRoute.includes('/admin/telegram-bots') || currentRoute.includes('/admin/zalo-bots') || currentRoute.includes('/admin/web-apps')) {
      this.openMenus.add('social-network');
    } else if (currentRoute.includes('/admin/customers') || currentRoute.includes('/admin/platform-mappings')) {
      this.openMenus.add('marketing');
    } else if (currentRoute.includes('/admin/users') || currentRoute.includes('/admin/roles') || currentRoute.includes('/admin/configurations')) {
      this.openMenus.add('system-settings');
    }
  }
}
</script>

<style scoped>
/* Custom styles for 2-level menu */
.nav-treeview {
  padding-left: 1rem;
}
.nav-treeview .nav-link {
  padding-left: 1.5rem;
  font-size: 0.9rem;
}
.nav-treeview .nav-link i {
  font-size: 0.8rem;
}
.nav-item.has-treeview > .nav-link .right {
  transition: transform 0.3s ease;
}
.nav-item.has-treeview.menu-open > .nav-link .right {
  transform: rotate(-90deg);
}
.nav-item.has-treeview > .nav-link:hover .right {
  transform: rotate(-45deg);
}
.nav-item.has-treeview.menu-open > .nav-link:hover .right {
  transform: rotate(-90deg);
}

/* Menu cha active - chỉ khi có menu con được chọn */
.nav-item.has-treeview > .nav-link.active {
  background-color: #fff !important;
  color: #007bff !important;
}

/* Menu cha bình thường - không có màu khi chỉ click */
.nav-item.has-treeview > .nav-link {
  background-color: transparent !important;
  color: #c2c7d0 !important;
}

/* Menu con active - màu xanh */
.nav-treeview .nav-link.active {
  background-color: #007bff !important;
  color: #fff !important;
}

/* Hover effects */
.nav-item.has-treeview > .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-treeview .nav-link:hover {
  background-color: rgba(0, 123, 255, 0.1);
}
</style>