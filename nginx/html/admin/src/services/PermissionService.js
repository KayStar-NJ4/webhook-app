class PermissionService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/permissions'
  }

  // Lấy danh sách permissions
  getPermissions() {
    return this.get(this.endpoint)
  }

  // Lấy permissions grouped
  getPermissionsGrouped() {
    return this.get(`${this.endpoint}/grouped`)
  }

  // Lấy permissions để gán cho role/user (grouped by resource)
  getPermissionsForAssignment() {
    return this.get(`${this.endpoint}/for-assignment`)
  }

  // Lấy quyền của role
  getRolePermissions(roleId) {
    return this.get(`${this.endpoint}/roles/${roleId}`)
  }

  // Cập nhật quyền cho role
  updateRolePermissions(roleId, permissions) {
    return this.put(`${this.endpoint}/update-by-role/${roleId}`, { permissions })
  }

  // Cập nhật quyền cho user
  updateUserPermissions(userId, permissions) {
    return this.put(`/users/${userId}/permissions`, { permissions })
  }

}

// Export to global window object
if (!window.PermissionService) {
    window.PermissionService = new PermissionService();
}
