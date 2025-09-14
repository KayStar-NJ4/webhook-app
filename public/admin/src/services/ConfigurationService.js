class ConfigurationService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/configurations'
  }

  // Lấy danh sách configurations của user
  getUserConfigurations(params = {}) {
    return this.get(`${this.endpoint}/user`, params)
  }

  // Lấy chi tiết configuration
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo configuration mới
  create(data) {
    return this.post(`${this.endpoint}/user`, data)
  }

  // Cập nhật configuration
  update(id, data) {
    return this.put(`${this.endpoint}/user/${id}`, data)
  }

  // Xóa configuration
  delete(id) {
    return this.delete(`${this.endpoint}/user/${id}`)
  }

  // Lấy available resources
  getAvailableResources() {
    return this.get(`${this.endpoint}/resources`)
  }

  // Test kết nối
  testConnection(type, id) {
    return this.get(`${this.endpoint}/test/${type}/${id}`)
  }

  // Cập nhật trạng thái configuration
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/user/${id}/status`, { is_active: isActive })
  }
}

// Export to global window object
if (!window.ConfigurationService) {
    window.ConfigurationService = new ConfigurationService();
}
