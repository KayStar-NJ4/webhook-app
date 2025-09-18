class RoleService extends BaseService {
  constructor() {
    super()
    this.endpoint = '/roles'
  }

  // Lấy danh sách roles với pagination và search
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Tạo role mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật role (id trong body)
  update(data) {
    return this.put(this.endpoint, data)
  }

  // Xóa role (id trong body)
  deleteRole(id) {
    return this.delete(this.endpoint, { id: id })
  }


  // Lấy danh sách users của role
  getRoleUsers(id, params = {}) {
    return this.get(`${this.endpoint}/${id}/users`, params)
  }

  // Gán role cho user
  assignRoleToUser(roleId, userId) {
    return this.post(`${this.endpoint}/${roleId}/users`, { user_id: userId })
  }

  // Hủy gán role cho user
  removeRoleFromUser(roleId, userId) {
    return this.delete(`${this.endpoint}/${roleId}/users/${userId}`)
  }



  // Helper method để tạo hoặc cập nhật role (compatible với code cũ)
  createOrUpdate(data) {
    if (data.id && data.id !== 0) {
      return this.update(data.id, data)
    } else {
      return this.create(data)
    }
  }
}

// Export to global window object
if (!window.RoleService) {
    window.RoleService = new RoleService();
}
