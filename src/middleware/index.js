const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Middleware để parse JSON với giới hạn kích thước
 */
const jsonParser = express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Lưu raw body để xác thực webhook nếu cần
    req.rawBody = buf;
  }
});

/**
 * Middleware để parse URL encoded data
 */
const urlEncodedParser = express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
});

/**
 * Middleware CORS
 */
const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Cho phép tất cả origin trong development
    if (config.server.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // Trong production, chỉ cho phép các domain cụ thể
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Chatwoot-Signature', 'X-Chatwoot-Timestamp']
});

/**
 * Middleware bảo mật
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Middleware logging
 */
const loggingMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  },
  skip: (req, res) => {
    // Bỏ qua logging cho health check
    return req.url === '/health';
  }
});

/**
 * Middleware xử lý lỗi
 */
const errorHandler = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Không leak thông tin lỗi trong production
  const message = config.server.nodeEnv === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(error.status || 500).json({
    status: 'error',
    message: message,
    ...(config.server.nodeEnv === 'development' && { stack: error.stack })
  });
};

/**
 * Middleware xử lý 404
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
};

/**
 * Middleware rate limiting (có thể thêm express-rate-limit nếu cần)
 */
const rateLimitMiddleware = (req, res, next) => {
  // Có thể implement rate limiting logic ở đây
  // Hoặc sử dụng express-rate-limit package
  next();
};

/**
 * Middleware xác thực API key (cho các endpoint admin)
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!validApiKey) {
    return next(); // Bỏ qua nếu không có API key được cấu hình
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid API key'
    });
  }

  next();
};

/**
 * Middleware để thêm request ID
 */
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * Middleware để log request details
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

module.exports = {
  jsonParser,
  urlEncodedParser,
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  errorHandler,
  notFoundHandler,
  rateLimitMiddleware,
  apiKeyAuth,
  requestIdMiddleware,
  requestLoggerMiddleware
};
