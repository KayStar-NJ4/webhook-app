// HeaderComponent - Top navigation header
window.HeaderComponent = {
    template: `
        <nav class="main-header navbar navbar-expand navbar-white navbar-light">
            <!-- Left navbar links -->
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" data-widget="pushmenu" href="#" role="button">
                        <i class="fas fa-bars"></i>
                    </a>
                </li>
            </ul>
            
            <!-- Right navbar links -->
            <ul class="navbar-nav ml-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link" data-toggle="dropdown" href="#">
                        <i class="far fa-user"></i>
                        <span v-if="user">{{ user.username }}</span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                        <a href="#" class="dropdown-item" @click="logout">
                            <i class="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                        </a>
                    </div>
                </li>
            </ul>
        </nav>
    `,
    props: ['user'],
    methods: {
        logout() {
            this.$emit('logout');
        }
    }
};
