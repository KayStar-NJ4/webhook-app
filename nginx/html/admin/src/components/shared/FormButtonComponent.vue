<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <i v-if="loading" class="fas fa-spinner fa-spin"></i>
    <i v-else-if="icon" :class="icon"></i>
    <span v-if="text">{{ text }}</span>
    <slot v-else></slot>
  </button>
</template>

<script>
export default {
  name: 'FormButtonComponent',
  props: {
    type: {
      type: String,
      default: 'button'
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'outline', 'ghost'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  computed: {
    buttonClasses() {
      return [
        'btn',
        `btn--${this.variant}`,
        `btn--${this.size}`,
        {
          'btn--disabled': this.disabled || this.loading,
          'btn--loading': this.loading,
          'btn--full-width': this.fullWidth
        }
      ]
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event)
      }
    }
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Variants */
.btn--primary {
  background: #667eea;
  color: white;
}

.btn--primary:hover:not(.btn--disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn--secondary {
  background: #6c757d;
  color: white;
}

.btn--secondary:hover:not(.btn--disabled) {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn--success {
  background: #28a745;
  color: white;
}

.btn--success:hover:not(.btn--disabled) {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn--danger {
  background: #dc3545;
  color: white;
}

.btn--danger:hover:not(.btn--disabled) {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn--warning {
  background: #ffc107;
  color: #212529;
}

.btn--warning:hover:not(.btn--disabled) {
  background: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.btn--info {
  background: #17a2b8;
  color: white;
}

.btn--info:hover:not(.btn--disabled) {
  background: #138496;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.btn--outline {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn--outline:hover:not(.btn--disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn--ghost {
  background: transparent;
  color: #667eea;
}

.btn--ghost:hover:not(.btn--disabled) {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* Sizes */
.btn--small {
  padding: 6px 12px;
  font-size: 12px;
  min-height: 32px;
}

.btn--medium {
  padding: 10px 20px;
  font-size: 14px;
  min-height: 40px;
}

.btn--large {
  padding: 14px 28px;
  font-size: 16px;
  min-height: 48px;
}

/* States */
.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn--loading {
  cursor: wait;
}

.btn--full-width {
  width: 100%;
}

/* Loading animation */
.btn--loading .fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Ripple effect */
.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:active::before {
  width: 300px;
  height: 300px;
}
</style>
