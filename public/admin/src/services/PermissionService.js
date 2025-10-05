const _BaseServicePermission = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServicePermission && !window.BaseService) {
  window.BaseService = function () {};
}

class PermissionService extends (window.BaseService || _BaseServicePermission) {
  constructor() {
    super()
    this.endpoint = '/permissions'
  }

  // Lấy danh sách permissions với pagination và search
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết permission
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo permission mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật permission
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa permission
  delete(id) {
    return super.delete(`${this.endpoint}/${id}`)
  }

  // Lấy danh sách permissions theo resource
  getByResource(resource) {
    return this.get(`${this.endpoint}/resource/${resource}`)
  }

  // Lấy danh sách permissions theo action
  getByAction(action) {
    return this.get(`${this.endpoint}/action/${action}`)
  }

  // Lấy danh sách tất cả resources
  getResources() {
    return this.get(`${this.endpoint}/resources`)
  }

  // Lấy danh sách tất cả actions
  getActions() {
    return this.get(`${this.endpoint}/actions`)
  }

  // Lấy permissions của user
  getUserPermissions(userId) {
    return this.get(`/users/${userId}/permissions`)
  }

  // Lấy permissions của role
  getRolePermissions(roleId) {
    return this.get(`/roles/${roleId}/permissions`)
  }

  // Cập nhật permissions của user
  updateUserPermissions(userId, permissions) {
    return this.put(`/users/${userId}/permissions`, { permissions })
  }

  // Cập nhật permissions của role
  updateRolePermissions(roleId, permissions) {
    return this.put(`/roles/${roleId}/permissions`, { permissions })
  }

  // Helper method để tạo hoặc cập nhật permission (compatible với code cũ)
  createOrUpdate(data) {
    if (data.id && data.id !== 0) {
      return this.update(data.id, data)
    } else {
      return this.create(data)
    }
  }
}

// Export to global window object
if (!window.PermissionService) {
    window.PermissionService = new PermissionService();
}
