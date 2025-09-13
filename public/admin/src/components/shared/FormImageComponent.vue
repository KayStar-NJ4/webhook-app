<template>
  <div class="form-group" :class="{ 'row': is_row }">
    <label v-if="label" :for="id" :class="is_row ? 'col-sm-3 col-form-label' : ''">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <div :class="is_row ? 'col-sm-9' : ''">
      <div class="image-upload-container">
        <!-- Current image preview -->
        <div v-if="currentImageUrl" class="current-image-preview mb-3">
          <img 
            :src="currentImageUrl" 
            :alt="label"
            class="img-thumbnail"
            style="max-width: 200px; max-height: 200px;"
          />
          <div class="mt-2">
            <button 
              type="button" 
              class="btn btn-sm btn-danger"
              @click="removeImage"
            >
              <i class="fas fa-trash"></i> Xóa ảnh
            </button>
          </div>
        </div>

        <!-- Upload area -->
        <div class="upload-area" :class="{ 'is-dragover': isDragOver }">
          <input
            :id="inputId"
            :name="name"
            type="file"
            ref="fileInput"
            accept="image/*"
            @change="handleFileSelect"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            style="display: none;"
          />
          
          <div 
            class="upload-placeholder"
            @click="triggerFileSelect"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
          >
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p class="mb-0">
              <strong>Kéo thả ảnh vào đây</strong> hoặc 
              <span class="text-primary" style="cursor: pointer;">chọn ảnh</span>
            </p>
            <small class="text-muted">Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)</small>
          </div>
        </div>

        <!-- Upload progress -->
        <div v-if="isUploading" class="upload-progress mt-3">
          <div class="progress">
            <div 
              class="progress-bar progress-bar-striped progress-bar-animated" 
              :style="{ width: uploadProgress + '%' }"
            >
              {{ uploadProgress }}%
            </div>
          </div>
        </div>

        <!-- Error message -->
        <span v-if="is_error && error_message" class="text-danger mt-2">
          <small>{{ error_message }}</small>
        </span>

        <!-- Help text -->
        <span v-if="help_text" class="form-text text-muted">
          <small>{{ help_text }}</small>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormImageComponent',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    is_row: {
      type: Boolean,
      default: false
    },
    is_error: {
      type: Boolean,
      default: false
    },
    error_message: {
      type: String,
      default: ''
    },
    help_text: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    folder: {
      type: String,
      default: 'uploads'
    },
    maxSize: {
      type: Number,
      default: 5 * 1024 * 1024 // 5MB
    }
  },
  emits: ['update:modelValue'],
  computed: {
    inputId() {
      return this.id || `image-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  data() {
    return {
      isDragOver: false,
      isUploading: false,
      uploadProgress: 0,
      currentImageUrl: this.modelValue
    }
  },
  watch: {
    modelValue(newVal) {
      this.currentImageUrl = newVal
    }
  },
  methods: {
    triggerFileSelect() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },
    
    handleDrop(event) {
      this.isDragOver = false
      const file = event.dataTransfer.files[0]
      if (file) {
        this.processFile(file)
      }
    },
    
    processFile(file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.$emit('error', 'Vui lòng chọn file ảnh hợp lệ')
        return
      }
      
      // Validate file size
      if (file.size > this.maxSize) {
        this.$emit('error', `File quá lớn. Kích thước tối đa: ${this.maxSize / (1024 * 1024)}MB`)
        return
      }
      
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentImageUrl = e.target.result
        this.$emit('update:modelValue', e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Upload file (simulate upload progress)
      this.uploadFile(file)
    },
    
    uploadFile(file) {
      this.isUploading = true
      this.uploadProgress = 0
      
      // Simulate upload progress
      const interval = setInterval(() => {
        this.uploadProgress += Math.random() * 30
        if (this.uploadProgress >= 100) {
          this.uploadProgress = 100
          clearInterval(interval)
          
          // Simulate upload completion
          setTimeout(() => {
            this.isUploading = false
            this.uploadProgress = 0
            
            // In real implementation, you would upload to server here
            // For now, we'll just emit the file data
            this.$emit('file-uploaded', {
              file: file,
              url: this.currentImageUrl,
              folder: this.folder
            })
          }, 500)
        }
      }, 100)
    },
    
    removeImage() {
      this.currentImageUrl = ''
      this.$emit('update:modelValue', '')
      this.$refs.fileInput.value = ''
    }
  }
}
</script>

<style scoped>
.image-upload-container {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  padding: 1rem;
  background-color: #f8f9fa;
}

.upload-area {
  border: 2px dashed #ced4da;
  border-radius: 0.25rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.upload-area.is-dragover {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.upload-placeholder {
  pointer-events: none;
}

.current-image-preview {
  text-align: center;
}

.img-thumbnail {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  padding: 0.25rem;
}

.upload-progress {
  margin-top: 1rem;
}

.progress {
  height: 1rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #007bff;
  transition: width 0.3s ease;
}

.text-danger {
  color: #dc3545 !important;
}

.text-muted {
  color: #6c757d !important;
}

.text-primary {
  color: #007bff !important;
}

.form-text {
  font-size: 0.875rem;
}
</style>
