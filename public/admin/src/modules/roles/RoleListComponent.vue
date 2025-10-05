<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Danh sách vai trò</h3>
      <div class="card-tools">
        <button 
          type="button" 
          class="btn btn-primary btn-sm" 
          @click="$emit('create')"
          v-if="hasPermission('roles', 'create')"
        >
          <i class="fas fa-plus"></i> Tạo mới
        </button>
      </div>
    </div>
    <div class="card-body">
      <div v-if="isLoading" class="text-center">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Đang tải...</p>
      </div>
      <div v-else-if="roles.length === 0" class="text-center">
        <i class="fas fa-users fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">Chưa có vai trò nào</h4>
        <p class="text-muted">Bạn chưa có vai trò nào. Hãy tạo vai trò đầu tiên.</p>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Quyền</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td>{{ role.name }}</td>
              <td>{{ role.description || '-' }}</td>
              <td>
                <span class="badge badge-info" v-for="permission in role.permissions" :key="permission.id">
                  {{ permission.resource }}:{{ permission.action }}
                </span>
              </td>
              <td>
                <span :class="role.is_active ? 'badge badge-success' : 'badge badge-danger'">
                  {{ role.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-primary"
                    @click="$emit('edit', role)"
                    v-if="hasPermission('roles', 'update')"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-info"
                    @click="$emit('permissions', role)"
                    v-if="hasPermission('roles', 'update')"
                  >
                    <i class="fas fa-key"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDelete(role)"
                    v-if="hasPermission('roles', 'delete')"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleListComponent',
  props: {
    roles: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    userPermissions: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false;
      return this.userPermissions[resource].some(p => p.action === action);
    },
    confirmDelete(role) {
      if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) {
        this.$emit('delete', role);
      }
    }
  }
}
</script>
