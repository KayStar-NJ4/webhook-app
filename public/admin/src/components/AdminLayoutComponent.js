// AdminLayoutComponent - Main layout with sidebar and content area
window.AdminLayoutComponent = {
    template: `
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
                    @logout="handleLogout"
                />
                
                <!-- Main Content -->
                <div class="content">
                    <div class="content-header">
                        <div class="container-fluid">
                            <div class="row mb-2">
                                <div class="col-sm-6">
                                    <h1 class="m-0">{{ pageTitle }}</h1>
                                </div>
                                <div class="col-sm-6">
                                    <ol class="breadcrumb float-sm-right">
                                        <li class="breadcrumb-item"><a href="/admin">Home</a></li>
                                        <li class="breadcrumb-item active">{{ pageTitle }}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
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
    `,
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
                'logs': 'Logs hệ thống'
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
        console.log('SidebarComponent available:', !!window.SidebarComponent);
        console.log('HeaderComponent available:', !!window.HeaderComponent);
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
};
