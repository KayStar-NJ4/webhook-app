<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Loại Platform <span class="text-danger">*</span></label>
            <select 
              v-model="form.platformType" 
              class="form-control"
              :class="{ 'is-invalid': errors.platformType }"
              required
              @change="onPlatformTypeChange"
            >
              <option value="">Chọn loại platform</option>
              <option value="telegram">Telegram</option>
              <option value="zalo">Zalo (Sắp có)</option>
              <option value="facebook">Facebook (Sắp có)</option>
            </select>
            <div v-if="errors.platformType" class="invalid-feedback">
              {{ errors.platformType }}
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="form-group">
            <label>{{ getPlatformLabel() }} <span class="text-danger">*</span></label>
            <select 
              v-model="form.platformId" 
              class="form-control"
              :class="{ 'is-invalid': errors.platformId }"
              required
              :disabled="!form.platformType"
            >
              <option value="">Chọn {{ getPlatformLabel() }}</option>
              <option 
                v-for="item in getAvailablePlatformItems()" 
                :key="item.id" 
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
            <div v-if="errors.platformId" class="invalid-feedback">
              {{ errors.platformId }}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Chatwoot Account <span class="text-danger">*</span></label>
            <select 
              v-model="form.chatwootAccountId" 
              class="form-control"
              :class="{ 'is-invalid': errors.chatwootAccountId }"
              required
            >
              <option value="">Chọn Chatwoot Account</option>
              <option 
                v-for="account in availablePlatforms?.chatwootAccounts || []" 
                :key="account.id" 
                :value="account.id"
              >
                {{ account.name }}
              </option>
            </select>
            <div v-if="errors.chatwootAccountId" class="invalid-feedback">
              {{ errors.chatwootAccountId }}
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="form-group">
            <label>Dify App <span class="text-danger">*</span></label>
            <select 
              v-model="form.difyAppId" 
              class="form-control"
              :class="{ 'is-invalid': errors.difyAppId }"
              required
            >
              <option value="">Chọn Dify App</option>
              <option 
                v-for="app in availablePlatforms?.difyApps || []" 
                :key="app.id" 
                :value="app.id"
              >
                {{ app.name }}
              </option>
            </select>
            <div v-if="errors.difyAppId" class="invalid-feedback">
              {{ errors.difyAppId }}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Trạng thái</label>
            <div class="form-check">
              <input 
                type="checkbox" 
                v-model="form.isActive" 
                class="form-check-input" 
                id="isActive"
              >
              <label class="form-check-label" for="isActive">
                Kích hoạt liên kết
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Routing Configuration -->
      <div class="card mt-3">
        <div class="card-header">
          <h5 class="mb-0">Cấu hình Routing</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.enableTelegramToChatwoot" 
                  class="form-check-input" 
                  id="telegramToChatwoot"
                >
                <label class="form-check-label" for="telegramToChatwoot">
                  {{ getPlatformLabel() }} → Chatwoot
                </label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.enableTelegramToDify" 
                  class="form-check-input" 
                  id="telegramToDify"
                >
                <label class="form-check-label" for="telegramToDify">
                  {{ getPlatformLabel() }} → Dify
                </label>
              </div>
            </div>
          </div>
          <div class="row mt-2">
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.enableChatwootToTelegram" 
                  class="form-check-input" 
                  id="chatwootToTelegram"
                >
                <label class="form-check-label" for="chatwootToTelegram">
                  Chatwoot → {{ getPlatformLabel() }}
                </label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.enableDifyToChatwoot" 
                  class="form-check-input" 
                  id="difyToChatwoot"
                >
                <label class="form-check-label" for="difyToChatwoot">
                  Dify → Chatwoot
                </label>
              </div>
            </div>
          </div>
          <div class="row mt-2">
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.enableDifyToTelegram" 
                  class="form-check-input" 
                  id="difyToTelegram"
                >
                <label class="form-check-label" for="difyToTelegram">
                  Dify → {{ getPlatformLabel() }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto Connect Configuration -->
      <div class="card mt-3">
        <div class="card-header">
          <h5 class="mb-0">Cấu hình Auto Connect</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.autoConnectTelegramChatwoot" 
                  class="form-check-input" 
                  id="autoConnectTelegramChatwoot"
                >
                <label class="form-check-label" for="autoConnectTelegramChatwoot">
                  Tự động kết nối {{ getPlatformLabel() }}-Chatwoot
                </label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  v-model="form.autoConnectTelegramDify" 
                  class="form-check-input" 
                  id="autoConnectTelegramDify"
                >
                <label class="form-check-label" for="autoConnectTelegramDify">
                  Tự động kết nối {{ getPlatformLabel() }}-Dify
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" @click="handleCancel">
          <i class="fas fa-times mr-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="isSubmitting"
        >
          <i class="fas fa-save mr-1" v-if="!isSubmitting"></i>
          <i class="fas fa-spinner fa-spin mr-1" v-if="isSubmitting"></i>
          {{ isSubmitting ? 'Đang xử lý...' : (item ? 'Cập nhật' : 'Thêm mới') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'PlatformMappingFormComponent',
  props: {
    item: {
      type: Object,
      default: null
    },
    availablePlatforms: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isSubmitting: false,
      form: {
        platformType: 'telegram',
        platformId: '',
        telegramBotId: '',
        chatwootAccountId: '',
        difyAppId: '',
        isActive: true,
        enableTelegramToChatwoot: true,
        enableTelegramToDify: true,
        enableChatwootToTelegram: true,
        enableDifyToChatwoot: true,
        enableDifyToTelegram: true,
        autoConnectTelegramChatwoot: true,
        autoConnectTelegramDify: true
      },
      errors: {}
    }
  },
  watch: {
    item: {
      handler(newItem) {
        if (newItem) {
          this.form = {
            platformType: newItem.platform_type || 'telegram',
            platformId: newItem.platform_id || newItem.telegram_bot_id || '',
            telegramBotId: newItem.telegram_bot_id || '',
            chatwootAccountId: newItem.chatwoot_account_id || '',
            difyAppId: newItem.dify_app_id || '',
            isActive: newItem.is_active !== false,
            enableTelegramToChatwoot: newItem.enable_telegram_to_chatwoot !== false,
            enableTelegramToDify: newItem.enable_telegram_to_dify !== false,
            enableChatwootToTelegram: newItem.enable_chatwoot_to_telegram !== false,
            enableDifyToChatwoot: newItem.enable_dify_to_chatwoot !== false,
            enableDifyToTelegram: newItem.enable_dify_to_telegram !== false,
            autoConnectTelegramChatwoot: newItem.auto_connect_telegram_chatwoot !== false,
            autoConnectTelegramDify: newItem.auto_connect_telegram_dify !== false
          }
          
          // Set platformId based on platform type
          if (this.form.platformType === 'telegram') {
            this.form.platformId = newItem.telegram_bot_id || ''
          } else {
            this.form.platformId = newItem.platform_id || ''
          }
        } else {
          // Reset form for new item
          this.form = {
            platformType: 'telegram',
            platformId: '',
            telegramBotId: '',
            chatwootAccountId: '',
            difyAppId: '',
            isActive: true,
            enableTelegramToChatwoot: true,
            enableTelegramToDify: true,
            enableChatwootToTelegram: true,
            enableDifyToChatwoot: true,
            enableDifyToTelegram: true,
            autoConnectTelegramChatwoot: true,
            autoConnectTelegramDify: true
          }
        }
      },
      immediate: true
    },
    availablePlatforms: {
      handler(newVal) {
        if (newVal && this.item) {
          // Re-set platformId when availablePlatforms is loaded
          if (this.form.platformType === 'telegram') {
            this.form.platformId = this.item.telegram_bot_id || ''
          } else {
            this.form.platformId = this.item.platform_id || ''
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    async handleSubmit() {
      this.isSubmitting = true
      this.errors = {}

      try {
        // Prepare form data
        const formData = {
          ...this.form,
          // Set telegramBotId based on platform type and selection
          telegramBotId: this.form.platformType === 'telegram' ? this.form.platformId : null,
          // For now, always use platformId as the selected platform ID
          platformId: this.form.platformId
        }

        if (this.item) {
          await window.AdminService.updatePlatformMapping(this.item.id, formData)
          window.ToastService.success('Cập nhật liên kết thành công!')
        } else {
          await window.AdminService.createPlatformMapping(formData)
          window.ToastService.success('Tạo liên kết thành công!')
        }
        
        // Clear form data after successful save
        this.resetForm()
        this.$emit('saved')
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          window.ToastService.error('Lỗi khi lưu liên kết: ' + error.message)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    handleCancel() {
      // Clear form data when cancel
      this.resetForm()
      this.$emit('cancelled')
    },

    resetForm() {
      this.form = {
        platformType: 'telegram',
        platformId: '',
        telegramBotId: '',
        chatwootAccountId: '',
        difyAppId: '',
        isActive: true,
        enableTelegramToChatwoot: true,
        enableTelegramToDify: true,
        enableChatwootToTelegram: true,
        enableDifyToChatwoot: true,
        enableDifyToTelegram: true,
        autoConnectTelegramChatwoot: true,
        autoConnectTelegramDify: true
      }
      this.errors = {}
    },

    onPlatformTypeChange() {
      // Reset platform selection when platform type changes (only for new items)
      if (!this.item) {
        this.form.platformId = ''
      }
      // telegramBotId will be set automatically in handleSubmit based on platformType
    },

    getPlatformLabel() {
      const labels = {
        telegram: 'Telegram Bot',
        zalo: 'Zalo Bot',
        facebook: 'Facebook Page'
      }
      return labels[this.form.platformType] || 'Platform'
    },

    getAvailablePlatformItems() {
      if (!this.availablePlatforms) return []
      
      switch (this.form.platformType) {
        case 'telegram':
          return this.availablePlatforms.telegramBots || []
        case 'zalo':
          return this.availablePlatforms.zaloBots || []
        case 'facebook':
          return this.availablePlatforms.facebookPages || []
        default:
          return []
      }
    }
  }
}
</script>

<style scoped>
.form-check {
  margin-bottom: 0.5rem;
}

.card {
  border: 1px solid #dee2e6;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.text-danger {
  color: #dc3545 !important;
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}
</style>
