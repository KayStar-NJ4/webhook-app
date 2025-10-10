const _BaseServiceCustomer = (typeof window !== 'undefined' && window.BaseService)
  ? window.BaseService
  : null;

if (!_BaseServiceCustomer && !window.BaseService) {
  window.BaseService = function () {};
}

class CustomerService extends (window.BaseService || _BaseServiceCustomer) {
  constructor() {
    super()
    this.endpoint = '/customers'
  }

  // Lấy danh sách customers với pagination, search và filters
  getList(params = {}) {
    return this.get(this.endpoint, params)
  }

  // Lấy chi tiết customer
  getDetail(id, params = {}) {
    return this.get(`${this.endpoint}/${id}`, params)
  }

  // Tạo customer mới
  create(data) {
    return this.post(this.endpoint, data)
  }

  // Cập nhật customer
  update(id, data) {
    return this.put(`${this.endpoint}/${id}`, data)
  }

  // Xóa customer (soft delete)
  delete(id) {
    return super.delete(`${this.endpoint}/${id}`)
  }

  // Khôi phục customer đã xóa
  restore(id) {
    return this.post(`${this.endpoint}/${id}/restore`, {})
  }

  // Gán customer cho user
  assign(id, userId) {
    return this.post(`${this.endpoint}/${id}/assign`, { user_id: userId })
  }

  // Cập nhật trạng thái customer
  updateStatus(id, status) {
    return this.patch(`${this.endpoint}/${id}/status`, { status })
  }

  // Lấy thống kê
  getStatistics() {
    return this.get(`${this.endpoint}/statistics`)
  }

  // Batch update
  batchUpdate(ids, data) {
    return this.post(`${this.endpoint}/batch/update`, { ids, update_data: data })
  }

  // Batch delete
  batchDelete(ids) {
    return this.post(`${this.endpoint}/batch/delete`, { ids })
  }
}

// Create instance and export to window
window.CustomerService = new CustomerService();

