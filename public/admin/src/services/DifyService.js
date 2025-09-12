class DifyService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/dify-apps'
  }

  // Lấy danh sách apps
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết app
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo app mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật app
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa app
  delete(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Test kết nối app
  testConnection(id) {
    return this.get(`/configurations/test/dify/${id}`)
  }

  // Cập nhật trạng thái app
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/${id}/status`, { is_active: isActive })
  }

  // Gửi message đến Dify
  sendMessage(appId, data) {
    return this.post(`${this.endpoint}/${appId}/chat`, data)
  }

  // Lấy conversation history
  getConversationHistory(appId, params = {}) {
    return this.get(`${this.endpoint}/${appId}/conversations`, params)
  }
}

// Export to global window object
if (window.DifyService) {
    console.warn('⚠️ DifyService already exists, skipping...');
} else {
    window.DifyService = new DifyService();
}
