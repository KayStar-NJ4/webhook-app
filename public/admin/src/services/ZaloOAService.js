/**
 * Zalo OA Service - Frontend service layer
 * Handles Zalo Official Account API calls
 */
const _BaseServiceZaloOA = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceZaloOA && !window.BaseService) {
  window.BaseService = function () {};
}

class ZaloOAService extends (window.BaseService || _BaseServiceZaloOA) {
  constructor() {
    super()
    this.endpoint = '/zalo-oas'
  }

  // Get list of zalo OAs
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Get zalo OA by ID
  getById(id) {
    return this.get(`${this.endpoint}/${id}`)
  }

  // Create new zalo OA
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Update zalo OA
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Delete zalo OA
  deleteOA(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Get active zalo OAs
  getActive() {
    return this.get(`${this.endpoint}/active`)
  }

  // Test connection
  testConnection(id) {
    return this.post(`${this.endpoint}/${id}/test-connection`)
  }
}

// Initialize service
if (!window.ZaloOAService) {
  window.ZaloOAService = new ZaloOAService()
}

