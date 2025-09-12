class ChatwootService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/chatwoot-accounts'
  }

  // Lấy danh sách accounts
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết account
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo account mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật account
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa account
  delete(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Test kết nối account
  testConnection(id) {
    return this.get(`/configurations/test/chatwoot/${id}`)
  }

  // Cập nhật trạng thái account
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/${id}/status`, { is_active: isActive })
  }

  // Lấy inboxes của account
  getInboxes(accountId) {
    return this.get(`${this.endpoint}/${accountId}/inboxes`)
  }

  // Lấy conversations của account
  getConversations(accountId, params = {}) {
    return this.get(`${this.endpoint}/${accountId}/conversations`, params)
  }
}

// Export to global window object
if (window.ChatwootService) {
    console.warn('⚠️ ChatwootService already exists, skipping...');
} else {
    window.ChatwootService = new ChatwootService();
}
