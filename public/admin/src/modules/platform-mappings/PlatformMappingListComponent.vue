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
              <th style="width: 120px;"></th>
              <th>Platform nguồn</th>
              <th>Platform đích</th>
              <th>Trạng thái</th>
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
                    v-if="hasPermission('platform_mappings', 'read')"
                    class="btn btn-sm btn-info"
                    @click="testConnection(mapping)"
                    title="Kiểm tra kết nối"
                  >
                    <i class="fas fa-plug"></i>
                  </button>
                </div>
              </td>
              <td>
                <span class="badge badge-info">
                  {{ mapping.source_platform }}
                </span>
              </td>
              <td>
                <span class="badge badge-success">
                  {{ mapping.target_platform }}
                </span>
              </td>
              <td>
                <span :class="mapping.is_active ? 'badge badge-success' : 'badge badge-danger'">
                  {{ mapping.is_active ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
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
    async testConnection(mapping) {
      try {
        const response = await window.PlatformMappingService.testConnection(mapping.id)
        if (response.data.success) {
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Kết nối thành công')
          }
        } else {
          if (this.$toast && this.$toast.error) {
            this.$toast.error('Kết nối thất bại')
          }
        }
      } catch (error) {
        if (this.$toast && this.$toast.error) {
          this.$toast.error('Lỗi kết nối mạng')
        }
      }
    }
  }
}
</script>
