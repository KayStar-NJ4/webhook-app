<template>
  <div>
    <section class="content">
    <div class="container-fluid">
      <div class="row">
        <!-- Telegram Bots Stats -->
        <div class="col-lg-3 col-6" v-if="hasPermission('telegram', 'read')">
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
        
        <!-- Chatwoot Accounts Stats -->
        <div class="col-lg-3 col-6" v-if="hasPermission('chatwoot', 'read')">
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
        
        <!-- Dify Apps Stats -->
        <div class="col-lg-3 col-6" v-if="hasPermission('dify', 'read')">
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
        
        <!-- Users Stats -->
        <div class="col-lg-3 col-6" v-if="hasPermission('users', 'read')">
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
      
      <!-- No permissions message -->
      <div v-if="!hasAnyStatsPermission" class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body text-center">
              <div class="empty-state">
                <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">Không có quyền xem báo cáo</h4>
                <p class="text-muted">Bạn không có quyền xem bất kỳ báo cáo nào. Vui lòng liên hệ quản trị viên để được cấp quyền.</p>
              </div>
            </div>
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
      },
      userPermissions: {}
    }
  },
  computed: {
    hasAnyStatsPermission() {
      return this.hasPermission('telegram', 'read') || 
             this.hasPermission('chatwoot', 'read') || 
             this.hasPermission('dify', 'read') || 
             this.hasPermission('users', 'read')
    }
  },
  mounted() {
    this.loadUserData();
    this.loadStats();
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userPermissions = user.permissions || {};
        } catch (error) {
          this.userPermissions = {};
        }
      }
    },
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false;
      return this.userPermissions[resource].some(p => p.action === action);
    },
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
