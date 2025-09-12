<template>
  <div>
    <div class="content-header">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-sm-6">
            <h1 class="m-0">Dashboard</h1>
          </div>
          <div class="col-sm-6">
            <ol class="breadcrumb float-sm-right">
              <li class="breadcrumb-item"><a href="/admin">Home</a></li>
              <li class="breadcrumb-item active">Dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    <section class="content">
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-3 col-6">
          <div class="small-box bg-info">
            <div class="inner">
              <h3>{{ stats.totalBots || 0 }}</h3>
              <p>Telegram Bots</p>
            </div>
            <div class="icon">
              <i class="fab fa-telegram"></i>
            </div>
            <router-link to="/admin/telegram-bots" class="small-box-footer">
              Xem chi tiết <i class="fas fa-arrow-circle-right"></i>
            </router-link>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="small-box bg-success">
            <div class="inner">
              <h3>{{ stats.totalAccounts || 0 }}</h3>
              <p>Chatwoot Accounts</p>
            </div>
            <div class="icon">
              <i class="fas fa-comments"></i>
            </div>
            <router-link to="/admin/chatwoot-accounts" class="small-box-footer">
              Xem chi tiết <i class="fas fa-arrow-circle-right"></i>
            </router-link>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="small-box bg-warning">
            <div class="inner">
              <h3>{{ stats.totalApps || 0 }}</h3>
              <p>Dify Apps</p>
            </div>
            <div class="icon">
              <i class="fas fa-robot"></i>
            </div>
            <router-link to="/admin/dify-apps" class="small-box-footer">
              Xem chi tiết <i class="fas fa-arrow-circle-right"></i>
            </router-link>
          </div>
        </div>
        <div class="col-lg-3 col-6">
          <div class="small-box bg-danger">
            <div class="inner">
              <h3>{{ stats.totalUsers || 0 }}</h3>
              <p>Users</p>
            </div>
            <div class="icon">
              <i class="fas fa-users"></i>
            </div>
            <router-link to="/admin/users" class="small-box-footer">
              Xem chi tiết <i class="fas fa-arrow-circle-right"></i>
            </router-link>
          </div>
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
      stats: {
        totalUsers: 0,
        totalBots: 0,
        totalAccounts: 0,
        totalApps: 0
      }
    }
  },
  mounted() {
    this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        const response = await window.AdminService.getDashboard();
        if (response.data.success) {
          this.stats = response.data.data.stats || this.stats;
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    }
  }
}
</script>
