/**
 * Platform Value Object - Represents supported platforms
 */
class Platform {
  static TELEGRAM = 'telegram'
  static CHATWOOT = 'chatwoot'
  static DIFY = 'dify'
  static WEB = 'web'

  static ALL = [Platform.TELEGRAM, Platform.CHATWOOT, Platform.DIFY, Platform.WEB]

  constructor (value) {
    if (!Platform.ALL.includes(value)) {
      throw new Error(`Invalid platform: ${value}. Supported platforms: ${Platform.ALL.join(', ')}`)
    }
    this.value = value
  }

  toString () {
    return this.value
  }

  equals (other) {
    return other instanceof Platform && this.value === other.value
  }

  isTelegram () {
    return this.value === Platform.TELEGRAM
  }

  isChatwoot () {
    return this.value === Platform.CHATWOOT
  }

  isDify () {
    return this.value === Platform.DIFY
  }

  isWeb () {
    return this.value === Platform.WEB
  }
}

module.exports = Platform
