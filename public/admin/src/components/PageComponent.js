// PageComponent - Generic page component with dynamic content (Xịn xò version)
window.PageComponent = {
    template: `
        <section class="content">
            <div class="container-fluid">
                <ListComponent :userPermissions="userPermissions" />
            </div>
        </section>
    `,
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
    methods: {
        loadUserData() {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                this.userPermissions = user.permissions || {};
            }
        }
    }
};
