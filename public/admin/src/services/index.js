// Services are loaded via script tags in index.html

// Export all services to global window object
window.Services = {
  AuthService: window.AuthService,
  AdminService: window.AdminService,
  TelegramService: window.TelegramService,
  ChatwootService: window.ChatwootService,
  DifyService: window.DifyService,
  UserService: window.UserService,
  RoleService: window.RoleService,
  ConfigurationService: window.ConfigurationService,
  BaseService: window.BaseService,
  ServiceFactory: window.ServiceFactory
};
