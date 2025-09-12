# 🚀 Turbo Chatwoot Webhook - Admin Panel

Hệ thống quản lý webhook đa nền tảng với giao diện admin hiện đại, hỗ trợ đa ngôn ngữ và phân quyền chi tiết.

## ✨ Tính năng chính

- **1 Chatwoot Account** kết nối với **nhiều Telegram Bots** và **Dify Apps**
- **Hệ thống phân quyền** 4 cấp độ (Super Admin, Admin, Operator, Viewer)
- **Đa ngôn ngữ** (Tiếng Việt, English)
- **Component system** chuẩn với List/Form pattern
- **Responsive design** và UI/UX hiện đại

## 🚀 Cài đặt nhanh

```bash
# 1. Cài đặt dependencies
yarn install

# 2. Cấu hình database
cp .env.example .env
# Chỉnh sửa .env với thông tin database

# 3. Chạy migration
yarn migrate

# 4. Tạo super admin
yarn create-super-admin

# 5. Khởi động
yarn dev

# 6. Truy cập: http://localhost:3000/admin
# Default: superadmin / password
```

## 📁 Cấu trúc dự án

```
public/admin/src/
├── components/shared/     # Component dùng chung
├── layouts/              # AdminLayout, AuthLayout
├── modules/              # Modules nghiệp vụ (List/Form)
│   ├── users/
│   ├── chatwoot/
│   ├── telegram/
│   └── dify/
├── pages/                # Trang chính
└── i18n/locales/         # Đa ngôn ngữ
```

## 🔧 Cấu hình hệ thống

1. **Tạo Chatwoot Account** - Nhập URL, token, account ID
2. **Tạo Telegram Bots** - Nhập token từ @BotFather
3. **Tạo Dify Apps** - Nhập API key và app ID
4. **Cấu hình Mapping** - Kết nối các services với nhau

## 🎨 Component System

```vue
<!-- Sử dụng component -->
<FormInputTextComponent
  v-model="value"
  label="Tên"
  :required="true"
  :error="errors.name"
/>

<FormButtonComponent
  @click="handleClick"
  variant="primary"
  icon="fas fa-save"
  text="Lưu"
  :loading="isLoading"
/>
```

## 🌐 Đa ngôn ngữ

```vue
<template>
  <h1>{{ $t('dashboard.title') }}</h1>
  <p>{{ $t('common.loading') }}</p>
</template>
```

## 🔒 Bảo mật

- JWT authentication
- Role-based permissions
- Input validation
- SQL injection prevention
- XSS protection

## 📊 API Endpoints

- **Auth**: `/api/admin/auth/*`
- **Users**: `/api/admin/users`
- **Chatwoot**: `/api/admin/chatwoot-accounts`
- **Telegram**: `/api/admin/telegram-bots`
- **Dify**: `/api/admin/dify-apps`
- **Config**: `/api/admin/configurations/*`

## 🚀 Deployment

```bash
# Docker
docker build -t turbo-chatwoot-webhook .
docker run -p 3000:3000 turbo-chatwoot-webhook

# Environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
```

## 🎯 Development

### Thêm module mới:
1. Tạo `modules/[module]/[Module]ListComponent.vue`
2. Tạo `modules/[module]/[Module]FormComponent.vue`
3. Tạo `pages/[Module]Page.vue`
4. Thêm route và translations

### Thêm component mới:
1. Tạo trong `components/shared/`
2. Export trong `components/index.js`
3. Sử dụng trong modules

## 📝 Changelog

### v1.0.0 - 2024-01-11
- ✅ Gộp migration thành file init duy nhất
- ✅ Tạo component system chuẩn
- ✅ Refactor modules với List/Form pattern
- ✅ Thêm hệ thống đa ngôn ngữ
- ✅ Tạo layouts AdminLayout và AuthLayout
- ✅ Hoàn thiện phân quyền và bảo mật

---

**Made with ❤️ by Turbo Team**

Development (Local)
Bước 1: Cài đặt ngrok để expose local server

# Cài đặt ngrok
yarn global add ngrok
# hoặc download từ https://ngrok.com/

# Chạy ngrok (trong terminal khác)
ngrok http 3000