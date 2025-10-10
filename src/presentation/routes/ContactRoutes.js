const express = require('express')
const CustomerController = require('../controllers/CustomerController')

/**
 * Contact Routes - Public API
 * Handles public contact form submissions (no auth required)
 */
class ContactRoutes {
  constructor ({ customerService, logger }) {
    this.router = express.Router()
    this.customerController = new CustomerController({ customerService, logger })
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Public endpoint for contact form submission
    // No authentication required - anyone can submit a contact form
    this.router.post('/submit', (req, res) => {
      this.customerController.createCustomer(req, res)
    })

    // Status/health check endpoint
    this.router.get('/status', (req, res) => {
      res.json({
        success: true,
        message: 'Contact form API is running',
        timestamp: new Date().toISOString()
      })
    })
  }

  getRouter () {
    return this.router
  }
}

module.exports = ContactRoutes

