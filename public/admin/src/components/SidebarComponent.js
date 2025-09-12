// SidebarComponent - Navigation sidebar
window.SidebarComponent = {
    template: `
        <aside class="main-sidebar sidebar-dark-primary elevation-4">
            <!-- Brand Logo -->
            <a href="#" class="brand-link">
                <span class="brand-text font-weight-light">Turbo Chatwoot Webhook</span>
            </a>
            
            <!-- Sidebar -->
            <div class="sidebar">
                <nav class="mt-2">
                    <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/dashboard' }"
                               @click="navigate('/admin/dashboard')">
                                <i class="nav-icon fas fa-tachometer-alt"></i>
                                <p>Dashboard</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/users' }"
                               @click="navigate('/admin/users')">
                                <i class="nav-icon fas fa-users"></i>
                                <p>Quản lý người dùng</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/telegram-bots' }"
                               @click="navigate('/admin/telegram-bots')">
                                <i class="nav-icon fab fa-telegram"></i>
                                <p>Telegram Bots</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/chatwoot-accounts' }"
                               @click="navigate('/admin/chatwoot-accounts')">
                                <i class="nav-icon fas fa-comments"></i>
                                <p>Chatwoot Accounts</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/dify-apps' }"
                               @click="navigate('/admin/dify-apps')">
                                <i class="nav-icon fas fa-robot"></i>
                                <p>Dify Apps</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/configurations' }"
                               @click="navigate('/admin/configurations')">
                                <i class="nav-icon fas fa-cogs"></i>
                                <p>Cấu hình</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#" 
                               class="nav-link" 
                               :class="{ active: activeRoute === '/admin/logs' }"
                               @click="navigate('/admin/logs')">
                                <i class="nav-icon fas fa-file-alt"></i>
                                <p>Logs</p>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    `,
    props: ['activeRoute'],
    methods: {
        navigate(route) {
            this.$emit('navigate', route);
        }
    }
};
