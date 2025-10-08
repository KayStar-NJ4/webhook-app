/**
 * Web Service - Frontend service layer
 * Handles Web app API calls
 */
const _BaseServiceWeb = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceWeb && !window.BaseService) {
  window.BaseService = function () {};
}

class WebService extends (window.BaseService || _BaseServiceWeb) {
  constructor() {
    super()
    this.endpoint = '/web-apps'
  }

  // Get list of web apps
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Get web app by ID
  getById(id) {
    return this.get(`${this.endpoint}/${id}`)
  }

  // Create new web app
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Update web app
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Delete web app
  deleteApp(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Get active web apps
  getActive() {
    return this.get(`${this.endpoint}/active`)
  }

  // Get web app statistics
  getStatistics(id) {
    return this.get(`${this.endpoint}/${id}/statistics`)
  }

  // Get conversations for a web app
  getConversations(id, params = {}) {
    return this.get(`${this.endpoint}/${id}/conversations`, params)
  }
}

// Initialize service
if (!window.WebService) {
  window.WebService = new WebService()
}
