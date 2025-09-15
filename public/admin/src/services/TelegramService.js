/**
 * Telegram Service - Frontend service layer
 * Handles Telegram bot API calls
 */
class TelegramService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/telegram-bots'
  }

  // Get list of telegram bots
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Get telegram bot by ID
  getById(id) {
    return this.get(`${this.endpoint}/${id}`)
  }

  // Create new telegram bot
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Update telegram bot
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Delete telegram bot
  deleteBot(id) {
    return this.delete(`${this.endpoint}/${id}`)
  }

  // Get active telegram bots
  getActive() {
    return this.get(`${this.endpoint}/active`)
  }
}

// Initialize service
if (!window.TelegramService) {
  window.TelegramService = new TelegramService()
}