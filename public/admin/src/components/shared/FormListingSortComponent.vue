<template>
  <div>
    <div class="form-group d-inline-block mr-3">
      <label>Sắp xếp theo:</label>
      <select v-model="sortBy" class="form-control form-control-sm d-inline-block w-auto ml-2" @change="updateSortBy">
        <option v-for="sort in range_sorts" :key="sort.id" :value="sort.id">
          {{ sort.text }}
        </option>
      </select>
    </div>
    <div class="form-group d-inline-block">
      <label>Hiển thị:</label>
      <select v-model="limit" class="form-control form-control-sm d-inline-block w-auto ml-2" @change="updateLimit">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormListingSortComponent',
  props: {
    range_sorts: {
      type: Array,
      default: () => []
    },
    limit: {
      type: [String, Number],
      default: '10'
    },
    sort_by: {
      type: String,
      default: 'created_at.desc'
    }
  },
  data() {
    return {
      sortBy: this.sort_by,
      limitValue: this.limit
    }
  },
  watch: {
    sort_by(newVal) {
      this.sortBy = newVal;
    },
    limit(newVal) {
      this.limitValue = newVal;
    }
  },
  methods: {
    updateSortBy() {
      this.$emit('update:sort_by', this.sortBy);
    },
    updateLimit() {
      this.$emit('update:limit', this.limitValue);
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 0;
}
</style>
