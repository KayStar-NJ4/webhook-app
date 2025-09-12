<template>
  <div>
    <div class="content-header">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-sm-6">
            <h1 class="m-0">Cấu hình hệ thống</h1>
          </div>
          <div class="col-sm-6">
            <ol class="breadcrumb float-sm-right">
              <li class="breadcrumb-item"><a href="/admin">Home</a></li>
              <li class="breadcrumb-item active">Cấu hình hệ thống</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
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
</template>

<script>
export default {
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
}
</script>
