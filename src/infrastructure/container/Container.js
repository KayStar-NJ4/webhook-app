/**
 * Dependency Injection Container
 * Manages dependencies and their lifecycle
 */
class Container {
  constructor () {
    this.services = new Map()
    this.singletons = new Map()
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {Function} factory - Service factory function
   * @param {boolean} singleton - Whether to create as singleton
   */
  register (name, factory, singleton = true) {
    this.services.set(name, { factory, singleton })
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {any} - Service instance
   */
  get (name) {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service '${name}' not found`)
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        const instance = service.factory(this)
        this.singletons.set(name, instance)
      }
      return this.singletons.get(name)
    } else {
      return service.factory(this)
    }
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has (name) {
    return this.services.has(name)
  }

  /**
   * Clear all services
   */
  clear () {
    this.services.clear()
    this.singletons.clear()
  }
}

module.exports = Container
