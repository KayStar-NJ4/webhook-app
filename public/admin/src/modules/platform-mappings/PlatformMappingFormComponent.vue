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
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="sourcePlatform">Nguồn <span class="text-danger">*</span></label>
                <select id="sourcePlatform" class="form-control" v-model="formData.source_platform" required>
                  <option value="">Chọn platform</option>
                  <option value="telegram">Telegram</option>
                  <option value="chatwoot">Chatwoot</option>
                  <option value="dify">Dify</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="sourceId">Tài khoản/bot nguồn <span class="text-danger">*</span></label>
                <select id="sourceId" class="form-control" v-model="formData.source_id" :disabled="!formData.source_platform" required>
                  <option value="">Chọn</option>
                  <option v-for="opt in sourceOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Generic mapping: Target -->
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="targetPlatform">Đích <span class="text-danger">*</span></label>
                <select id="targetPlatform" class="form-control" v-model="formData.target_platform" required>
                  <option value="">Chọn platform</option>
                  <option value="telegram">Telegram</option>
                  <option value="chatwoot">Chatwoot</option>
                  <option value="dify">Dify</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="targetId">Tài khoản/bot đích <span class="text-danger">*</span></label>
                <select id="targetId" class="form-control" v-model="formData.target_id" :disabled="!formData.target_platform" required>
                  <option value="">Chọn</option>
                  <option v-for="opt in targetOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Trạng thái</label>
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="mappingActive"
                v-model="formData.is_active"
              >
              <label class="form-check-label" for="mappingActive">
                Hoạt động
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="bidirectional"
                v-model="formData.enable_bidirectional"
              >
              <label class="form-check-label" for="bidirectional">
                Cho phép 2 chiều (đích quay lại nguồn)
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
        target_platform: '',
        target_id: '',
        enable_bidirectional: false,
        description: '',
        is_active: true
      },
      available: {
        telegramBots: [],
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
      if (this.formData.source_platform === 'chatwoot') return this.available.chatwootAccounts
      if (this.formData.source_platform === 'dify') return this.available.difyApps
      return []
    },
    targetOptions() {
      if (this.formData.target_platform === 'telegram') return this.available.telegramBots
      if (this.formData.target_platform === 'chatwoot') return this.available.chatwootAccounts
      if (this.formData.target_platform === 'dify') return this.available.difyApps
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
            target_platform: newVal.target_platform || newVal.targetPlatform || '',
            target_id: newVal.target_id || newVal.targetId || '',
            enable_bidirectional: newVal.enable_bidirectional || newVal.enableBidirectional || false,
            description: newVal.description || '',
            is_active: newVal.is_active !== undefined ? newVal.is_active : true
          }
        }
      },
      immediate: true
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
        // Validate generic fields
        if (!this.formData.source_platform || !this.formData.source_id || !this.formData.target_platform || !this.formData.target_id) {
          this.isSaving = false
          this.errors = { name: this.formData.name ? undefined : ['Bắt buộc'] }
          return
        }

        const payload = {
          name: this.formData.name?.trim() || undefined,
          sourcePlatform: this.formData.source_platform,
          sourceId: Number(this.formData.source_id),
          targetPlatform: this.formData.target_platform,
          targetId: Number(this.formData.target_id),
          enableBidirectional: !!this.formData.enable_bidirectional,
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
        }
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>
