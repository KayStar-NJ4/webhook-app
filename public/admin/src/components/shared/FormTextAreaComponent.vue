<template>
  <div class="form-group">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxLength"
      :class="textareaClasses"
      autocomplete="off"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    ></textarea>
    <div v-if="showCharCount" class="char-count">
      {{ modelValue?.length || 0 }}{{ maxLength ? ` / ${maxLength}` : '' }}
    </div>
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>
    <div v-if="helpText" class="help-text">
      {{ helpText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormTextAreaComponent',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    helpText: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 4
    },
    maxLength: {
      type: Number,
      default: null
    },
    showCharCount: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `textarea-${Math.random().toString(36).substr(2, 9)}`
    },
    textareaClasses() {
      return [
        'form-textarea',
        `form-textarea--${this.size}`,
        {
          'form-textarea--error': this.error,
          'form-textarea--disabled': this.disabled
        }
      ]
    }
  },
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value)
    },
    handleBlur(event) {
      this.$emit('blur', event)
    },
    handleFocus(event) {
      this.$emit('focus', event)
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: white;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea--error {
  border-color: #e74c3c;
}

.form-textarea--error:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-textarea--disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  resize: none;
}

.form-textarea--small {
  padding: 8px 12px;
  font-size: 12px;
  min-height: 80px;
}

.form-textarea--large {
  padding: 16px 20px;
  font-size: 16px;
  min-height: 120px;
}

.char-count {
  text-align: right;
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.help-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 5px;
}
</style>
