// Users Page Component (Vue chuẩn)
window.UsersPageComponent = {
    template: `
        <div>
        <section class="content">
                <div class="container-fluid">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Danh sách người dùng</h3>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Tên người dùng</th>
                                            <th>Email</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="user in users" :key="user.id">
                                            <td>{{ user.id }}</td>
                                            <td>{{ user.username }}</td>
                                            <td>{{ user.email }}</td>
                                            <td>{{ user.role }}</td>
                                            <td>
                                                <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-danger'">
                                                    {{ user.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                                                </span>
                                            </td>
                                            <td>{{ formatDate(user.created_at) }}</td>
                                            <td>
                                                <button class="btn btn-sm btn-warning">
                                                    <i class="fas fa-edit"></i> Sửa
                                                </button>
                                                <button class="btn btn-sm btn-danger">
                                                    <i class="fas fa-trash"></i> Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            users: []
        }
    },
    mounted() {
        this.loadUsers();
    },
    methods: {
        async loadUsers() {
            try {
                const response = await window.UserService.getList();
                if (response.data.success) {
                    this.users = response.data.data || [];
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString();
        }
    }
};
