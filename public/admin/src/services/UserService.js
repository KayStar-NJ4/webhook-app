class UserService extends BaseService {
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
    return this.delete(`${this.endpoint}/${id}`)
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

  // Lấy permissions của user (deprecated - use getRoles instead)
  getPermissions(id) {
    return this.get(`${this.endpoint}/${id}/permissions`)
  }

  // Cập nhật permissions (deprecated - use role management instead)
  updatePermissions(id, data) {
    return this.put(`${this.endpoint}/${id}/permissions`, data)
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
if (window.UserService) {
    console.warn('⚠️ UserService already exists, skipping...');
} else {
    window.UserService = new UserService();
}
