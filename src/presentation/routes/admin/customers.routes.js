const express = require('express')
const CustomerController = require('../../controllers/CustomerController')

/**
 * Customers Routes - Admin API
 * Handles customer management routes (admin panel)
 */
class CustomersRoutes {
  constructor ({
    customerService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.customerController = new CustomerController({ customerService, logger })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Customer management API (admin only)
    
    // Create customer (admin can create manually)
    this.router.post('/',
      this.authMiddleware.verifyToken,
      (req, res) => this.customerController.createCustomer(req, res)
    )
    
    // Get all customers with filters
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'read'),
      (req, res) => this.customerController.getCustomers(req, res)
    )
    
    // Get customer statistics
    this.router.get('/statistics',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'read'),
      (req, res) => this.customerController.getStatistics(req, res)
    )
    
    // Get customer by ID
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'read'),
      (req, res) => this.customerController.getCustomerById(req, res)
    )
    
    // Update customer (includes notes, status, assignment)
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'update'),
      (req, res) => this.customerController.updateCustomer(req, res)
    )
    
    // Soft delete customer
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'delete'),
      (req, res) => this.customerController.deleteCustomer(req, res)
    )
    
    // Restore soft-deleted customer
    this.router.post('/:id/restore',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'update'),
      (req, res) => this.customerController.restoreCustomer(req, res)
    )
    
    // Assign customer to user (for task management)
    this.router.post('/:id/assign',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'update'),
      (req, res) => this.customerController.assignCustomer(req, res)
    )
    
    // Update customer status (new, contacted, in_progress, resolved, closed)
    this.router.patch('/:id/status',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'update'),
      (req, res) => this.customerController.updateCustomerStatus(req, res)
    )
    
    // Batch operations
    this.router.post('/batch/update',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'update'),
      (req, res) => this.customerController.batchUpdate(req, res)
    )
    
    this.router.post('/batch/delete',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('customers', 'delete'),
      (req, res) => this.customerController.batchDelete(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = CustomersRoutes

