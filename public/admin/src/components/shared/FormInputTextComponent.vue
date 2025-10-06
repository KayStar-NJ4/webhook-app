<template>
  <div class="form-group" :class="{ 'row' : is_row , 'mb-0' : is_table_edit }">
    <label :class="{'col-sm-2 col-form-label' : is_row }"
           v-if="!is_table_edit && label">{{ label }}
      <span class="text-danger" v-if="required">(*)</span>
    </label>
    <div :class="{'col-sm-10' : is_row }">
      <div class="input-group">
        <input
          :id="id"
          :type="showPassword ? 'text' : type"
          :value="modelValue"
          :placeholder="placeholder"
          :required="required"
          :disabled="disabled"
          :class="'form-control form-control-lg ' + input_class + ' ' + (error ? 'is-invalid' : '')"
          :autocomplete="autoComplete"
          :autofocus="autoFocus"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
          v-bind="$attrs"
        />
        <div v-if="showPasswordToggle || $slots.append" class="input-group-append">
          <button 
            v-if="showPasswordToggle && (type === 'password' || type === 'text')"
            class="btn btn-outline-secondary" 
            type="button"
            @click="togglePassword"
          >
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
          <slot name="append"></slot>
        </div>
      </div>
      <span v-if="error" class="text-danger mt-2"><small>{{ error }}</small></span>
      <span v-if="helpText" class="form-text text-muted"><small>{{ helpText }}</small></span>
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
    input_class: {
      type: String,
      default: ''
    },
    is_row: {
      type: Boolean,
      default: false
    },
    is_table_edit: {
      type: Boolean,
      default: false
    },
    showPasswordToggle: {
      type: Boolean,
      default: false
    },
    autoFocus: {
      type: Boolean,
      default: false
    },
    autoComplete: {
      type: String,
      default: 'off'
    },
    isToken: {
      type: Boolean,
      default: false
    },
    isSearch: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `input-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  data() {
    return {
      showPassword: false
    }
  },
  mounted() {
    // Prevent auto-focus and autofill on page load
    this.$nextTick(() => {
      const input = this.$el.querySelector('input')
      if (input) {
        // Always prevent auto-focus unless explicitly allowed
        if (!this.autoFocus || this.isSearch) {
          // Multiple layers of prevention
          input.blur()
          input.setAttribute('tabindex', '-1')
          
          // Use multiple timeouts to ensure blur
          setTimeout(() => {
            input.blur()
            input.setAttribute('tabindex', '0')
          }, 50)
          
          setTimeout(() => {
            input.blur()
          }, 100)
          
          setTimeout(() => {
            input.blur()
          }, 200)
        }
        
        // Prevent autofill
        input.setAttribute('autocomplete', this.autoComplete)
        input.setAttribute('data-form-type', 'other')
        input.setAttribute('data-lpignore', 'true')
        
        // Special handling for search inputs
        if (this.isSearch) {
          input.setAttribute('autocomplete', 'off')
          input.setAttribute('data-lpignore', 'true')
          input.setAttribute('data-1p-ignore', 'true')
          input.setAttribute('data-bwignore', 'true')
          input.setAttribute('data-form-type', 'search')
          input.setAttribute('data-password-manager', 'disabled')
          input.setAttribute('role', 'searchbox')
          input.setAttribute('aria-label', 'Search input')
          
          // Clear any autofilled values
          setTimeout(() => {
            if (input.value && !this.modelValue) {
              input.value = ''
              this.$emit('update:modelValue', '')
            }
          }, 100)
          
          // Listen for autofill events
          input.addEventListener('input', () => {
            if (input.value && !this.modelValue) {
              // Clear if autofilled
              input.value = ''
              this.$emit('update:modelValue', '')
            }
          })
        }
        
        // Additional attributes to prevent autofill
        if (this.type === 'password') {
          if (this.isToken) {
            // For tokens/keys, prevent password save prompts
            input.setAttribute('autocomplete', 'off')
            input.setAttribute('data-lpignore', 'true')
            input.setAttribute('data-1p-ignore', 'true')
            input.setAttribute('data-bwignore', 'true')
            input.setAttribute('data-form-type', 'other')
            input.setAttribute('data-password-manager', 'disabled')
            // Change type to text but keep password styling
            input.setAttribute('data-original-type', 'password')
          } else {
            // For real passwords
            input.setAttribute('autocomplete', 'new-password')
            input.setAttribute('data-lpignore', 'true')
            input.setAttribute('data-form-type', 'other')
          }
        }
      }
    })
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
    },
    togglePassword() {
      this.showPassword = !this.showPassword
    }
  }
}
</script>

<style scoped>
/* Bootstrap form-control-lg styling for consistency */
.form-control-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.form-control-lg:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control-lg.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Input group styling */
.input-group-append .btn {
  border-radius: 0 0.5rem 0.5rem 0;
  border-left: 0;
  border: 2px solid #e9ecef;
  border-left: 0;
  background: white;
  color: #495057;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  height: calc(1.5em + 1.5rem + 4px);
}

.input-group-append .btn:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

/* When input-group-append exists, adjust border radius */
.input-group:has(.input-group-append) .form-control-lg {
  border-radius: 0.5rem 0 0 0.5rem;
}

/* Fallback for browsers that don't support :has() */
@supports not selector(:has(*)) {
  .input-group .form-control-lg {
    border-radius: 0.5rem 0 0 0.5rem;
  }
}

.form-control-lg:focus + .input-group-append .btn {
  border-color: #007bff;
}

.form-control-lg.is-invalid + .input-group-append .btn {
  border-color: #dc3545;
}

/* Form text styling */
.form-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.text-danger {
  color: #dc3545 !important;
}

.text-muted {
  color: #6c757d !important;
}

/* Prevent auto-focus on page load */
.form-control:focus {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Prevent browser auto-focus */
input:not([autofocus]):focus {
  outline: none;
}

/* Token input styling - hide text like password but don't trigger password save */
input[data-original-type="password"] {
  -webkit-text-security: disc;
  text-security: disc;
}

/* Prevent password manager detection for tokens */
input[data-password-manager="disabled"] {
  -webkit-text-security: disc;
  text-security: disc;
}

/* Prevent auto-focus on page load */
.form-control:focus {
  outline: none !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
}

/* Additional prevention for auto-focus */
input[autocomplete="off"]:focus {
  outline: none !important;
}

/* Prevent autofill for search inputs */
input[data-form-type="search"] {
  background-color: white !important;
  background-image: none !important;
}

input[data-form-type="search"]:-webkit-autofill,
input[data-form-type="search"]:-webkit-autofill:hover,
input[data-form-type="search"]:-webkit-autofill:focus,
input[data-form-type="search"]:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: #495057 !important;
  background-color: white !important;
  background-image: none !important;
}
</style>
