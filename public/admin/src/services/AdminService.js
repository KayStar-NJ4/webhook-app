class AdminService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/api/admin'
  }

  // Dashboard
  getDashboard() {
    return this.get('/dashboard')
  }

  // Users
  getUsers(params = {}) {
    return this.get('/users', params)
  }

  createUser(data) {
    return this.post('/users', data)
  }

  updateUser(id, data) {
    return this.put(`/users/${id}`, data)
  }

  deleteUser(id) {
    return this.delete(`/users/${id}`)
  }

  // Telegram Bots
  getTelegramBots(params = {}) {
    return this.get('/telegram-bots', params)
  }

  createTelegramBot(data) {
    return this.post('/telegram-bots', data)
  }

  updateTelegramBot(id, data) {
    return this.put(`/telegram-bots/${id}`, data)
  }

  deleteTelegramBot(id) {
    return this.delete(`/telegram-bots/${id}`)
  }

  // Chatwoot Accounts
  getChatwootAccounts(params = {}) {
    return this.get('/chatwoot-accounts', params)
  }

  createChatwootAccount(data) {
    return this.post('/chatwoot-accounts', data)
  }

  updateChatwootAccount(id, data) {
    return this.put(`/chatwoot-accounts/${id}`, data)
  }

  deleteChatwootAccount(id) {
    return this.delete(`/chatwoot-accounts/${id}`)
  }

  // Dify Apps
  getDifyApps(params = {}) {
    return this.get('/dify-apps', params)
  }

  createDifyApp(data) {
    return this.post('/dify-apps', data)
  }

  updateDifyApp(id, data) {
    return this.put(`/dify-apps/${id}`, data)
  }

  deleteDifyApp(id) {
    return this.delete(`/dify-apps/${id}`)
  }

  // Configurations
  getConfigurations(params = {}) {
    return this.get('/configurations', params)
  }

  createConfiguration(data) {
    return this.post('/configurations', data)
  }

  updateConfiguration(id, data) {
    return this.put(`/configurations/${id}`, data)
  }

  deleteConfiguration(id) {
    return this.delete(`/configurations/${id}`)
  }
}

// Export to global window object
if (!window.AdminService) {
    window.AdminService = new AdminService();
}
