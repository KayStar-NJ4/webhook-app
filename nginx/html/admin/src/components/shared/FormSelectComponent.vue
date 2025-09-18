<template>
  <div class="form-group" :class="{ 'row' : is_row , 'mb-0' : is_table_edit }">
    <label :class="{'col-sm-2 col-form-label' : is_row }"
           v-if="!is_table_edit && label">{{ label }}
      <span class="text-danger" v-if="required">(*)</span>
    </label>
    <div :class="{'col-sm-10' : is_row }">
      <div class="select-wrapper">
      <select
        :id="id"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :class="'form-control form-control-lg ' + input_class + ' ' + (error ? 'is-invalid' : '')"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
        v-bind="$attrs"
      >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="getOptionValue(option)"
        :value="getOptionValue(option)"
      >
        {{ getOptionLabel(option) }}
      </option>
      </select>
      </div>
      <span v-if="error" class="text-danger mt-2"><small>{{ error }}</small></span>
      <span v-if="helpText" class="form-text text-muted"><small>{{ helpText }}</small></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormSelectComponent',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
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
    valueKey: {
      type: String,
      default: 'value'
    },
    labelKey: {
      type: String,
      default: 'label'
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `select-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  methods: {
    getOptionValue(option) {
      if (typeof option === 'object') {
        return option[this.valueKey]
      }
      return option
    },
    getOptionLabel(option) {
      if (typeof option === 'object') {
        return option[this.labelKey]
      }
      return option
    },
    handleChange(event) {
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
/* Bootstrap form-control-lg styling for consistency */
.form-control-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: white;
  cursor: pointer;
  height: calc(1.5em + 1.5rem + 4px);
}

.form-control-lg:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control-lg.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.select-wrapper {
  position: relative;
  display: flex;
  width: 100%;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.form-control-lg:focus + .select-arrow {
  color: #007bff;
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

/* Hover effects */
.form-control-lg:hover:not(:disabled) {
  border-color: #007bff;
}

/* Animation for error state */
.form-control-lg.is-invalid {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>
