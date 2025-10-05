const _BaseServicePlatformMapping = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServicePlatformMapping && !window.BaseService) {
  window.BaseService = function () {};
}

class PlatformMappingService extends (window.BaseService || _BaseServicePlatformMapping) {
  constructor() {
    super();
    this.endpoint = '/platform-mappings';
  }

  // List mappings
  getList(params = {}) {
    return this.get(this.endpoint, params);
  }

  // Create mapping
  create(data) {
    return this.post(this.endpoint, data);
  }

  // Update mapping
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data);
  }

  // Delete mapping
  delete(id) {
    return super.delete(`${this.endpoint}/${id}`);
  }

  // Test connection
  testConnection(id) {
    return this.post(`${this.endpoint}/${id}/test-connection`);
  }

  // Available platforms/resources
  getAvailablePlatforms() {
    return this.get(`${this.endpoint}/available-platforms`);
  }
}

if (!window.PlatformMappingService) {
  window.PlatformMappingService = new PlatformMappingService();
}


