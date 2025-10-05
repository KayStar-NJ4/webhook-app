/**
 * Theme Manager
 * Manages theme switching and persistence
 */
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'light'
    this.themes = {
      light: {
        name: 'Light',
        class: 'theme-light',
        icon: 'fas fa-sun'
      },
      dark: {
        name: 'Dark',
        class: 'theme-dark',
        icon: 'fas fa-moon'
      },
      auto: {
        name: 'Auto',
        class: 'theme-auto',
        icon: 'fas fa-adjust'
      }
    }
    
    this.init()
  }

  init() {
    this.applyTheme(this.currentTheme)
    this.setupEventListeners()
    this.updateThemeSwitcher()
  }

  setupEventListeners() {
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addListener(() => {
        if (this.currentTheme === 'auto') {
          this.applyTheme('auto')
        }
      })
    }

    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        this.currentTheme = e.newValue || 'light'
        this.applyTheme(this.currentTheme)
        this.updateThemeSwitcher()
      }
    })
  }

  getStoredTheme() {
    try {
      return localStorage.getItem('theme')
    } catch (error) {
      console.warn('Could not access localStorage for theme:', error)
      return 'light'
    }
  }

  setStoredTheme(theme) {
    try {
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.warn('Could not save theme to localStorage:', error)
    }
  }

  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  applyTheme(theme) {
    const body = document.body
    const html = document.documentElement

    // Remove all theme classes
    Object.values(this.themes).forEach(themeConfig => {
      body.classList.remove(themeConfig.class)
      html.classList.remove(themeConfig.class)
    })

    // Apply new theme
    if (theme === 'auto') {
      const systemTheme = this.getSystemTheme()
      const themeConfig = this.themes[systemTheme]
      body.classList.add(themeConfig.class)
      html.classList.add(themeConfig.class)
    } else {
      const themeConfig = this.themes[theme]
      if (themeConfig) {
        body.classList.add(themeConfig.class)
        html.classList.add(themeConfig.class)
      }
    }

    // Update meta theme-color
    this.updateMetaThemeColor(theme)
  }

  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }

    const colors = {
      light: '#ffffff',
      dark: '#343a40',
      auto: this.getSystemTheme() === 'dark' ? '#343a40' : '#ffffff'
    }

    metaThemeColor.content = colors[theme] || colors.light
  }

  setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Unknown theme: ${theme}`)
      return
    }

    this.currentTheme = theme
    this.setStoredTheme(theme)
    this.applyTheme(theme)
    this.updateThemeSwitcher()
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme, themeConfig: this.themes[theme] }
    }))
  }

  toggleTheme() {
    const themeOrder = ['light', 'dark', 'auto']
    const currentIndex = themeOrder.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    this.setTheme(themeOrder[nextIndex])
  }

  updateThemeSwitcher() {
    const switchers = document.querySelectorAll('[data-theme-switcher]')
    switchers.forEach(switcher => {
      const icon = switcher.querySelector('i')
      const text = switcher.querySelector('.theme-text')
      
      if (icon) {
        icon.className = this.themes[this.currentTheme].icon
      }
      
      if (text) {
        text.textContent = this.themes[this.currentTheme].name
      }
    })
  }

  getCurrentTheme() {
    return this.currentTheme
  }

  getAvailableThemes() {
    return Object.keys(this.themes)
  }

  getThemeConfig(theme) {
    return this.themes[theme]
  }
}

// Create global instance
window.ThemeManager = new ThemeManager()

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager
}

// Auto-initialize theme switchers
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers to theme switchers
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-switcher]')) {
      e.preventDefault()
      window.ThemeManager.toggleTheme()
    }
  })

  // Add click handlers for specific theme buttons
  document.addEventListener('click', (e) => {
    const themeButton = e.target.closest('[data-theme="light"], [data-theme="dark"], [data-theme="auto"]')
    if (themeButton) {
      e.preventDefault()
      const theme = themeButton.dataset.theme
      window.ThemeManager.setTheme(theme)
    }
  })
})
