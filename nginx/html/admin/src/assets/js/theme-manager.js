/**
 * Theme Manager - Quản lý theme và màu sắc toàn cục
 * Cho phép thay đổi màu sắc động và lưu preferences
 */

class ThemeManager {
  constructor() {
    this.themes = {
      default: {
        name: 'Default Blue',
        '--primary-color': '#007bff',
        '--primary-hover': '#0056b3',
        '--primary-light': '#e3f2fd',
        '--primary-dark': '#004085'
      },
      green: {
        name: 'Green Theme',
        '--primary-color': '#28a745',
        '--primary-hover': '#1e7e34',
        '--primary-light': '#d4edda',
        '--primary-dark': '#155724'
      },
      purple: {
        name: 'Purple Theme',
        '--primary-color': '#6f42c1',
        '--primary-hover': '#5a32a3',
        '--primary-light': '#e2d9f3',
        '--primary-dark': '#4a2c7a'
      },
      orange: {
        name: 'Orange Theme',
        '--primary-color': '#fd7e14',
        '--primary-hover': '#e55a00',
        '--primary-light': '#ffeaa7',
        '--primary-dark': '#b8651b'
      },
      dark: {
        name: 'Dark Theme',
        '--primary-color': '#17a2b8',
        '--primary-hover': '#138496',
        '--primary-light': '#d1ecf1',
        '--primary-dark': '#0c5460',
        '--bg-primary': '#1a1a1a',
        '--bg-secondary': '#2d2d2d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#cccccc',
        '--border-color': '#404040',
        '--light-color': '#2d2d2d'
      }
    };
    
    this.currentTheme = this.getStoredTheme() || 'default';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeSelector();
    this.bindEvents();
  }

  /**
   * Áp dụng theme
   */
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    
    Object.keys(theme).forEach(key => {
      if (key !== 'name') {
        root.style.setProperty(key, theme[key]);
      }
    });

    this.currentTheme = themeName;
    this.saveTheme(themeName);
    
    // Dispatch event để các component khác có thể lắng nghe
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeName, themeData: theme }
    }));
  }

  /**
   * Lấy theme đã lưu
   */
  getStoredTheme() {
    return localStorage.getItem('admin-theme');
  }

  /**
   * Lưu theme
   */
  saveTheme(themeName) {
    localStorage.setItem('admin-theme', themeName);
  }

  /**
   * Tạo theme selector
   */
  createThemeSelector() {
    // Tạo dropdown theme selector
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="themeDropdown" data-toggle="dropdown">
          <i class="fas fa-palette mr-2"></i>
          Theme
        </button>
        <div class="dropdown-menu" aria-labelledby="themeDropdown">
          ${Object.keys(this.themes).map(key => `
            <a class="dropdown-item theme-option ${key === this.currentTheme ? 'active' : ''}" 
               href="#" data-theme="${key}">
              <i class="fas fa-circle mr-2" style="color: ${this.themes[key]['--primary-color']}"></i>
              ${this.themes[key].name}
            </a>
          `).join('')}
        </div>
      </div>
    `;

    // Thêm vào header hoặc sidebar
    const header = document.querySelector('.navbar, .header, .main-header');
    if (header) {
      header.appendChild(themeSelector);
    }
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Theme selector click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('theme-option')) {
        e.preventDefault();
        const themeName = e.target.getAttribute('data-theme');
        this.applyTheme(themeName);
        
        // Update active state
        document.querySelectorAll('.theme-option').forEach(option => {
          option.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            this.applyTheme('default');
            break;
          case '2':
            e.preventDefault();
            this.applyTheme('green');
            break;
          case '3':
            e.preventDefault();
            this.applyTheme('purple');
            break;
          case '4':
            e.preventDefault();
            this.applyTheme('orange');
            break;
          case '5':
            e.preventDefault();
            this.applyTheme('dark');
            break;
        }
      }
    });
  }

  /**
   * Tạo custom theme
   */
  createCustomTheme(name, colors) {
    const themeId = name.toLowerCase().replace(/\s+/g, '-');
    this.themes[themeId] = {
      name: name,
      ...colors
    };
    return themeId;
  }

  /**
   * Lấy danh sách themes
   */
  getThemes() {
    return this.themes;
  }

  /**
   * Lấy theme hiện tại
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Reset về theme mặc định
   */
  resetToDefault() {
    this.applyTheme('default');
  }

  /**
   * Export theme config
   */
  exportTheme() {
    const theme = this.themes[this.currentTheme];
    const dataStr = JSON.stringify(theme, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `theme-${this.currentTheme}.json`;
    link.click();
  }

  /**
   * Import theme config
   */
  importTheme(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target.result);
        const themeId = this.createCustomTheme(theme.name, theme);
        this.applyTheme(themeId);
      } catch (error) {
        console.error('Error importing theme:', error);
        if (window.ToastService) {
          window.ToastService.error('Lỗi khi import file theme');
        } else {
          alert('Error importing theme file');
        }
      }
    };
    reader.readAsText(file);
  }
}

// Khởi tạo Theme Manager
window.themeManager = new ThemeManager();

// Export cho sử dụng trong modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

// CSS cho theme selector
const themeSelectorCSS = `
.theme-selector {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.theme-selector .dropdown-menu {
  min-width: 200px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.theme-selector .theme-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  transition: var(--transition-base);
}

.theme-selector .theme-option:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

.theme-selector .theme-option.active {
  background-color: var(--primary-color);
  color: var(--white-color);
}

.theme-selector .theme-option.active:hover {
  background-color: var(--primary-hover);
}

/* Animation cho theme transition */
* {
  transition: background-color var(--transition-base), 
              color var(--transition-base), 
              border-color var(--transition-base) !important;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = themeSelectorCSS;
document.head.appendChild(style);
