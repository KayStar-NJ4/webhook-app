<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-title">
          <i class="fas fa-robot"></i>
          {{ $t('app.name') }}
        </h1>
        <p class="auth-subtitle">{{ $t('auth.subtitle') }}</p>
      </div>
      
      <div class="auth-content">
        <router-view />
      </div>
      
      <div class="auth-footer">
        <div class="language-switcher">
          <select v-model="currentLanguage" @change="changeLanguage" class="lang-select">
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
        <p class="copyright">{{ $t('app.copyright') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout',
  data() {
    return {
      currentLanguage: 'vi'
    }
  },
  mounted() {
    this.loadLanguage()
  },
  methods: {
    loadLanguage() {
      const savedLang = localStorage.getItem('language')
      if (savedLang) {
        this.currentLanguage = savedLang
        this.$i18n.locale = savedLang
      }
    },

    changeLanguage(lang) {
      this.currentLanguage = lang.target.value
      this.$i18n.locale = this.currentLanguage
      localStorage.setItem('language', this.currentLanguage)
    }
  }
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.auth-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

.auth-title {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.auth-title i {
  font-size: 32px;
}

.auth-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.auth-content {
  padding: 40px 30px;
}

.auth-footer {
  padding: 20px 30px;
  background: #f8f9fa;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

.language-switcher {
  margin-bottom: 15px;
}

.lang-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.copyright {
  margin: 0;
  color: #6c757d;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 480px) {
  .auth-container {
    margin: 10px;
  }
  
  .auth-header,
  .auth-content {
    padding: 30px 20px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>
