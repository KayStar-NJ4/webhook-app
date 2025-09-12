// Configurations Page Component (Vue chuẩn)
window.ConfigurationsPageComponent = {
    template: `
        <div>
        <section class="content">
                <div class="container-fluid">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Cài đặt hệ thống</h3>
                        </div>
                        <div class="card-body">
                            <form>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label>JWT Secret</label>
                                            <input type="text" class="form-control" v-model="config.jwtSecret">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label>API Base URL</label>
                                            <input type="text" class="form-control" v-model="config.apiBaseUrl">
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-primary" @click="saveConfig">
                                    <i class="fas fa-save"></i> Lưu cấu hình
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `,
    data() {
        return {
            config: {
                jwtSecret: '',
                apiBaseUrl: ''
            }
        }
    },
    mounted() {
        this.loadConfig();
    },
    methods: {
        async loadConfig() {
            try {
                const response = await window.ConfigurationService.getConfig();
                if (response.data.success) {
                    this.config = response.data.data || this.config;
                }
            } catch (error) {
                console.error('Failed to load config:', error);
            }
        },
        async saveConfig() {
            try {
                const response = await window.ConfigurationService.updateConfig(this.config);
                if (response.data.success) {
                    alert('Cấu hình đã được lưu!');
                }
            } catch (error) {
                alert('Lỗi khi lưu cấu hình: ' + (error.response?.data?.message || 'Unknown error'));
            }
        }
    }
};
