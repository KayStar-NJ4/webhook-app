class TelegramService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/telegram-bots'
  }

  // Lấy danh sách bots
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết bot
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo bot mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật bot
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa bot
  delete(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Test kết nối bot
  testConnection(id) {
    return this.get(`/configurations/test/telegram/${id}`)
  }

  // Quản lý webhook
  getWebhookInfo(id) {
    return this.get(`${this.endpoint}/${id}/webhook`)
  }

  setWebhook(id, data) {
    return this.post(`${this.endpoint}/${id}/webhook`, data)
  }

  deleteWebhook(id) {
    return this.delete(`${this.endpoint}/${id}/webhook`)
  }

  // Cập nhật trạng thái bot
  updateStatus(id, isActive) {
    return this.patch(`${this.endpoint}/${id}/status`, { is_active: isActive })
  }
}

// Export to global window object
if (!window.TelegramService) {
    window.TelegramService = new TelegramService();
}
