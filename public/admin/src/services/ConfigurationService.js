const _BaseServiceConfig = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceConfig && !window.BaseService) {
  window.BaseService = function () {};
}

class ConfigurationService extends (window.BaseService || _BaseServiceConfig) {
  constructor() {
    super()
    this.endpoint = '/configurations'
  }


  // ===== SYSTEM CONFIGURATIONS =====
  
  // Lấy danh sách system configurations
  getSystemConfigurations(params = {}) {
    return this.get(`${this.endpoint}/system`, params)
  }

  // Cập nhật system configuration
  updateSystemConfiguration(data) {
    return this.put(`${this.endpoint}/system`, data)
  }

  // Xóa system configuration
  deleteSystemConfiguration(id) {
    return this.delete(`${this.endpoint}/system/${id}`)
  }

  // Lấy chi tiết system configuration
  getSystemConfigurationDetail(key) {
    return this.get(`${this.endpoint}/system/${key}`)
  }

  // ===== BACKWARD COMPATIBILITY METHODS =====
  
  // Legacy method for backward compatibility
  getConfig() {
    return this.getSystemConfigurations()
  }

  // Legacy method for backward compatibility
  updateConfig(data) {
    // Convert legacy format to new format
    const configs = []
    for (const [key, value] of Object.entries(data)) {
      configs.push({
        key: key,
        value: value,
        type: typeof value === 'number' ? 'number' : 
              typeof value === 'boolean' ? 'boolean' : 'string',
        description: `Legacy configuration for ${key}`
      })
    }
    
    // Update each configuration
    return Promise.all(configs.map(config => this.updateSystemConfiguration(config)))
  }
}

// Export to global window object
if (!window.ConfigurationService) {
    window.ConfigurationService = new ConfigurationService();
}
