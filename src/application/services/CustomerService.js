/**
 * Customer Service - Application layer
 * Handles business logic for customer management
 */
class CustomerService {
  constructor ({ customerRepository, logger }) {
    this.customerRepository = customerRepository
    this.logger = logger
  }

  /**
   * Create a new customer from contact form submission
   * @param {Object} customerData - Customer data
   * @param {Object} requestMeta - Request metadata (IP, user agent, etc.)
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Created customer
   */
  async createCustomer (customerData, requestMeta = {}, user = null) {
    try {
      // Validate required fields
      this.validateCustomerData(customerData)

      // Prepare customer data with metadata
      const data = {
        name: customerData.name.trim(),
        email: customerData.email.trim().toLowerCase(),
        company: customerData.company ? customerData.company.trim() : null,
        subject: customerData.subject,
        message: customerData.message.trim(),
        source: customerData.source || 'contact_form',
        ip_address: requestMeta.ip || null,
        user_agent: requestMeta.userAgent || null,
        metadata: {
          referer: requestMeta.referer || null,
          language: requestMeta.language || null,
          timestamp: new Date().toISOString()
        }
      }

      const customer = await this.customerRepository.create(data, user)

      this.logger.info('Customer created successfully', { 
        customerId: customer.id, 
        email: customer.email,
        source: customer.source
      })

      return customer
    } catch (error) {
      this.logger.error('Failed to create customer', { error: error.message })
      throw error
    }
  }

  /**
   * Get all customers with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Customers and pagination info
   */
  async getAllCustomers (options = {}) {
    try {
      return await this.customerRepository.findAll(options)
    } catch (error) {
      this.logger.error('Failed to get all customers', { error: error.message })
      throw error
    }
  }

  /**
   * Get customer by ID
   * @param {number} id - Customer ID
   * @param {boolean} includeDeleted - Include soft-deleted records
   * @returns {Promise<Object>} - Customer
   */
  async getCustomerById (id, includeDeleted = false) {
    try {
      const customer = await this.customerRepository.findById(id, includeDeleted)
      
      if (!customer) {
        throw new Error('Customer not found')
      }

      return customer
    } catch (error) {
      this.logger.error('Failed to get customer by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Update customer
   * @param {number} id - Customer ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated customer
   */
  async updateCustomer (id, updateData, user = null) {
    try {
      // Validate email if provided
      if (updateData.email) {
        this.validateEmail(updateData.email)
        updateData.email = updateData.email.trim().toLowerCase()
      }

      // Trim string fields
      if (updateData.name) updateData.name = updateData.name.trim()
      if (updateData.company) updateData.company = updateData.company.trim()
      if (updateData.message) updateData.message = updateData.message.trim()

      const customer = await this.customerRepository.update(id, updateData, user)

      this.logger.info('Customer updated successfully', { customerId: id })

      return customer
    } catch (error) {
      this.logger.error('Failed to update customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete customer (soft delete)
   * @param {number} id - Customer ID
   * @param {Object} user - User object (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCustomer (id, user = null) {
    try {
      const result = await this.customerRepository.softDelete(id, user)

      this.logger.info('Customer deleted successfully', { customerId: id })

      return result
    } catch (error) {
      this.logger.error('Failed to delete customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Restore soft-deleted customer
   * @param {number} id - Customer ID
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Restored customer
   */
  async restoreCustomer (id, user = null) {
    try {
      const customer = await this.customerRepository.restore(id, user)

      this.logger.info('Customer restored successfully', { customerId: id })

      return customer
    } catch (error) {
      this.logger.error('Failed to restore customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Assign customer to user
   * @param {number} id - Customer ID
   * @param {number} userId - User ID to assign to
   * @param {Object} user - User object performing the action
   * @returns {Promise<Object>} - Updated customer
   */
  async assignCustomer (id, userId, user = null) {
    try {
      const customer = await this.customerRepository.assignTo(id, userId, user)

      this.logger.info('Customer assigned successfully', { 
        customerId: id, 
        assignedTo: userId 
      })

      return customer
    } catch (error) {
      this.logger.error('Failed to assign customer', { id, userId, error: error.message })
      throw error
    }
  }

  /**
   * Update customer status
   * @param {number} id - Customer ID
   * @param {string} status - New status
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated customer
   */
  async updateCustomerStatus (id, status, user = null) {
    try {
      const customer = await this.customerRepository.updateStatus(id, status, user)

      this.logger.info('Customer status updated successfully', { 
        customerId: id, 
        status 
      })

      return customer
    } catch (error) {
      this.logger.error('Failed to update customer status', { id, status, error: error.message })
      throw error
    }
  }

  /**
   * Get customer statistics
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics () {
    try {
      return await this.customerRepository.getStatistics()
    } catch (error) {
      this.logger.error('Failed to get customer statistics', { error: error.message })
      throw error
    }
  }

  /**
   * Validate customer data
   * @param {Object} data - Customer data
   * @throws {Error} - Validation error
   */
  validateCustomerData (data) {
    const errors = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email is required')
    } else {
      try {
        this.validateEmail(data.email)
      } catch (error) {
        errors.push(error.message)
      }
    }

    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('Subject is required')
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @throws {Error} - Validation error
   */
  validateEmail (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  /**
   * Batch update customers
   * @param {Array<number>} ids - Customer IDs
   * @param {Object} updateData - Update data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Array>} - Updated customers
   */
  async batchUpdate (ids, updateData, user = null) {
    try {
      const results = []
      
      for (const id of ids) {
        try {
          const customer = await this.updateCustomer(id, updateData, user)
          results.push({ id, success: true, customer })
        } catch (error) {
          results.push({ id, success: false, error: error.message })
        }
      }

      this.logger.info('Batch update completed', { 
        total: ids.length, 
        successful: results.filter(r => r.success).length 
      })

      return results
    } catch (error) {
      this.logger.error('Failed to batch update customers', { error: error.message })
      throw error
    }
  }

  /**
   * Batch delete customers (soft delete)
   * @param {Array<number>} ids - Customer IDs
   * @param {Object} user - User object (optional)
   * @returns {Promise<Array>} - Deletion results
   */
  async batchDelete (ids, user = null) {
    try {
      const results = []
      
      for (const id of ids) {
        try {
          await this.deleteCustomer(id, user)
          results.push({ id, success: true })
        } catch (error) {
          results.push({ id, success: false, error: error.message })
        }
      }

      this.logger.info('Batch delete completed', { 
        total: ids.length, 
        successful: results.filter(r => r.success).length 
      })

      return results
    } catch (error) {
      this.logger.error('Failed to batch delete customers', { error: error.message })
      throw error
    }
  }
}

module.exports = CustomerService

