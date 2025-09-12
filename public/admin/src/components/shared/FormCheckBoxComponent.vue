<template>
  <div class="form-group">
    <label v-if="label" :for="id" class="checkbox-label">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :class="checkboxClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <span class="checkbox-text">
        {{ label }}
        <span v-if="required" class="required">*</span>
      </span>
    </label>
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
  name: 'FormCheckBoxComponent',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    label: {
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
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `checkbox-${Math.random().toString(36).substr(2, 9)}`
    },
    checkboxClasses() {
      return [
        'form-checkbox',
        `form-checkbox--${this.size}`,
        {
          'form-checkbox--error': this.error,
          'form-checkbox--disabled': this.disabled
        }
      ]
    }
  },
  methods: {
    handleChange(event) {
      this.$emit('update:modelValue', event.target.checked)
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

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
}

.checkbox-text {
  color: #333;
  font-weight: 500;
  user-select: none;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #e1e5e9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
}

.form-checkbox:checked {
  background: #667eea;
  border-color: #667eea;
}

.form-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.form-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-checkbox--error {
  border-color: #e74c3c;
}

.form-checkbox--error:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-checkbox--disabled {
  background-color: #f8f9fa;
  border-color: #d1d5db;
  cursor: not-allowed;
}

.form-checkbox--disabled:checked {
  background-color: #d1d5db;
  border-color: #d1d5db;
}

.form-checkbox--small {
  width: 16px;
  height: 16px;
}

.form-checkbox--small:checked::after {
  font-size: 10px;
}

.form-checkbox--large {
  width: 20px;
  height: 20px;
}

.form-checkbox--large:checked::after {
  font-size: 14px;
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
