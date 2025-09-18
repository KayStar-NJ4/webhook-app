<template>
  <div class="form-group position-relative" :class="{ 'mb-0' : is_table_edit, 'overlay-wrapper' : is_loading }">
    <div class="overlay" v-if="is_loading">
      <i class="fas fa-3x fa-spinner fa-spin" style="font-size: 28px"></i>
      <div class="text-bold pl-2">Loading...</div>
    </div>

    <div :class="{'d-flex': is_row}">
      <label :class="{'col-sm-2 col-form-label' : is_row }"
             v-if="!is_table_edit">{{ label }}
        <span class="text-danger"
              v-if="is_required">(*)</span>
      </label>
      <div class="input-group" :style="is_row ? { flex: '1' } : { flex: 'initial' }">
        <input type="text"
               :class="'form-control text-right ' + (is_error ? 'is-invalid' : '')"
               :id="id"
               :name="name"
               :placeholder="placeholder"
               :value="value_formatted"
               :disabled="is_disabled"
               @input="handleChangePrice"
               @keypress="restrictInput"
        />
        <div v-if="!!unit" class="input-group-append">
          <span class="input-group-text">{{ unit }}</span>
        </div>
      </div>
    </div>
    <span v-if="is_error" class="text-danger mt-2"><small>{{ error_message }}</small></span>
  </div>
</template>

<script>
export default {
  name: 'FormInputDecimalComponent',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
    },
    name: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    is_row: {
      type: Boolean,
      default: true
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
    is_loading: {
      type: Boolean,
      default: false
    },
    unit: {
      type: String,
      default: 'đ',
    },
    max: {
      type: [Number, String],
      default: null
    },
    min: {
      type: [Number, String],
      default: null
    },
    digits: {
      type: Number,
      default: 0,
    },
    is_format_decimal: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      value_formatted: this.formatPrice(this.value).formatted,
      old_value_formatted: '',
    };
  },
  mounted() {
    this.value_formatted = this.formatPrice(this.value).formatted;
    this.old_value_formatted = this.formatPrice(this.value).formatted;
  },
  methods: {
    formatPrice(price) {
      let result = {
        formatted: '0',
        original: '0'
      };

      if (!price) {
        return result;
      }

      let formattedPrice = price.toString().replace(/[^0-9.]/g, '');
      if ((this.min !== null && parseFloat(formattedPrice) < this.min) ||
          (this.max !== null && parseFloat(formattedPrice) > this.max)) {
        formattedPrice = this.old_value_formatted.toString();
      }

      let [integer, decimal] = formattedPrice.split('.');
      let formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      let formattedDecimal = (decimal || '').slice(0, this.digits);

      if (this.is_format_decimal) {
        formattedDecimal = formattedDecimal.padEnd(this.digits, '0');
      }

      result.formatted = !!formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : formattedInteger;
      result.original = formattedDecimal ? `${Number(integer)}.${formattedDecimal}` : Number(integer);

      return result;
    },
    handleChangePrice(event) {
      const cursorPosition = event.target.selectionStart;

      let format = this.formatPrice(event.target.value);
      this.value_formatted = format.formatted;
      this.$emit('update:value', format.original);

      this.$nextTick(() => {
        const oldP = (this.old_value_formatted.slice(0, cursorPosition).match(/,/g) || []).length;
        const newP = (format.formatted.slice(0, cursorPosition).match(/,/g) || []).length;
        const isCommaAfterCursor = this.old_value_formatted[cursorPosition - 1] === ',';
        const beforeCursor = this.old_value_formatted.slice(0, cursorPosition).replace(/[^0-9]/g, '');
        const isDivisibleBy3 = beforeCursor.length > 0 && beforeCursor.length % 3 === 0;

        if(format.formatted == 0) {
          event.target.selectionStart = 1;
          event.target.selectionEnd = 1;
        } else {
          let newPosition = cursorPosition;
          if (oldP + 1 === newP || (isCommaAfterCursor && isDivisibleBy3)) {
            newPosition += 1;
          } else if(oldP - 1 === newP) {
            newPosition -= 1;
          }
          event.target.selectionStart = newPosition;
          event.target.selectionEnd = newPosition;
        }
      });
    },
    restrictInput(event) {
      this.old_value_formatted = event.target.value;
      const char = String.fromCharCode(event.which);
      const cursorPosition = event.target.selectionStart;
      let updatedValue = this.old_value_formatted.slice(0, cursorPosition) + char + this.old_value_formatted.slice(cursorPosition);

      // Nếu ký tự nhập vào không phải số hoặc dấu chấm, ngăn không cho nhập
      if (!/[0-9.]/.test(char)) {
        event.preventDefault();
        return;
      }

      // Nếu ô nhập liệu đã có dấu chấm, ngăn không cho nhập thêm
      if (char === '.') {
        if (this.old_value_formatted.includes('.')) {
          event.preventDefault();
        }
        return;
      }

      // Giá trị mới nằm ngoài ngưỡng => chặn
      updatedValue = updatedValue.toString().replace(/[^0-9.]/g, '');
      if ((this.min !== null && Number(updatedValue) < this.min) || (this.max !== null && Number(updatedValue) > this.max)) {
        event.preventDefault();
        return;
      }

      // Kiểm tra số chữ số sau dấu chấm hiện tại
      const [integerPart, decimalPart] = this.old_value_formatted.split('.');
      // Nếu không có phần thập phân, cho phép nhập
      if (!decimalPart) {
        return;
      }

      const [updatedIntegerPart, updatedDecimalPart] = updatedValue.split('.');

      if (event.target.selectionStart === event.target.selectionEnd) {
        // Đủ digits số thì chặn
        if (updatedDecimalPart && updatedDecimalPart.length > this.digits) {
          event.preventDefault();
        }
      }
    },
  },
  watch: {
    value: function (new_value, old_value) {
      this.value_formatted = this.formatPrice(new_value).formatted;
    }
  }
}
</script>
