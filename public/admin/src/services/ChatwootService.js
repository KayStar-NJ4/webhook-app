const _BaseServiceChatwoot = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceChatwoot && !window.BaseService) {
  window.BaseService = function () {};
}

class ChatwootService extends (window.BaseService || _BaseServiceChatwoot) {
  constructor() {
    super()
    this.endpoint = '/chatwoot-accounts'
  }

  // Lấy danh sách accounts với pagination và search
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
    return super.delete(`${this.endpoint}/${id}`)
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

  // Helper method để tạo hoặc cập nhật account (compatible với code cũ)
  createOrUpdate(data) {
    if (data.id && data.id !== 0) {
      return this.update(data.id, data)
    } else {
      return this.create(data)
    }
  }

  // Test connection
  testConnection(id) {
    return this.post(`${this.endpoint}/${id}/test-connection`)
  }
}

// Export to global window object
if (!window.ChatwootService) {
    window.ChatwootService = new ChatwootService();
}
