const _BaseServiceRole = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceRole && !window.BaseService) {
  window.BaseService = function () {};
}

class RoleService extends (window.BaseService || _BaseServiceRole) {
  constructor() {
    super()
    this.endpoint = '/roles'
  }

  // Lấy danh sách roles với pagination và search
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết role
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo role mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật role
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa role
  delete(id) {
    return super.delete(`${this.endpoint}/${id}`)
  }

  // Cập nhật trạng thái role
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/${id}/status`, { is_active: isActive })
  }

  // Lấy permissions của role
  getRolePermissions(id) {
    return this.get(`${this.endpoint}/${id}/permissions`)
  }

  // Cập nhật permissions của role
  updateRolePermissions(id, permissions) {
    return this.put(`${this.endpoint}/${id}/permissions`, { permissions })
  }

  // Lấy danh sách tất cả permissions
  getAllPermissions() {
    return this.get('/permissions')
  }

  // Helper method để tạo hoặc cập nhật role (compatible với code cũ)
  createOrUpdate(data) {
    if (data.id && data.id !== 0) {
      return this.update(data.id, data)
    } else {
      return this.create(data)
    }
  }
}

// Export to global window object
if (!window.RoleService) {
    window.RoleService = new RoleService();
}
