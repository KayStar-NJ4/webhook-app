<template>
  <div class="form-check" :class="customClass">
    <input 
      class="form-check-input" 
      type="checkbox" 
      :id="id"
      :name="name"
      :checked="checked"
      :disabled="is_disabled"
      @change="$emit('change', $event.target.checked)"
    />
    <label v-if="label" class="form-check-label" :for="id">
      {{ label }}
    </label>
  </div>
</template>

<script>
export default {
  name: 'FormCheckBoxComponent',
  props: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    checked: {
      type: Boolean,
      default: false
    },
    is_disabled: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    customClass: {
      type: String,
      default: 'm-0'
    }
  },
  emits: ['change']
}
</script>

<style scoped>
.form-check {
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-top: 0;
}

.form-check-label {
  margin-left: 0.5rem;
  margin-bottom: 0;
}
</style>