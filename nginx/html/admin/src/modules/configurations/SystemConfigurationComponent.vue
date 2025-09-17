<template>
  <div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12" :class="{'overlay-wrapper' : is_loading}">
          <div class="overlay" v-if="is_loading">
            <i class="fas fa-3x fa-spinner fa-spin"></i>
            <div class="text-bold pt-2">Loading...</div>
    </div>

          <div class="card">
            <div class="card-header d-flex align-items-center">
              <h3 class="card-title flex-grow-1">Cấu hình hệ thống</h3>
              <div class="btn-group" style="gap: 10px;">
                <button 
                  v-if="hasPermission('configurations', 'create')"
                  class="btn btn-success"
                  @click="handleAdd"
                >
                  <i class="fa fa-plus"></i> Thêm mới
                </button>
                <button 
                  v-if="hasPermission('configurations', 'update')"
                  class="btn btn-primary"
                  @click="handleSaveAll"
                  :disabled="isSaving"
                >
                  <i v-if="isSaving" class="fa fa-spinner fa-spin"></i>
                  <i v-else class="fa fa-save"></i> Lưu tất cả
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <!-- Table -->
              <div class="row col-12 overflow-auto">
                <table class="table table-bordered table-hover">
                  <thead class="table-header">
                  <tr>
                    <th style="width: 80px;"></th>
                    <th class="text-center text-nowrap">Key</th>
                    <th class="text-center text-nowrap">Value</th>
                    <th class="text-center text-nowrap">Type</th>
                    <th class="text-center text-nowrap">Mô tả</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(item, index) in items" :key="item.id || index">
                    <td class="text-center">
                      <button 
                        v-if="hasPermission('configurations', 'delete')"
                        class="btn btn-sm btn-danger"
                        @click="handleDelete(item, index)"
                        title="Xóa"
                      >
                        <i class="fa fa-trash-alt"></i>
                      </button>
                    </td>
                    <td class="align-middle">
                      <form-input-text-component
                        :model-value="item.key"
                        @update:model-value="updateItemField(index, 'key', $event)"
                        placeholder="Nhập key..."
                      />
                    </td>
                    <td class="align-middle">
                      <form-input-text-component
                        :model-value="item.value"
                        @update:model-value="updateItemField(index, 'value', $event)"
                        placeholder="Nhập value..."
                      />
                    </td>
                    <td class="align-middle">
                      <form-select-component
                        :model-value="item.type"
                        @update:model-value="updateItemField(index, 'type', $event)"
                        :options="typeOptions"
                      />
                    </td>
                    <td class="align-middle">
                      <form-input-text-component
                        :model-value="item.description"
                        @update:model-value="updateItemField(index, 'description', $event)"
                        placeholder="Nhập mô tả..."
                      />
                    </td>
                  </tr>
                  <tr v-if="items.length === 0">
                    <td colspan="5" class="text-center text-muted py-4">
                      <i class="fas fa-inbox fa-2x mb-2"></i>
                      <br>Không có dữ liệu
                    </td>
                  </tr>
                  </tbody>
                </table>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemConfigurationComponent',
  data() {
    return {
      is_loading: false,
      isSaving: false,
      items: [],
      userPermissions: {},
      typeOptions: [
        { value: 'string', label: 'String' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'json', label: 'JSON' }
      ]
    }
  },
  mounted() {
    this.loadUserData();
    this.loadData();
  },
  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          this.userPermissions = user?.permissions || {}
        } catch (error) {
          this.userPermissions = {}
        }
      }
    },
    
    loadData() {
      let _context = this;
      _context.is_loading = true;
      
      window.ConfigurationService.getSystemConfigurations()
        .then(function(response) {
          if (response.data.success) {
            _context.items = response.data.data || [];
          } else {
            _context.showError(response.data.message || 'Có lỗi xảy ra khi tải dữ liệu');
          }
        })
        .catch(function(error) {
          _context.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi tải dữ liệu');
        })
        .finally(function() {
          _context.is_loading = false;
        });
    },
    hasPermission(resource, action) {
      if (!this.userPermissions[resource]) return false
      return this.userPermissions[resource].some(p => p.action === action)
    },
    updateItemField(index, field, value) {
      if (this.items[index]) {
        // Sử dụng Vue 3 reactivity
        this.items[index][field] = value;
      }
    },
    handleAdd() {
      this.items.unshift({
        id: null,
        key: '',
        value: '',
        type: 'string',
        description: ''
      });
    },
    handleDelete(item, index) {
      this.showConfirmDialog(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa cấu hình "${item.key || 'này'}"?`,
        'Xóa',
        'Hủy'
      ).then(confirmed => {
        if (confirmed) {
          if (item.id) {
            // Xóa từ server nếu có id
            this.performDelete(item.id, index);
          } else {
            // Chỉ xóa khỏi danh sách nếu chưa lưu
            this.items.splice(index, 1);
          }
        }
      });
    },
    async performDelete(id, index) {
      try {
        this.is_loading = true;
        await window.ConfigurationService.deleteSystemConfiguration(id);
        this.showSuccess('Xóa cấu hình thành công');
        this.items.splice(index, 1);
      } catch (error) {
        this.showError((error.response && error.response.data && error.response.data.message) || error.message || 'Có lỗi xảy ra khi xóa cấu hình');
      } finally {
        this.is_loading = false;
      }
    },
    async handleSaveAll() {
      // Validate all items
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (!item.key || !item.value) {
          this.showError(`Vui lòng nhập đầy đủ key và value cho dòng ${i + 1}`);
          return;
        }
      }

      this.isSaving = true;
      let _context = this;
      let successCount = 0;
      let errorCount = 0;

      try {
        // Lưu từng item
        for (let i = 0; i < this.items.length; i++) {
          const item = this.items[i];
          try {
            const response = await window.ConfigurationService.updateSystemConfiguration(item);
            if (response.data.success) {
              successCount++;
              // Cập nhật item với data từ server
              _context.items[i] = response.data.data;
            } else {
              errorCount++;
              console.error(`Failed to save item ${i + 1}:`, response.data.message);
            }
          } catch (error) {
            errorCount++;
            console.error(`Error saving item ${i + 1}:`, error.message);
          }
        }

        if (errorCount === 0) {
          _context.showSuccess(`Lưu thành công ${successCount} cấu hình`);
        } else {
          _context.showError(`Lưu thành công ${successCount} cấu hình, lỗi ${errorCount} cấu hình`);
        }
      } catch (error) {
        _context.showError('Có lỗi xảy ra khi lưu cấu hình');
      } finally {
        _context.isSaving = false;
      }
    },
    showConfirmDialog(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
      return new Promise((resolve) => {
        // Tạo unique ID để tránh conflict
        const modalId = `confirm-${Date.now()}`;
        
        // Tạo modal HTML đơn giản
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
        
        // Thêm modal vào DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Lấy elements
        const modal = document.getElementById(modalId);
        const cancelBtn = document.getElementById(`cancel-${modalId}`);
        const confirmBtn = document.getElementById(`confirm-${modalId}`);
        
        // Cleanup function
        const cleanup = () => {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        };
        
        // Event handlers
        const handleCancel = () => {
          cleanup();
          resolve(false);
        };
        
        const handleConfirm = () => {
          cleanup();
          resolve(true);
        };
        
        const handleBackdrop = (e) => {
          if (e.target === modal) {
            cleanup();
            resolve(false);
          }
        };
        
        // Add event listeners
        cancelBtn.onclick = handleCancel;
        confirmBtn.onclick = handleConfirm;
        modal.onclick = handleBackdrop;
        
        // Handle escape key
        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            cleanup();
            resolve(false);
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);
      });
    },
    showSuccess(message) {
      if (window.toast) {
        window.toast.success(message);
      } else {
        this.showFallbackToast(message, 'success');
      }
    },
    showError(message) {
      if (window.toast) {
        window.toast.error(message);
      } else {
        this.showFallbackToast(message, 'error');
      }
    },
    showFallbackToast(message, type) {
      const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      };
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      // Tạo unique ID cho toast
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      `;
      
      toast.innerHTML = `
        <span style="margin-right: 8px;">${icons[type]}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      // Auto remove sau 5 giây
      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement && toastElement.parentNode) {
          toastElement.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => {
            if (toastElement.parentNode) {
              toastElement.parentNode.removeChild(toastElement);
            }
          }, 300);
        }
      }, 5000);
    }
  },
}
</script>

<style scoped>
.overlay-wrapper {
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.table-header {
  background-color: #f8f9fa;
}

.table-header th {
  border-top: none;
  font-weight: 600;
}
</style>
