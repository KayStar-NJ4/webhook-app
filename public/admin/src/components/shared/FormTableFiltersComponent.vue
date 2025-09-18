<template>
  <div>
    <tr v-if="hasFilters">
      <td></td>
      <td v-for="(filter, index) in filter_columns" :key="index">
        <div v-if="filter.filter_param_code">
          <!-- Text filter -->
          <input v-if="filter.data_type === 'text'"
                 type="text"
                 class="form-control form-control-sm"
                 :placeholder="`Tìm kiếm ${filter.label || ''}`"
                 :value="params[filter.filter_param_code] || ''"
                 @input="updateFilter(filter.filter_param_code, $event.target.value)"
          />
          
          <!-- Select filter -->
          <select v-else-if="filter.data_type === 'select'"
                  class="form-control form-control-sm"
                  :value="params[filter.filter_param_code] || ''"
                  @change="updateFilter(filter.filter_param_code, $event.target.value)">
            <option value="">Tất cả</option>
            <option v-for="option in filter.list_options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </td>
    </tr>
  </div>
</template>

<script>
export default {
  name: 'FormTableFiltersComponent',
  props: {
    filter_columns: {
      type: Array,
      default: () => []
    },
    params: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    hasFilters() {
      return this.filter_columns.some(col => col.filter_param_code);
    }
  },
  methods: {
    updateFilter(paramCode, value) {
      this.$emit('update:value', {
        filter_param_code: paramCode,
        value: value
      });
    }
  }
}
</script>

<style scoped>
.form-control-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}
</style>
