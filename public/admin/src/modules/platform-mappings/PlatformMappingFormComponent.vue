<template>
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="platformMappingFormModalLabel">
          {{ isEdit ? 'Chỉnh sửa Platform Mapping' : 'Tạo Platform Mapping mới' }}
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- Generic mapping: Source -->
          <!-- Social Platform (Source) -->
          <div class="card mb-3">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0">
                <i class="fas fa-sign-in-alt mr-2"></i>
                Nguồn tin nhắn (Social Platform)
              </h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="sourcePlatform">
                      Platform mạng xã hội <span class="text-danger">*</span>
                    </label>
                    <select id="sourcePlatform" class="form-control" v-model="formData.source_platform" required @change="onSourcePlatformChange">
                      <option value="">Chọn platform</option>
                      <option value="telegram">📱 Telegram Bot</option>
                      <option value="web">🌐 Web (Landing Page)</option>
                      <option value="zalo">💭 Zalo Bot</option>
                      <option value="facebook">📘 Facebook Messenger</option>
                      <option value="whatsapp">📱 WhatsApp Business</option>
                    </select>
                    <small class="form-text text-muted">
                      Nơi người dùng gửi tin nhắn
                    </small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="sourceId">
                      Bot/Account <span class="text-danger">*</span>
                    </label>
                    <select id="sourceId" class="form-control" v-model="formData.source_id" :disabled="!formData.source_platform" required>
                      <option value="">Chọn {{ getSourcePlatformName() }}</option>
                      <option v-for="opt in sourceOptions" :key="opt.id" :value="opt.id">
                        {{ opt.name }}
                        <span v-if="!opt.isActive" class="text-muted">(Không hoạt động)</span>
                      </option>
                    </select>
                    <small class="form-text text-muted">
                      {{ getSourceDescription() }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Target Platforms (Chatwoot + Dify) -->
          <div class="card mb-3">
            <div class="card-header bg-success text-white">
              <h6 class="mb-0">
                <i class="fas fa-share-alt mr-2"></i>
                Đích tin nhắn (Chatwoot + Dify)
              </h6>
            </div>
            <div class="card-body">
              <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="chatwootAccountId">
                    <i class="fas fa-comments mr-1"></i>
                    Chatwoot Account
                  </label>
                  <select id="chatwootAccountId" class="form-control" v-model="formData.chatwoot_account_id">
                    <option value="">Chọn Chatwoot Account (tùy chọn)</option>
                    <option v-for="account in available.chatwootAccounts" :key="account.id" :value="account.id">
                      {{ account.name }}
                      <span v-if="!account.isActive" class="text-muted">(Không hoạt động)</span>
                    </option>
                  </select>
                  <small class="form-text text-muted">
                    Lưu trữ và quản lý cuộc trò chuyện
                  </small>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="difyAppId">
                    <i class="fas fa-robot mr-1"></i>
                    Dify App
                  </label>
                  <select id="difyAppId" class="form-control" v-model="formData.dify_app_id">
                    <option value="">Chọn Dify App (tùy chọn)</option>
                    <option v-for="app in available.difyApps" :key="app.id" :value="app.id">
                      {{ app.name }}
                      <span v-if="!app.isActive" class="text-muted">(Không hoạt động)</span>
                    </option>
                  </select>
                  <small class="form-text text-muted">
                    Xử lý tin nhắn với AI và tạo phản hồi
                  </small>
                </div>
              </div>
              </div>
            </div>
          </div>

          <!-- Mapping Name -->
          <div class="form-group">
            <label for="mappingName">
              <i class="fas fa-tag mr-1"></i>
              Tên luồng
            </label>
            <input 
              type="text" 
              id="mappingName" 
              class="form-control" 
              v-model="formData.name" 
              :placeholder="generateMappingName()"
            >
            <small class="form-text text-muted">
              Tên mô tả để dễ nhận biết luồng này (tự động tạo nếu để trống)
            </small>
          </div>

          <!-- Target Selection Error -->
          <div v-if="errors.target_selection" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            {{ errors.target_selection[0] }}
          </div>

          <!-- Status -->
          <div class="form-group">
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="mappingActive"
                v-model="formData.is_active"
              >
              <label class="form-check-label" for="mappingActive">
                <i class="fas fa-power-off mr-1"></i>
                Kích hoạt luồng này
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Hủy
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
            {{ isSaving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlatformMappingFormComponent',
  props: {
    id: {
      type: [Number, String],
      default: 0
    },
    object_info: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    this.loadAvailable()
  },
  data() {
    return {
      formData: {
        name: '',
        source_platform: '',
        source_id: '',
        chatwoot_account_id: '',
        dify_app_id: '',
        is_active: true
      },
      available: {
        telegramBots: [],
        zaloBots: [],
        webApps: [],
        chatwootAccounts: [],
        difyApps: []
      },
      errors: {},
      isSaving: false
    }
  },
  computed: {
    isEdit() {
      return this.id && this.id !== 0
    },
    sourceOptions() {
      if (this.formData.source_platform === 'telegram') return this.available.telegramBots
      if (this.formData.source_platform === 'web') return this.available.webApps
      if (this.formData.source_platform === 'zalo') return this.available.zaloBots || []
      if (this.formData.source_platform === 'facebook') return this.available.facebookPages || []
      if (this.formData.source_platform === 'whatsapp') return this.available.whatsappAccounts || []
      return []
    }
  },
  watch: {
    object_info: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.formData = {
            name: newVal.name || '',
            source_platform: newVal.source_platform || newVal.sourcePlatform || '',
            source_id: newVal.source_id || newVal.sourceId || '',
            chatwoot_account_id: newVal.chatwoot_account_id || newVal.chatwootAccountId || '',
            dify_app_id: newVal.dify_app_id || newVal.difyAppId || '',
            is_active: newVal.is_active !== undefined ? newVal.is_active : true
          }
        }
      },
      immediate: true
    },
    // Auto-update name when selections change
    'formData.chatwoot_account_id': {
      handler() {
        if (!this.formData.name || this.formData.name.includes('→')) {
          this.$nextTick(() => {
            this.formData.name = this.generateMappingName()
          })
        }
      }
    },
    'formData.dify_app_id': {
      handler() {
        if (!this.formData.name || this.formData.name.includes('→')) {
          this.$nextTick(() => {
            this.formData.name = this.generateMappingName()
          })
        }
      }
    }
  },
  methods: {
    async loadAvailable() {
      try {
        const res = await window.PlatformMappingService.getAvailablePlatforms()
        if (res.data?.success && res.data?.data) {
          this.available = res.data.data
        }
      } catch (e) {
        // ignore
      }
    },
    async handleSubmit() {
      this.errors = {}
      this.isSaving = true

      try {
        // Validate required fields
        if (!this.formData.source_platform || !this.formData.source_id) {
          this.isSaving = false
          this.errors = { 
            source_platform: !this.formData.source_platform ? ['Bắt buộc'] : undefined,
            source_id: !this.formData.source_id ? ['Bắt buộc'] : undefined
          }
          return
        }
        
        // Validate at least one target must be selected
        if (!this.formData.chatwoot_account_id && !this.formData.dify_app_id) {
          this.isSaving = false
          this.errors = { 
            target_selection: ['Vui lòng chọn ít nhất 1 trong 2: Chatwoot Account hoặc Dify App']
          }
          return
        }

        // Auto-generate name if not provided
        const name = this.formData.name?.trim() || this.generateMappingName()

        const payload = {
          name: name,
          sourcePlatform: this.formData.source_platform,
          sourceId: Number(this.formData.source_id),
          chatwootAccountId: this.formData.chatwoot_account_id ? Number(this.formData.chatwoot_account_id) : null,
          difyAppId: this.formData.dify_app_id ? Number(this.formData.dify_app_id) : null,
          isActive: !!this.formData.is_active
        }

        const response = this.isEdit 
          ? await window.PlatformMappingService.update(this.id, payload)
          : await window.PlatformMappingService.create(payload)
        
        if (response.data.success) {
          this.$emit('success', response.data.data)
        } else {
          this.errors = response.data.errors || {}
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          console.error('Error saving platform mapping:', error)
          this.errors = { general: [error.message || 'Có lỗi xảy ra khi lưu mapping'] }
        }
      } finally {
        this.isSaving = false
      }
    },
    onSourcePlatformChange() {
      // Reset source_id when platform changes
      this.formData.source_id = ''
    },
    getSourcePlatformName() {
      const names = {
        telegram: 'Telegram Bot',
        web: 'Web App',
        zalo: 'Zalo Bot',
        facebook: 'Facebook Page',
        whatsapp: 'WhatsApp Business'
      }
      return names[this.formData.source_platform] || this.formData.source_platform
    },
    getSourceDescription() {
      const descriptions = {
        telegram: 'Chọn Telegram bot sẽ nhận tin nhắn từ người dùng',
        web: 'Chọn Web App (landing page) sẽ nhận tin nhắn từ trình duyệt',
        zalo: 'Chọn Zalo bot sẽ nhận tin nhắn từ người dùng',
        facebook: 'Chọn Facebook Page để nhận tin nhắn',
        whatsapp: 'Chọn WhatsApp Business để nhận tin nhắn'
      }
      return descriptions[this.formData.source_platform] || ''
    },
    generateMappingName() {
      if (!this.formData.source_platform) {
        return 'Tên luồng sẽ tự động tạo'
      }
      
      const sourceName = this.getSourcePlatformName()
      const targets = []
      if (this.formData.chatwoot_account_id) targets.push('Chatwoot')
      if (this.formData.dify_app_id) targets.push('Dify')
      
      if (targets.length === 0) {
        return `${sourceName} → [Chọn đích]`
      }
      return `${sourceName} → ${targets.join(' + ')}`
    }
  }
}
</script>
