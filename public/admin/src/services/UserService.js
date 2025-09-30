const _BaseServiceUser = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceUser && !window.BaseService) {
  window.BaseService = function () {};
}

class UserService extends (window.BaseService || _BaseServiceUser) {
  constructor() {
    super()
    this.endpoint = '/users'
  }

  // Lấy danh sách users với pagination và search
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết user
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo user mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật user
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa user
  delete(id) {
    return super.delete(`${this.endpoint}/${id}`)
  }

  // Cập nhật trạng thái user
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/${id}/status`, { is_active: isActive })
  }

  // Đổi mật khẩu
  changePassword(id, password) {
    return this.post(`${this.endpoint}/${id}/change-password`, { password })
  }

  // Lấy roles của user
  getRoles(id) {
    return this.get(`${this.endpoint}/${id}/roles`)
  }

  // Lấy roles của user (alias)
  getUserRoles(id) {
    return this.get(`${this.endpoint}/${id}/roles`)
  }

  // Lấy permissions của user
  getUserPermissions(id) {
    return this.get(`${this.endpoint}/${id}/permissions`)
  }

  // Cập nhật permissions của user
  updateUserPermissions(id, permissions) {
    return this.put(`${this.endpoint}/${id}/permissions`, { permissions })
  }

  // Lấy permissions của user (deprecated - use getUserPermissions instead)
  getPermissions(id) {
    return this.get(`${this.endpoint}/${id}/permissions`)
  }

  // Cập nhật permissions (deprecated - use updateUserPermissions instead)
  updatePermissions(id, data) {
    return this.put(`${this.endpoint}/${id}/permissions`, data)
  }

  // Lấy roles của user
  getUserRoles(id) {
    return this.get(`${this.endpoint}/${id}/roles`)
  }

  // Thêm role cho user
  addUserRole(userId, roleId) {
    return this.post(`${this.endpoint}/${userId}/roles`, { role_id: roleId })
  }

  // Xóa role khỏi user
  removeUserRole(userId, roleId) {
    return super.delete(`${this.endpoint}/${userId}/roles/${roleId}`)
  }

  // Cập nhật tất cả roles của user
  updateUserRoles(userId, roleIds) {
    return this.put(`${this.endpoint}/${userId}/roles`, { role_ids: roleIds })
  }

  // Helper method để tạo hoặc cập nhật user (compatible với code cũ)
  createOrUpdate(data) {
    if (data.id && data.id !== 0) {
      return this.update(data.id, data)
    } else {
      return this.create(data)
    }
  }
}

// Export to global window object
if (!window.UserService) {
    window.UserService = new UserService();
}
