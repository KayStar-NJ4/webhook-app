<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Danh sách Platform Mappings</h3>
      <div class="card-tools">
        <button 
          type="button" 
          class="btn btn-primary btn-sm" 
          @click="$emit('create')"
          v-if="hasPermission('platform_mappings', 'create')"
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
      <div v-else-if="mappings.length === 0" class="text-center">
        <i class="fas fa-link fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">Chưa có platform mapping nào</h4>
        <p class="text-muted">Bạn chưa có platform mapping nào. Hãy tạo mapping đầu tiên.</p>
        <button 
          v-if="hasPermission('platform_mappings', 'create')"
          class="btn btn-success"
          @click="$emit('create')"
        >
          <i class="fa fa-plus mr-1"></i> Tạo mới
        </button>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-bordered table-hover">
          <thead class="table-header">
            <tr>
              <th style="width: 120px;">Thao tác</th>
              <th>Tên luồng</th>
              <th>Nguồn</th>
              <th>Đích</th>
              <th>Cấu hình</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mapping in mappings" :key="mapping.id">
              <td class="text-center">
                <div class="btn-group" role="group">
                  <button 
                    v-if="hasPermission('platform_mappings', 'update')"
                    class="btn btn-sm btn-warning"
                    @click="$emit('edit', mapping)"
                    data-toggle="modal"
                    data-target="#form-modal"
                    title="Sửa"
                  >
                    <i class="fa fa-pencil-alt"></i>
                  </button>
                  <button 
                    v-if="hasPermission('platform_mappings', 'delete')"
                    class="btn btn-sm btn-danger"
                    @click="showDeleteConfirm(mapping)"
                    title="Xóa"
                  >
                    <i class="fa fa-trash-alt"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-info"
                    @click="testConnection(mapping, $event)"
                    title="Test kết nối"
                  >
                    <i class="fa fa-plug"></i>
                  </button>
                </div>
              </td>
              <td>
                <strong>{{ mapping.name || 'Không có tên' }}</strong>
                <br>
                <small class="text-muted">ID: {{ mapping.id }}</small>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="badge badge-primary">
                    <i :class="getPlatformIcon(mapping.source_platform)"></i>
                    {{ getPlatformName(mapping.source_platform) }}
                  </span>
                </div>
                <div class="mt-1">
                  <small class="text-muted">
                    {{ getSourceName(mapping) }}
                  </small>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <span v-if="mapping.target_platform === 'chatwoot'" class="badge badge-success mb-1">
                    <i class="fas fa-comments"></i> Chatwoot
                  </span>
                  <span v-if="mapping.target_platform === 'dify'" class="badge badge-info">
                    <i class="fas fa-robot"></i> Dify
                  </span>
                  <span v-if="mapping.target_platform === 'telegram'" class="badge badge-primary">
                    <i class="fab fa-telegram-plane"></i> Telegram
                  </span>
                </div>
                <div class="mt-1">
                  <small class="text-muted">
                    {{ getTargetName(mapping) }}
                  </small>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <span v-if="mapping.enable_bidirectional" class="badge badge-warning mb-1">
                    <i class="fas fa-exchange-alt"></i> AI Reply
                  </span>
                  <span v-if="mapping.enable_sync" class="badge badge-info">
                    <i class="fas fa-sync"></i> Sync
                  </span>
                  <span v-if="!mapping.enable_bidirectional && !mapping.enable_sync" class="badge badge-secondary">
                    <i class="fas fa-arrow-right"></i> Forward Only
                  </span>
                </div>
              </td>
              <td>
                <span :class="mapping.is_active ? 'badge badge-success' : 'badge badge-danger'">
                  <i :class="mapping.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                  {{ mapping.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
              </td>
              <td>
                <small>{{ formatDate(mapping.created_at) }}</small>
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
  name: 'PlatformMappingListComponent',
  props: {
    mappings: {
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
    getPlatformIcon(platform) {
      const icons = {
        telegram: 'fab fa-telegram-plane',
        chatwoot: 'fas fa-comments',
        dify: 'fas fa-robot',
        zalo: 'fas fa-comment-dots',
        facebook: 'fab fa-facebook-messenger',
        whatsapp: 'fab fa-whatsapp'
      }
      return icons[platform] || 'fas fa-link'
    },
    getPlatformName(platform) {
      const names = {
        telegram: 'Telegram',
        chatwoot: 'Chatwoot',
        dify: 'Dify',
        zalo: 'Zalo',
        facebook: 'Facebook Messenger',
        whatsapp: 'WhatsApp'
      }
      return names[platform] || platform
    },
    getSourceName(mapping) {
      if (mapping.source_name) return mapping.source_name
      return `${mapping.source_platform} #${mapping.source_id}`
    },
    getTargetName(mapping) {
      if (mapping.target_name) return mapping.target_name
      return `${mapping.target_platform} #${mapping.target_id}`
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async testConnection(mapping, event) {
      try {
        // Show loading
        const testBtn = event.target.closest('button')
        if (!testBtn) {
          console.error('Test button not found')
          return
        }
        
        const originalIcon = testBtn.innerHTML
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
        testBtn.disabled = true

        // Call test API
        const response = await window.PlatformMappingService.testConnection(mapping.id)
        
        // Show result
        if (response.data.success) {
          this.showSuccessMessage('Kết nối thành công!')
        } else {
          this.showErrorMessage('Kết nối thất bại: ' + (response.data.error || 'Unknown error'))
        }
      } catch (error) {
        this.showErrorMessage('Lỗi khi test kết nối: ' + error.message)
      } finally {
        // Restore button
        const testBtn = event.target.closest('button')
        if (testBtn) {
          testBtn.innerHTML = '<i class="fa fa-plug"></i>'
          testBtn.disabled = false
        }
      }
    },
    showSuccessMessage(message) {
      this.showToast(message, 'success')
    },
    showErrorMessage(message) {
      this.showToast(message, 'error')
    },
    showToast(message, type = 'info') {
      const toast = document.createElement('div')
      toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`
      toast.setAttribute('role', 'alert')
      toast.setAttribute('aria-live', 'assertive')
      toast.setAttribute('aria-atomic', 'true')
      
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `
      
      // Add to toast container or create one
      let toastContainer = document.querySelector('.toast-container')
      if (!toastContainer) {
        toastContainer = document.createElement('div')
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3'
        toastContainer.style.zIndex = '9999'
        document.body.appendChild(toastContainer)
      }
      
      toastContainer.appendChild(toast)
      
      // Show toast
      const bsToast = new bootstrap.Toast(toast)
      bsToast.show()
      
      // Remove toast element after it's hidden
      toast.addEventListener('hidden.bs.toast', () => {
        toast.remove()
      })
    },
    showDeleteConfirm(mapping) {
      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa platform mapping "${mapping.name}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          this.$emit('delete', mapping);
        }
      });
    },
    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        const modalId = `confirm-${Date.now()}`;
        const modalHTML = `
          <div id="${modalId}" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background: white;
              border-radius: 8px;
              padding: 24px;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            ">
              <h4 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">${title}</h4>
              <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancel-${modalId}" style="
                  padding: 8px 16px;
                  border: 1px solid #ddd;
                  background: white;
                  color: #666;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">${cancelText}</button>
                <button id="confirm-${modalId}" style="
                  padding: 8px 16px;
                  border: none;
                  background: #dc3545;
                  color: white;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                ">${confirmText}</button>
              </div>
            </div>
          </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(modalId);
        const cancelBtn = document.getElementById(`cancel-${modalId}`);
        const confirmBtn = document.getElementById(`confirm-${modalId}`);

        const cleanup = () => {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        };

        const handleCancel = () => { cleanup(); resolve(false); };
        const handleConfirm = () => { cleanup(); resolve(true); };

        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        modal.addEventListener('click', (e) => { if (e.target === modal) handleCancel(); });
        const handleEsc = (e) => { if (e.key === 'Escape') { handleCancel(); document.removeEventListener('keydown', handleEsc); } };
        document.addEventListener('keydown', handleEsc);
      });
    },
  }
}
</script>
