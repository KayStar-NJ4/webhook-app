<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ user.fullName || user.username }}</span>
        <FormButtonComponent
          @click="logout"
          variant="danger"
          icon="fas fa-sign-out-alt"
          text="Logout"
        />
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fab fa-telegram"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalBots }}</h3>
            <p>Telegram Bots</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalAccounts }}</h3>
            <p>Chatwoot Accounts</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-robot"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalApps }}</h3>
            <p>Dify Apps</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <FormButtonComponent
            v-if="hasPermission('users', 'create')"
            @click="navigateTo('/admin/users')"
            variant="outline"
            icon="fas fa-user-plus"
            text="Manage Users"
            class="action-btn"
          />
          
          <FormButtonComponent
            v-if="hasPermission('telegram', 'read')"
            @click="navigateTo('/admin/telegram-bots')"
            variant="outline"
            icon="fab fa-telegram"
            text="Telegram Bots"
            class="action-btn"
          />
          
          <FormButtonComponent
            v-if="hasPermission('chatwoot', 'read')"
            @click="navigateTo('/admin/chatwoot-accounts')"
            variant="outline"
            icon="fas fa-comments"
            text="Chatwoot Accounts"
            class="action-btn"
          />
          
          <FormButtonComponent
            v-if="hasPermission('dify', 'read')"
            @click="navigateTo('/admin/dify-apps')"
            variant="outline"
            icon="fas fa-robot"
            text="Dify Apps"
            class="action-btn"
          />
          
          <FormButtonComponent
            v-if="hasPermission('mappings', 'read')"
            @click="navigateTo('/admin/configurations')"
            variant="outline"
            icon="fas fa-cogs"
            text="Configurations"
            class="action-btn"
          />
          
          <FormButtonComponent
            v-if="hasPermission('system', 'logs')"
            @click="navigateTo('/admin/logs')"
            variant="outline"
            icon="fas fa-file-alt"
            text="System Logs"
            class="action-btn"
          />
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div v-if="recentActivity.length === 0" class="no-activity">
            <i class="fas fa-info-circle"></i>
            <p>No recent activity</p>
          </div>
          <div v-else>
            <div 
              v-for="activity in recentActivity" 
              :key="activity.id" 
              class="activity-item"
            >
              <div class="activity-icon">
                <i :class="getActivityIcon(activity.type)"></i>
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.message }}</p>
                <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormButtonComponent from '../components/shared/FormButtonComponent.vue'

export default {
  components: {
    FormButtonComponent
  },
  name: 'DashboardPage',
  data() {
    return {
      user: {},
      stats: {
        totalUsers: 0,
        totalBots: 0,
        totalAccounts: 0,
        totalApps: 0
      },
      recentActivity: [],
      userPermissions: {}
    }
  },
  mounted() {
    this.loadUserData()
    this.loadDashboardData()
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        this.user = JSON.parse(userData)
        this.userPermissions = this.user.permissions || {}
      }
    },
    
    async loadDashboardData() {
      try {
        const response = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        
        if (response.data.success) {
          this.stats = response.data.data.stats
          this.recentActivity = response.data.data.recent || []
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    },
    
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },
    
    navigateTo(path) {
      this.$router.push(path)
    },
    
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/admin/login')
    },
    
    getActivityIcon(type) {
      const icons = {
        user: 'fas fa-user',
        telegram: 'fab fa-telegram',
        chatwoot: 'fas fa-comments',
        dify: 'fas fa-robot',
        system: 'fas fa-cog'
      }
      return icons[type] || 'fas fa-info-circle'
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString()
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e1e5e9;
}

.dashboard-header h1 {
  color: #333;
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
  font-size: 16px;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-card:nth-child(1) .stat-icon { background: #3498db; }
.stat-card:nth-child(2) .stat-icon { background: #2ecc71; }
.stat-card:nth-child(3) .stat-icon { background: #f39c12; }
.stat-card:nth-child(4) .stat-icon { background: #9b59b6; }

.stat-content h3 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #333;
}

.stat-content p {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.quick-actions {
  margin-bottom: 40px;
}

.quick-actions h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
}

.action-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  font-size: 24px;
  color: #667eea;
}

.action-btn span {
  font-weight: 600;
  font-size: 14px;
}

.recent-activity {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.recent-activity h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.no-activity {
  text-align: center;
  color: #666;
  padding: 40px;
}

.no-activity i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ddd;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 14px;
}

.activity-time {
  color: #666;
  font-size: 12px;
}
</style>
