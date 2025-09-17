<template>
  <div class="action-buttons">
    <!-- Add Button -->
    <a v-if="permission?.create"
       class="btn btn-success btn-sm"
       href="javascript:void(0);"
       data-toggle="modal"
       data-target="#form-modal"
       @click="handleAdd">
      <i class="fa fa-plus"></i> {{ addText }}
    </a>
    
    <!-- Edit Button -->
    <a v-if="permission?.update && selectedItem"
       class="btn btn-primary btn-sm"
       href="javascript:void(0);"
       data-toggle="modal"
       data-target="#form-modal"
       @click="handleEdit">
      <i class="fa fa-pencil-alt"></i> {{ editText }}
    </a>
    
    <!-- Delete Button -->
    <a v-if="permission?.delete && selectedItem"
       class="btn btn-danger btn-sm"
       href="javascript:void(0);"
       @click="handleDelete">
      <i class="fa fa-trash"></i> {{ deleteText }}
    </a>
    
    <!-- View Button (when no edit permission) -->
    <a v-if="!permission?.update && selectedItem"
       class="btn btn-info btn-sm"
       href="javascript:void(0);"
       data-toggle="modal"
       data-target="#form-modal"
       @click="handleView">
      <i class="fa fa-eye"></i> {{ viewText }}
    </a>
  </div>
</template>

<script>
export default {
  name: 'ActionButtonsComponent',
  props: {
    permission: {
      type: Object,
      default: () => ({})
    },
    selectedItem: {
      type: Object,
      default: null
    },
    addText: {
      type: String,
      default: 'Thêm mới'
    },
    editText: {
      type: String,
      default: 'Sửa'
    },
    deleteText: {
      type: String,
      default: 'Xóa'
    },
    viewText: {
      type: String,
      default: 'Xem'
    }
  },
  emits: ['add', 'edit', 'delete', 'view'],
  methods: {
    handleAdd() {
      this.$emit('add');
    },
    handleEdit() {
      this.$emit('edit', this.selectedItem);
    },
    async handleDelete() {
      const confirmed = await window.ToastService.confirmAsync(
        'Bạn có chắc chắn muốn xóa?',
        'Xác nhận xóa'
      );
      
      if (confirmed) {
        this.$emit('delete', this.selectedItem);
      }
    },
    handleView() {
      this.$emit('view', this.selectedItem);
    }
  }
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  border-radius: 0.2rem;
}

.btn i {
  margin-right: 0.25rem;
}
</style>
