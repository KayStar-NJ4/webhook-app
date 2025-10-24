/**
 * Zalo Service - Frontend service layer
 * Handles Zalo bot API calls
 */
const _BaseServiceZalo = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceZalo && !window.BaseService) {
  window.BaseService = function () {};
}

class ZaloService extends (window.BaseService || _BaseServiceZalo) {
  constructor() {
    super()
    this.endpoint = '/zalo-bots'
  }

  // Get list of zalo bots
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Get zalo bot by ID
  getById(id) {
    return this.get(`${this.endpoint}/${id}`)
  }

  // Create new zalo bot
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Update zalo bot
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Delete zalo bot
  deleteBot(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Get active zalo bots
  getActive() {
    return this.get(`${this.endpoint}/active`)
  }

  // Test connection
  testConnection(id) {
    return this.post(`${this.endpoint}/${id}/test-connection`)
  }
}

// Initialize service
if (!window.ZaloService) {
  window.ZaloService = new ZaloService()
}

