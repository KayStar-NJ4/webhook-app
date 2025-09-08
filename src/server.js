const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const {
  jsonParser,
  urlEncodedParser,
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  requestLoggerMiddleware
} = require('./middleware');

class Server {
  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Trust proxy (cho reverse proxy như nginx)
    this.app.set('trust proxy', 1);
    
    // Request ID middleware
    this.app.use(requestIdMiddleware);
    
    // Request logging
    this.app.use(requestLoggerMiddleware);
    
    // Security middleware
    this.app.use(securityMiddleware);
    
    // CORS middleware
    this.app.use(corsMiddleware);
    
    // Logging middleware
    this.app.use(loggingMiddleware);
    
    // Body parsing middleware
    this.app.use(jsonParser);
    this.app.use(urlEncodedParser);
  }

  setupRoutes() {
    // Main routes
    this.app.use('/', routes);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Tạo thư mục logs nếu chưa có
      const fs = require('fs');
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
      }

      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Server started successfully`, {
          port: this.port,
          environment: config.server.nodeEnv,
          timestamp: new Date().toISOString()
        });
        
        console.log(`\n🎉 Turbo Chatwoot Webhook Server is running!`);
        console.log(`📍 Port: ${this.port}`);
        console.log(`🌍 Environment: ${config.server.nodeEnv}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📱 Telegram webhook: http://localhost:${this.port}/webhook/telegram`);
        console.log(`💬 Chatwoot webhook: http://localhost:${this.port}/webhook/chatwoot`);
        console.log(`\n📋 Available API endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   GET  /api/status - Server status`);
        console.log(`   GET  /api/conversations - Get conversation mappings`);
        console.log(`   POST /api/test/telegram - Test Telegram message`);
        console.log(`   POST /api/test/dify - Test Dify AI`);
        console.log(`   POST /api/telegram/setup - Setup Telegram webhook`);
        console.log(`   GET  /api/telegram/webhook-info - Get webhook info`);
        console.log(`   DELETE /api/telegram/webhook - Delete webhook`);
        console.log(`\n🔧 To setup Telegram webhook:`);
        console.log(`   curl -X POST http://localhost:${this.port}/api/telegram/setup \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -d '{"webhookUrl": "https://your-domain.com/webhook/telegram"}'`);
        console.log(`\n`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down server...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start server
const server = new Server();
server.start();

module.exports = server;
