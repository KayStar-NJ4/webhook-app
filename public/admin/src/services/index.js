// Services are loaded via script tags in index.html

// Export all services to global window object
window.Services = {
  AuthService: window.AuthService,
  AdminService: window.AdminService,
  TelegramService: window.TelegramService,
  ZaloService: window.ZaloService,
  ChatwootService: window.ChatwootService,
  DifyService: window.DifyService,
  PlatformMappingService: window.PlatformMappingService,
  UserService: window.UserService,
  RoleService: window.RoleService,
  CustomerService: window.CustomerService,
  ConfigurationService: window.ConfigurationService,
  BaseService: window.BaseService,
  ServiceFactory: window.ServiceFactory
};
