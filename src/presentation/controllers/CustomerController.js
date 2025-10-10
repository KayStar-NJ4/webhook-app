/**
 * Customer Controller - Presentation layer
 * Handles customer management operations (contact form submissions)
 */
class CustomerController {
  constructor ({ customerService, logger }) {
    this.customerService = customerService
    this.logger = logger
  }

  /**
   * Create a new customer (from contact form or API)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createCustomer (req, res) {
    try {
      const { name, email, company, subject, message, source } = req.body

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, email, subject, message'
        })
      }

      // Get request metadata
      const requestMeta = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        referer: req.get('referer'),
        language: req.get('accept-language')
      }

      const customerData = {
        name,
        email,
        company,
        subject,
        message,
        source: source || 'contact_form'
      }

      const customer = await this.customerService.createCustomer(
        customerData,
        requestMeta,
        req.user
      )

      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: customer
      })
    } catch (error) {
      this.logger.error('Create customer failed', { error: error.message })
      
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to submit contact form'
      })
    }
  }

  /**
   * Get all customers with pagination, search, and filtering
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getCustomers (req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sort_by = 'created_at.desc',
        status,
        source,
        assigned_to,
        include_deleted = 'false'
      } = req.query

      const result = await this.customerService.getAllCustomers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sort_by,
        status,
        source,
        assigned_to,
        include_deleted: include_deleted === 'true'
      })

      res.json({
        success: true,
        data: result.customers,
        meta: {
          total_item: result.pagination.total,
          total_page: result.pagination.totalPages,
          current_page: result.pagination.page,
          per_page: result.pagination.limit
        }
      })
    } catch (error) {
      this.logger.error('Get customers failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers'
      })
    }
  }

  /**
   * Get customer by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getCustomerById (req, res) {
    try {
      const { id } = req.params
      const { include_deleted = 'false' } = req.query

      const customer = await this.customerService.getCustomerById(
        parseInt(id),
        include_deleted === 'true'
      )

      res.json({
        success: true,
        data: customer
      })
    } catch (error) {
      this.logger.error('Get customer by ID failed', { id: req.params.id, error: error.message })
      
      if (error.message === 'Customer not found') {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer'
      })
    }
  }

  /**
   * Update customer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateCustomer (req, res) {
    try {
      const { id } = req.params
      const updateData = req.body

      // Remove fields that shouldn't be updated directly
      delete updateData.id
      delete updateData.created_at
      delete updateData.created_by
      delete updateData.deleted_at
      delete updateData.deleted_by

      const customer = await this.customerService.updateCustomer(
        parseInt(id),
        updateData,
        req.user
      )

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      })
    } catch (error) {
      this.logger.error('Update customer failed', { id: req.params.id, error: error.message })
      
      if (error.message.includes('not found') || error.message.includes('deleted')) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }

      if (error.message.includes('Invalid email')) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update customer'
      })
    }
  }

  /**
   * Delete customer (soft delete)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteCustomer (req, res) {
    try {
      const { id } = req.params

      await this.customerService.deleteCustomer(parseInt(id), req.user)

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete customer failed', { id: req.params.id, error: error.message })
      
      if (error.message.includes('not found') || error.message.includes('deleted')) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete customer'
      })
    }
  }

  /**
   * Restore soft-deleted customer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async restoreCustomer (req, res) {
    try {
      const { id } = req.params

      const customer = await this.customerService.restoreCustomer(parseInt(id), req.user)

      res.json({
        success: true,
        message: 'Customer restored successfully',
        data: customer
      })
    } catch (error) {
      this.logger.error('Restore customer failed', { id: req.params.id, error: error.message })
      
      if (error.message.includes('not found') || error.message.includes('not deleted')) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to restore customer'
      })
    }
  }

  /**
   * Assign customer to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async assignCustomer (req, res) {
    try {
      const { id } = req.params
      const { user_id } = req.body

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id is required'
        })
      }

      const customer = await this.customerService.assignCustomer(
        parseInt(id),
        parseInt(user_id),
        req.user
      )

      res.json({
        success: true,
        message: 'Customer assigned successfully',
        data: customer
      })
    } catch (error) {
      this.logger.error('Assign customer failed', { id: req.params.id, error: error.message })
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to assign customer'
      })
    }
  }

  /**
   * Update customer status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateCustomerStatus (req, res) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'status is required'
        })
      }

      const customer = await this.customerService.updateCustomerStatus(
        parseInt(id),
        status,
        req.user
      )

      res.json({
        success: true,
        message: 'Customer status updated successfully',
        data: customer
      })
    } catch (error) {
      this.logger.error('Update customer status failed', { id: req.params.id, error: error.message })
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }

      if (error.message.includes('Invalid status')) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update customer status'
      })
    }
  }

  /**
   * Get customer statistics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getStatistics (req, res) {
    try {
      const stats = await this.customerService.getStatistics()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      this.logger.error('Get customer statistics failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      })
    }
  }

  /**
   * Batch update customers
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async batchUpdate (req, res) {
    try {
      const { ids, update_data } = req.body

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids array is required'
        })
      }

      if (!update_data || typeof update_data !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'update_data object is required'
        })
      }

      const results = await this.customerService.batchUpdate(ids, update_data, req.user)

      const successful = results.filter(r => r.success).length
      const failed = results.length - successful

      res.json({
        success: true,
        message: `Batch update completed: ${successful} successful, ${failed} failed`,
        data: results
      })
    } catch (error) {
      this.logger.error('Batch update customers failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Failed to batch update customers'
      })
    }
  }

  /**
   * Batch delete customers (soft delete)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async batchDelete (req, res) {
    try {
      const { ids } = req.body

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ids array is required'
        })
      }

      const results = await this.customerService.batchDelete(ids, req.user)

      const successful = results.filter(r => r.success).length
      const failed = results.length - successful

      res.json({
        success: true,
        message: `Batch delete completed: ${successful} successful, ${failed} failed`,
        data: results
      })
    } catch (error) {
      this.logger.error('Batch delete customers failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Failed to batch delete customers'
      })
    }
  }
}

module.exports = CustomerController

