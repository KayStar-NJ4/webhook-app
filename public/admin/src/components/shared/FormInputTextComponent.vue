<template>
  <div class="form-group">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="input-group">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <div v-if="$slots.append" class="input-group-append">
        <slot name="append"></slot>
      </div>
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
  name: 'FormInputTextComponent',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
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
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `input-${Math.random().toString(36).substr(2, 9)}`
    },
    inputClasses() {
      return [
        'form-input',
        `form-input--${this.size}`,
        {
          'form-input--error': this.error,
          'form-input--disabled': this.disabled
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

.input-group {
  display: flex;
  width: 100%;
}

.form-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: white;
}

/* When input-group-append exists, adjust border radius */
.input-group-append {
  display: flex;
}

.input-group-append .btn {
  border-radius: 0 6px 6px 0;
  border-left: 0;
  border: 2px solid #e1e5e9;
  border-left: 0;
  background: white;
  color: #495057;
  padding: 12px 15px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-group-append .btn:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

/* Default: input without append has normal border radius */
.form-input {
  border-radius: 6px;
}

/* When input-group-append exists, adjust border radius */
.input-group:has(.input-group-append) .form-input {
  border-radius: 6px 0 0 6px;
}

/* Fallback for browsers that don't support :has() */
@supports not selector(:has(*)) {
  .input-group .form-input {
    border-radius: 6px 0 0 6px;
  }
}


.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:focus + .input-group-append .btn {
  border-color: #667eea;
}

.form-input--error {
  border-color: #e74c3c;
}

.form-input--error:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-input--error + .input-group-append .btn {
  border-color: #e74c3c;
}

.form-input--disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-input--disabled + .input-group-append .btn {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-input--small {
  padding: 8px 12px;
  font-size: 12px;
}

.form-input--small + .input-group-append .btn {
  padding: 8px 12px;
  font-size: 12px;
}

.form-input--large {
  padding: 16px 20px;
  font-size: 16px;
}

.form-input--large + .input-group-append .btn {
  padding: 16px 20px;
  font-size: 16px;
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
