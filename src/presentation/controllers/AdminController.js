/**
 * Admin Controller - Presentation layer
 * Handles dashboard ONLY - Each module has its own controller
 */
class AdminController {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    webAppRepository,
    logger
  }) {
    this.userRepository = userRepository
    this.telegramBotRepository = telegramBotRepository
    this.chatwootAccountRepository = chatwootAccountRepository
    this.difyAppRepository = difyAppRepository
    this.webAppRepository = webAppRepository
    this.logger = logger
  }

  /**
   * Get dashboard data - Summary of all platforms
   */
  async getDashboard (req, res) {
    try {
      const [
        usersResult,
        botsResult,
        accountsResult,
        appsResult,
        webAppsResult
      ] = await Promise.all([
        this.userRepository.findAll({ page: 1, limit: 5 }),
        this.telegramBotRepository.findAll({ page: 1, limit: 5 }),
        this.chatwootAccountRepository.findAll({ page: 1, limit: 5 }),
        this.difyAppRepository.findAll({ page: 1, limit: 5 }),
        this.webAppRepository.findAll({ page: 1, limit: 5 })
      ])

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers: usersResult.pagination.total,
            totalBots: botsResult.pagination.total,
            totalAccounts: accountsResult.pagination.total,
            totalApps: appsResult.pagination.total,
            totalWebApps: webAppsResult.pagination.total
          },
          recent: {
            users: usersResult.users,
            bots: botsResult.bots,
            accounts: accountsResult.accounts,
            apps: appsResult.apps,
            webApps: webAppsResult.apps
          }
        }
      })
    } catch (error) {
      this.logger.error('Get dashboard failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = AdminController