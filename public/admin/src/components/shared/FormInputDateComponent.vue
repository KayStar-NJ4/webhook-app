<template>
  <div class="form-group" :class="{ 'row' : is_row , 'mb-0' : is_table_edit }">
    <label :class="{'col-sm-2 col-form-label' : is_row }"
           v-if="!is_table_edit">{{ label }}
      <span class="text-danger" v-if="is_required">(*)</span>
    </label>
    <div :class="{'col-sm-10' : is_row }">
      <input
          type="date"
          :class="'form-control form-control-lg ' + input_class + ' ' + (is_error ? 'is-invalid' : '')"
          :id="id"
          :name="name"
          :disabled="is_disabled"
          :placeholder="placeholder"
          v-model="value_formatted"
          v-bind="$attrs"
      />
      <span v-if="is_error" class="text-danger mt-2"><small>{{ error_message }}</small></span>
    </div>
  </div>
</template>
<style>
.dk-date button.dp__btn.dp__button {
  display: none;
}
</style>
<script>
export default {
  name: 'FormInputDateComponent',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    input_class: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
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
    is_required: {
      type: Boolean,
      default: false
    },
    is_disabled: {
      type: Boolean,
      default: false
    },
    is_table_edit: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      value_formatted: ''
    }
  },
  mounted() {
    this.value_formatted = this.value;
  },
  watch: {
    value_formatted: function (newVal, oldVal) {
      this.$emit('update:modelValue', newVal);
    },
    value: function (newVal, oldVal) {
      this.value_formatted = newVal;
    }
  }
}
</script>
