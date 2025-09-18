# Admin Panel - Cấu trúc thư mục

## Cấu trúc thư mục

```
public/admin/
├── index.html                 # File HTML chính
├── js/
│   └── admin.js              # File JavaScript chính
├── src/
│   ├── components/           # Components Vue.js
│   │   ├── shared/          # Components dùng chung
│   │   │   ├── FormInputTextComponent.vue
│   │   │   ├── FormCheckBoxComponent.vue
│   │   │   ├── FormSelectComponent.vue
│   │   │   └── FormModalComponent.vue
│   │   ├── users/           # Components cho module Users
│   │   │   ├── UserListComponent.vue
│   │   │   └── UserFormComponent.vue
│   │   ├── telegram/        # Components cho module Telegram
│   │   ├── chatwoot/        # Components cho module Chatwoot
│   │   └── dify/            # Components cho module Dify
│   ├── pages/               # Các trang chính
│   │   ├── UsersPage.vue
│   │   ├── TelegramPage.vue
│   │   ├── ChatwootPage.vue
│   │   └── DifyPage.vue
│   └── utils/               # Utilities và helpers
│       ├── api.js           # API calls
│       ├── auth.js          # Authentication helpers
│       └── helpers.js       # Common helpers
```

## Quy tắc đặt tên

### Components
- **Shared components**: `FormInputTextComponent.vue`, `FormModalComponent.vue`
- **Module components**: `UserListComponent.vue`, `UserFormComponent.vue`
- **Page components**: `UsersPage.vue`, `TelegramPage.vue`

### Naming Convention
- **PascalCase** cho tên component: `UserFormComponent`
- **kebab-case** cho tên file: `user-form-component.vue`
- **camelCase** cho methods và data: `loadUsers()`, `formData`

## Cách sử dụng

### 1. Tạo component mới
```vue
<template>
  <!-- Template content -->
</template>

<script>
export default {
  name: 'ComponentName',
  props: {
    // Props definition
  },
  data() {
    return {
      // Data definition
    }
  },
  methods: {
    // Methods definition
  }
}
</script>

<style scoped>
/* Component styles */
</style>
```

### 2. Import và sử dụng component
```javascript
import ComponentName from '../components/path/ComponentName.vue'

export default {
  components: {
    ComponentName
  }
}
```

### 3. Cấu trúc page
```vue
<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12">
        <!-- List Component -->
        <ListComponent
          :items="items"
          @create="openCreateModal"
          @edit="openEditModal"
        />
        
        <!-- Form Component -->
        <FormComponent
          :isVisible="showModal"
          :item="selectedItem"
          :isEdit="isEdit"
          @close="closeModal"
          @save="handleSave"
        />
      </div>
    </div>
  </div>
</template>
```

## Best Practices

1. **Component Structure**: Mỗi component nên có cấu trúc rõ ràng với template, script, style
2. **Props Validation**: Luôn validate props với type và required
3. **Event Handling**: Sử dụng emit để giao tiếp giữa parent và child components
4. **Error Handling**: Luôn có error handling trong API calls
5. **Loading States**: Hiển thị loading state khi cần thiết
6. **Responsive Design**: Sử dụng Bootstrap classes cho responsive
7. **Code Reusability**: Tạo shared components cho các element dùng chung

## API Integration

### Base API calls
```javascript
// GET request
const response = await axios.get('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
})

// POST request
const response = await axios.post('/api/endpoint', data, {
  headers: { Authorization: `Bearer ${token}` }
})

// PUT request
const response = await axios.put(`/api/endpoint/${id}`, data, {
  headers: { Authorization: `Bearer ${token}` }
})

// DELETE request
const response = await axios.delete(`/api/endpoint/${id}`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Error Handling
```javascript
try {
  const response = await axios.get('/api/endpoint')
  // Handle success
} catch (error) {
  if (error.response?.data?.errors) {
    this.errors = error.response.data.errors
  } else {
    alert(error.response?.data?.message || 'An error occurred')
  }
}
```
