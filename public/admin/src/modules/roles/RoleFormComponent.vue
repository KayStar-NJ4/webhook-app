<template>
  <div class="modal-dialog modal-xl" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="roleFormModalLabel">
          <i class="fas fa-user-shield"></i>
          {{ isEdit ? 'Chỉnh sửa vai trò và quyền' : 'Tạo vai trò mới' }}
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="resetForm">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- Basic Role Information - Horizontal Layout -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="form-group">
                <label for="roleName">Tên vai trò <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="roleName"
                  v-model="formData.name"
                  :class="{ 'is-invalid': errors.name }"
                  autocomplete="off"
                  required
                >
                <div v-if="errors.name" class="invalid-feedback">
                  {{ errors.name[0] }}
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="form-group">
                <label for="roleDescription">Mô tả</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="roleDescription"
                  v-model="formData.description"
                  :class="{ 'is-invalid': errors.description }"
                  autocomplete="off"
                  placeholder="Mô tả vai trò..."
                >
                <div v-if="errors.description" class="invalid-feedback">
                  {{ errors.description[0] }}
                </div>
              </div>
            </div>
            
          </div>

          <!-- Permissions Section - Full Width -->
          <div class="card">
            <div class="card-header">
              <h6 class="card-title mb-0">
                <i class="fas fa-shield-alt"></i> Quyền hạn
              </h6>
            </div>
            <div class="card-body">
              <div v-if="isLoading" class="text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                <p class="mt-2">Đang tải danh sách quyền...</p>
              </div>
              <div v-else>
                <!-- Permission Stats -->
                <div class="alert alert-info mb-3">
                  <i class="fas fa-info-circle"></i>
                  <strong>Tổng quan:</strong> 
                  Đã chọn <span class="badge badge-primary">{{ selectedPermissions.length }}</span> quyền 
                  trong tổng số <span class="badge badge-secondary">{{ availablePermissions.length }}</span> quyền có sẵn
                </div>

                <!-- Quick Actions -->
                <div class="mb-3">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-primary"
                    @click="selectAll"
                    v-if="availablePermissions.length > 0"
                  >
                    <i class="fas fa-check-double"></i> Chọn tất cả
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-secondary ml-1"
                    @click="clearAll"
                    v-if="selectedPermissions.length > 0"
                  >
                    <i class="fas fa-times"></i> Bỏ chọn tất cả
                  </button>
                </div>

                <!-- Permissions List by Module -->
                <div class="permissions-modules">
                  <div 
                    v-for="module in groupedPermissions" 
                    :key="module.name"
                    class="permission-module mb-3"
                  >
                    <div class="module-header">
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          :id="`module_${module.name}`"
                          :checked="isModuleSelected(module.name)"
                          @change="toggleModule(module.name, $event.target.checked)"
                        >
                        <label class="form-check-label module-title" :for="`module_${module.name}`">
                          <i :class="getModuleIcon(module.name)"></i>
                          {{ getModuleTitle(module.name) }}
                          <span class="badge badge-light ml-2">{{ module.permissions.length }}</span>
                        </label>
                      </div>
                    </div>
                    
                    <div class="permissions-tags" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; padding-left: 20px;">
                      <span 
                        v-for="permission in module.permissions" 
                        :key="permission.id"
                        class="permission-tag"
                        :class="{ 'selected': selectedPermissions.includes(permission.id) }"
                        @click="togglePermission(permission.id)"
                        :title="permission.description"
                        style="display: inline-flex; align-items: center; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; transition: all 0.2s; font-size: 12px; color: #666;"
                      >
                        <input 
                          type="checkbox" 
                          :id="`permission_${permission.id}`"
                          :value="permission.id"
                          v-model="selectedPermissions"
                          style="margin-right: 4px; margin-top: 0;"
                          @click.stop
                        >
                        <span style="font-weight: 600;">{{ permission.action }}</span>
                      </span>
                    </div>
                  </div>
                  
                  <!-- Empty State -->
                  <div v-if="availablePermissions.length === 0" class="text-center py-3">
                    <i class="fas fa-exclamation-triangle fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Không có quyền nào để chọn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Permissions Summary -->
          <div v-if="selectedPermissions.length > 0" class="row mt-3">
            <div class="col-12">
              <div class="card">
                <div class="card-header">
                  <h6 class="card-title mb-0">
                    <i class="fas fa-check-circle text-success"></i> 
                    Quyền đã chọn ({{ selectedPermissions.length }})
                  </h6>
                </div>
                <div class="card-body">
                  <div class="selected-permissions-summary">
                    <span 
                      v-for="permissionId in selectedPermissions" 
                      :key="permissionId"
                      class="badge badge-primary mr-2 mb-2"
                    >
                      <i class="fas fa-check"></i>
                      {{ getPermissionById(permissionId).resource }}:{{ getPermissionById(permissionId).action }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="resetForm">
            Hủy
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving || isLoading">
            <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
            {{ isSaving ? 'Đang lưu...' : (isEdit ? 'Cập nhật vai trò' : 'Tạo vai trò') }}
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
        description: ''
      },
      errors: {},
      isSaving: false,
      availablePermissions: [],
      selectedPermissions: [],
      isLoading: false
    }
  },
  computed: {
    isEdit() {
      return this.id && this.id !== 0
    },
    groupedPermissions() {
      const groups = {}
      
      this.availablePermissions.forEach(permission => {
        const module = permission.resource
        if (!groups[module]) {
          groups[module] = {
            name: module,
            permissions: []
          }
        }
        groups[module].permissions.push(permission)
      })
      
      // Convert to array and sort by module name
      return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
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
          // Load role permissions if editing
          if (this.isEdit) {
            this.loadRolePermissions()
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadAvailablePermissions()
  },
  methods: {
    async handleSubmit() {
      this.errors = {}
      this.isSaving = true

      try {
        // First, save the role
        const roleResponse = this.isEdit 
          ? await window.RoleService.update(this.id, this.formData)
          : await window.RoleService.create(this.formData)
        
        if (roleResponse.data.success) {
          const roleId = this.isEdit ? this.id : roleResponse.data.data.id
          
          // Then, update permissions
          if (window.RoleService.updateRolePermissions) {
            try {
              // Convert selected permission IDs back to permission strings
              const permissionStrings = this.selectedPermissions.map(id => {
                const permission = this.getPermissionById(id)
                return permission ? permission.permission : null
              }).filter(p => p !== null)
              
              await window.RoleService.updateRolePermissions(roleId, permissionStrings)
            } catch (permError) {
              console.warn('Error updating permissions:', permError)
              // Don't fail the whole operation if permissions fail
            }
          }
          
          this.$emit('success', roleResponse.data.data)
          this.resetForm()
        } else {
          this.errors = roleResponse.data.errors || {}
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else {
          console.error('Error saving role:', error)
          if (window.ToastService && window.ToastService.error) {
            window.ToastService.error('Lỗi khi lưu vai trò')
          }
        }
      } finally {
        this.isSaving = false
      }
    },
    async loadAvailablePermissions() {
      this.isLoading = true
      try {
        // Get all available permissions from PermissionService
        const response = await window.PermissionService.getList()
        
        if (response && response.data.success) {
          const permissions = response.data.data
          console.log('Raw permissions data:', permissions)
          
          // Convert to the format we need
          this.availablePermissions = permissions.map(permission => ({
            id: permission.id,
            resource: permission.resource,
            action: permission.action,
            permission: permission.name,
            description: permission.description
          }))
        } else {
          this.availablePermissions = []
        }
        
        console.log('Loaded available permissions from API:', this.availablePermissions.length)
      } catch (error) {
        console.error('Error loading permissions from API:', error)
        this.availablePermissions = []
      } finally {
        this.isLoading = false
      }
    },
    async loadRolePermissions() {
      if (!this.isEdit) return
      
      try {
        const response = await window.RoleService.getRolePermissions(this.id)
        if (response.data.success) {
          const permissions = response.data.data
          
          // Map permission IDs to selected permissions
          this.selectedPermissions = permissions.map(p => p.id)
        }
      } catch (error) {
        console.error('Error loading role permissions:', error)
        this.selectedPermissions = []
      }
    },
    getPermissionById(id) {
      if (!Array.isArray(this.availablePermissions)) return {}
      return this.availablePermissions.find(p => p.id === id) || {}
    },
    selectAll() {
      const allIds = this.availablePermissions.map(p => p.id)
      this.selectedPermissions = [...allIds]
    },
    clearAll() {
      this.selectedPermissions = []
    },
    togglePermission(permissionId) {
      const index = this.selectedPermissions.indexOf(permissionId)
      if (index > -1) {
        this.selectedPermissions.splice(index, 1)
      } else {
        this.selectedPermissions.push(permissionId)
      }
    },
    getModuleTitle(moduleName) {
      // Capitalize first letter and replace underscores with spaces
      return moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/_/g, ' ')
    },
    getModuleIcon(moduleName) {
      // Simple mapping for common modules, fallback to generic icon
      const iconMap = {
        'configurations': 'fas fa-cogs',
        'chatwoot': 'fas fa-comments',
        'dify': 'fas fa-robot',
        'mappings': 'fas fa-sitemap',
        'permissions': 'fas fa-key',
        'platform_mappings': 'fas fa-link',
        'roles': 'fas fa-user-shield',
        'system': 'fas fa-server',
        'telegram': 'fab fa-telegram',
        'users': 'fas fa-users'
      }
      return iconMap[moduleName] || 'fas fa-cube'
    },
    isModuleSelected(moduleName) {
      const module = this.groupedPermissions.find(m => m.name === moduleName)
      if (!module) return false
      return module.permissions.every(p => this.selectedPermissions.includes(p.id))
    },
    toggleModule(moduleName, checked) {
      const module = this.groupedPermissions.find(m => m.name === moduleName)
      if (!module) return
      
      if (checked) {
        // Select all permissions in module
        const modulePermissionIds = module.permissions.map(p => p.id)
        this.selectedPermissions = [...new Set([...this.selectedPermissions, ...modulePermissionIds])]
      } else {
        // Deselect all permissions in module
        const modulePermissionIds = module.permissions.map(p => p.id)
        this.selectedPermissions = this.selectedPermissions.filter(id => !modulePermissionIds.includes(id))
      }
    },
    resetForm() {
      this.formData = {
        name: '',
        description: '',
        is_active: true
      }
      this.errors = {}
      this.selectedPermissions = []
    }
  }
}
</script>

<style scoped>
.permissions-modules {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.permission-module {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.permission-module:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.module-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
}

.module-header .form-check {
  margin: 0;
}

.module-title {
  cursor: pointer;
  width: 100%;
  margin: 0;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  color: white !important;
}

.module-title i {
  margin-right: 8px;
  font-size: 16px;
}

.module-title .badge {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.module-permissions {
  padding: 10px;
  background: #fafbfc;
}

.permission-item {
  padding: 8px;
  margin-bottom: 6px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.permission-item:hover {
  border-color: #007bff;
  box-shadow: 0 1px 3px rgba(0, 123, 255, 0.1);
  transform: translateX(2px);
}

.permission-item:last-child {
  margin-bottom: 0;
}

.permission-item .form-check-label {
  cursor: pointer;
  width: 100%;
  margin: 0;
}

/* Horizontal layout for permissions */
.module-permissions-horizontal {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin-top: 8px !important;
  padding-left: 20px !important;
  align-items: flex-start !important;
}

.permission-item-horizontal {
  display: inline-flex !important;
  align-items: center !important;
  margin-bottom: 0 !important;
  margin-right: 0 !important;
  padding: 4px 8px !important;
  border: 1px solid #e9ecef !important;
  border-radius: 4px !important;
  background-color: #fff !important;
  transition: all 0.2s ease !important;
  min-width: auto !important;
  width: auto !important;
  flex-shrink: 0 !important;
}

.permission-item-horizontal:hover {
  border-color: #007bff !important;
  background-color: #f8f9ff !important;
}

.permission-item-horizontal .form-check-label {
  cursor: pointer !important;
  margin: 0 !important;
  padding-left: 5px !important;
  display: inline-flex !important;
  align-items: center !important;
}

.permission-item-horizontal .action-name {
  color: #007bff !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  white-space: nowrap !important;
  margin: 0 !important;
}

/* Override Bootstrap form-check styles for horizontal layout */
.module-permissions-horizontal .form-check {
  display: inline-flex !important;
  align-items: center !important;
  padding-left: 0 !important;
  margin-bottom: 0 !important;
}

.module-permissions-horizontal .form-check-input {
  margin-top: 0 !important;
  margin-right: 5px !important;
  flex-shrink: 0 !important;
}

/* Permission tags styling */
.permission-tag:hover {
  border-color: #007bff !important;
  background-color: #f8f9ff !important;
  color: #007bff !important;
}

.permission-tag.selected {
  border-color: #28a745 !important;
  background-color: #d4edda !important;
  color: #155724 !important;
}

.selected-permissions-summary {
  max-height: 120px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.selected-permissions-summary .badge {
  font-size: 11px;
  padding: 4px 8px;
}

.alert-info {
  border-left: 4px solid #17a2b8;
  font-size: 13px;
}

/* Custom scrollbar */
.permissions-modules::-webkit-scrollbar,
.selected-permissions-summary::-webkit-scrollbar {
  width: 6px;
}

.permissions-modules::-webkit-scrollbar-track,
.selected-permissions-summary::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.permissions-modules::-webkit-scrollbar-thumb,
.selected-permissions-summary::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.permissions-modules::-webkit-scrollbar-thumb:hover,
.selected-permissions-summary::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .permissions-modules {
    max-height: 350px;
  }
  
  .module-header {
    padding: 10px 12px;
  }
  
  .module-permissions {
    padding: 8px;
  }
  
  .permission-item {
    padding: 6px;
  }
}

/* Animation for module selection */
.permission-module.module-selected {
  border-color: #28a745;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.15);
}

.permission-module.module-selected .module-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}
</style>
