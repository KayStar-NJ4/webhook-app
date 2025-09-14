<template>
  <div class="form-group" :class="{'m-0': is_table_edit}">
    <div class="custom-control custom-checkbox">
      <input type="checkbox"
             class="custom-control-input"
             :disabled="is_disabled"
             :id="id"
             :name="name"
             :checked="is_checked"
             @change="onChange($event)"
      >
      <label class="custom-control-label font-weight-bold" :for="id">
        {{ label }}
      </label>
    </div>
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
    label: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: true
    },
    checked: {
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
    is_disabled: {
      type: Boolean,
      default: false
    },
    is_table_edit: {
      type: Boolean,
      default: false,
    },
    handle_value: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      is_checked: false
    }
  },
  mounted() {
    this.is_checked = this.checked;
  },
  methods: {
    onChange(event) {
      if (this.handle_value) {
        event.target.checked = this.is_checked;
      }
      this.$emit('update:value', event.target.checked);
    },
  },
  watch: {
    checked: function (newVal, oldVal) {
      this.is_checked = newVal
    }
  }
}
</script>

<style scoped>
/* iCheck Success Styling - Simple and Clean */
.icheck-success {
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0;
}

.icheck-success input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
}

.icheck-success label {
  position: relative;
  display: inline-block;
  padding-left: 50px;
  margin: 0;
  font-weight: 700;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  line-height: 1.5;
  transition: all 0.3s ease;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.icheck-success label:before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: 3px solid #ddd;
  border-radius: 6px;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.icheck-success label:after {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 8px;
  height: 14px;
  border: solid #fff;
  border-width: 0 3px 3px 0;
  opacity: 0;
  transition: all 0.3s ease;
}

.icheck-success input[type="checkbox"]:checked + label:before {
  background: #28a745;
  border-color: #28a745;
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}

.icheck-success input[type="checkbox"]:checked + label:after {
  opacity: 1;
  transform: translateY(-50%) rotate(45deg);
}

.icheck-success input[type="checkbox"]:focus + label:before {
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
  border-color: #28a745;
}

.icheck-success input[type="checkbox"]:disabled + label {
  opacity: 0.6;
  cursor: not-allowed;
}

.icheck-success input[type="checkbox"]:disabled + label:before {
  background: #f8f9fa;
  border-color: #e9ecef;
  box-shadow: none;
}

/* Hover effects */
.icheck-success label:hover:not(:disabled) {
  color: #28a745;
}

.icheck-success label:hover:not(:disabled):before {
  border-color: #28a745;
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.2);
}

/* Form group styling */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group.m-0 {
  margin-bottom: 0;
}

/* Inline display */
.d-inline {
  display: inline-block;
}
</style>