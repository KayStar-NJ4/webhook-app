<template>
  <div class="form-group" :class="{ 'row' : is_row , 'mb-0' : is_table_edit }">
    <label :class="{'col-sm-2 col-form-label' : is_row }"
           v-if="!is_table_edit && label">{{ label }}
      <span class="text-danger" v-if="required">(*)</span>
    </label>
    <div :class="{'col-sm-10' : is_row }">
      <textarea
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        :class="'form-control form-control-lg ' + input_class + ' ' + (error ? 'is-invalid' : '')"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        v-bind="$attrs"
      ></textarea>
      <span v-if="error" class="text-danger mt-2"><small>{{ error }}</small></span>
      <span v-if="helpText" class="form-text text-muted"><small>{{ helpText }}</small></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormInputTextAreaComponent',
  props: {
    modelValue: {
      type: [String, Number],
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
    rows: {
      type: Number,
      default: 3
    }
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  computed: {
    id() {
      return `textarea-${Math.random().toString(36).substr(2, 9)}`
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
/* Bootstrap form-control-lg styling for consistency */
.form-control-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 80px;
}

.form-control-lg:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control-lg.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
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
</style>
