<template>
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="roleFormModalLabel">
          {{ isEdit ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới' }}
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="form-group">
            <label for="roleName">Tên vai trò <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              id="roleName"
              v-model="formData.name"
              :class="{ 'is-invalid': errors.name }"
              required
            >
            <div v-if="errors.name" class="invalid-feedback">
              {{ errors.name[0] }}
            </div>
          </div>

          <div class="form-group">
            <label for="roleDescription">Mô tả</label>
            <textarea 
              class="form-control" 
              id="roleDescription"
              v-model="formData.description"
              :class="{ 'is-invalid': errors.description }"
              rows="3"
            ></textarea>
            <div v-if="errors.description" class="invalid-feedback">
              {{ errors.description[0] }}
            </div>
          </div>

          <div class="form-group">
            <label>Trạng thái</label>
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="roleActive"
                v-model="formData.is_active"
              >
              <label class="form-check-label" for="roleActive">
                Hoạt động
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Hủy
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
            {{ isSaving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleFormComponent',
  props: {
    id: {
      type: [Number, String],
      default: 0
    },
    object_info: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      formData: {
        name: '',
        description: '',
        is_active: true
      },
      errors: {},
      isSaving: false
    }
  },
  computed: {
    isEdit() {
      return this.id && this.id !== 0
    }
  },
  watch: {
    object_info: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.formData = {
            name: newVal.name || '',
            description: newVal.description || '',
            is_active: newVal.is_active !== undefined ? newVal.is_active : true
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    async handleSubmit() {
      this.errors = {}
      this.isSaving = true

      try {
        const response = this.isEdit 
          ? await window.RoleService.update(this.id, this.formData)
          : await window.RoleService.create(this.formData)
        
        if (response.data.success) {
          this.$emit('success', response.data.data)
        } else {
          this.errors = response.data.errors || {}
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          console.error('Error saving role:', error)
        }
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>
