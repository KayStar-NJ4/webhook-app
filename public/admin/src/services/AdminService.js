// Ensure BaseService is available in this non-module environment
const _BaseService = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseService && !window.BaseService) {
  // Fallback no-op to avoid runtime crash; methods rely on BaseService implementation
  // You should ensure BaseService.js is loaded before AdminService.js
  // but this keeps the app from hard-crashing if load order changes
  window.BaseService = function () {};
}

class AdminService extends (window.BaseService || _BaseService) {
  constructor() {
    super()
    this.endpoint = '/api/admin'
  }

  // Dashboard
  getDashboard() {
    return this.get('/dashboard')
  }

  // NOTE: AdminService is now only for dashboard/other admin-only endpoints
}

// Export to global window object
if (!window.AdminService) {
    window.AdminService = new AdminService();
}
