/**
 * Service Factory - Centralized service management
 * Provides access to all services through a single interface
 */
class ServiceFactory {
  constructor() {
    this.services = {}
    this.initializeServices()
  }

  initializeServices() {
    // Initialize all services
    this.services = {
      auth: window.AuthService,
      admin: window.AdminService,
      user: window.UserService,
      telegram: window.TelegramService,
      chatwoot: window.ChatwootService,
      dify: window.DifyService,
      configuration: window.ConfigurationService,
      logs: window.LogsService
    }
  }

  // Get service by name
  get(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found`)
    }
    return this.services[serviceName]
  }

  // Direct access to services
  get auth() {
    return this.get('auth')
  }

  get admin() {
    return this.get('admin')
  }

  get user() {
    return this.get('user')
  }

  get telegram() {
    return this.get('telegram')
  }

  get chatwoot() {
    return this.get('chatwoot')
  }

  get dify() {
    return this.get('dify')
  }

  get configuration() {
    return this.get('configuration')
  }

  get logs() {
    return this.get('logs')
  }
}

// Export to global window object
if (window.ServiceFactory) {
    console.warn('⚠️ ServiceFactory already exists, skipping...');
} else {
    window.ServiceFactory = new ServiceFactory();
}
