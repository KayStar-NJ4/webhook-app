<template>
    <div>
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0">Dify Apps</h1>
                    </div>
                    <div class="col-sm-6">
                        <button class="btn btn-primary float-right" @click="showAddModal = true">
                            <i class="fas fa-plus"></i> Thêm App
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <section class="content">
        <div class="container-fluid">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách Dify Apps</h3>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải...
                    </div>
                    <div v-else-if="apps.length === 0" class="text-center text-muted">
                        <i class="fas fa-robot fa-3x mb-3"></i>
                        <p>Chưa có app nào được cấu hình</p>
                        <button class="btn btn-primary" @click="showAddModal = true">
                            <i class="fas fa-plus"></i> Thêm App đầu tiên
                        </button>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Tên App</th>
                                    <th>API URL</th>
                                    <th>App ID</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="app in apps" :key="app.id">
                                    <td>{{ app.name }}</td>
                                    <td>{{ app.apiUrl }}</td>
                                    <td>{{ app.appId }}</td>
                                    <td>
                                        <span class="badge" :class="app.isActive ? 'badge-success' : 'badge-danger'">
                                            {{ app.isActive ? 'Hoạt động' : 'Tạm dừng' }}
                                        </span>
                                    </td>
                                    <td>{{ formatDate(app.createdAt) }}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" @click="testApp(app)">
                                            <i class="fas fa-play"></i> Test
                                        </button>
                                        <button class="btn btn-sm btn-warning" @click="editApp(app)">
                                            <i class="fas fa-edit"></i> Sửa
                                        </button>
                                        <button class="btn btn-sm btn-danger" @click="deleteApp(app)">
                                            <i class="fas fa-trash"></i> Xóa
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Add/Edit Modal -->
            <DifyAppFormComponent 
                v-if="showAddModal"
                :app="editingApp"
                @close="closeModal"
                @saved="onAppSaved"
            />
        </div>
        </section>
    </div>
</template>

<script>
import DifyAppFormComponent from './DifyAppFormComponent.vue'

export default {
    name: 'DifyAppsListComponent',
    components: {
        DifyAppFormComponent
    },
    data() {
        return {
            loading: false,
            apps: [],
            showAddModal: false,
            editingApp: null
        }
    },
    mounted() {
        this.loadApps();
    },
    methods: {
        async loadApps() {
            this.loading = true;
            try {
                const response = await this.$apiCall('get', '/api/admin/dify-apps');
                this.apps = response.data.data || [];
            } catch (error) {
                console.error('Error loading apps:', error);
                if (error.response?.status === 401) {
                    this.$router.push('/admin/login');
                }
                this.apps = [];
            } finally {
                this.loading = false;
            }
        },
        editApp(app) {
            this.editingApp = app;
            this.showAddModal = true;
        },
        async deleteApp(app) {
            if (confirm(`Bạn có chắc muốn xóa app "${app.name}"?`)) {
                try {
                    await this.$apiCall('delete', `/api/admin/dify-apps/${app.id}`);
                    this.loadApps();
                } catch (error) {
                    console.error('Error deleting app:', error);
                    if (error.response?.status === 401) {
                        this.$router.push('/admin/login');
                    } else {
                        alert('Có lỗi xảy ra khi xóa app');
                    }
                }
            }
        },
        async testApp(app) {
            try {
                await this.$apiCall('post', '/api/admin/dify-apps/test', { appId: app.id });
                alert('Test app thành công!');
            } catch (error) {
                console.error('Error testing app:', error);
                if (error.response?.status === 401) {
                    this.$router.push('/admin/login');
                } else {
                    alert('Có lỗi xảy ra khi test app');
                }
            }
        },
        closeModal() {
            this.showAddModal = false;
            this.editingApp = null;
        },
        onAppSaved() {
            this.closeModal();
            this.loadApps();
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('vi-VN');
        }
    }
}
</script>
