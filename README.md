# 🚀 Turbo Chatwoot Webhook

Hệ thống webhook đa nền tảng kết nối Chatwoot với Telegram và Dify AI.

## ✨ Tính năng

- **1 Chatwoot Account** → **Nhiều Telegram Bots** + **Dify Apps**
- **Admin Panel** với phân quyền 4 cấp độ
- **Đa ngôn ngữ** (Tiếng Việt, English)
- **Auto CI/CD** với Docker

## 🚀 Cài đặt nhanh

```bash
# 1. Cài đặt dependencies
yarn install

# 2. Cấu hình database
cp .env.example .env
# Chỉnh sửa .env với thông tin database

# 3. Setup database
yarn setup

# 4. Khởi động
yarn dev

# 5. Truy cập: http://localhost:3000/admin
# Default: superadmin / password
```

## 🐳 Docker

```bash
# Build và chạy
yarn docker:prod

# Hoặc build image
yarn docker:build
```

## 🔧 Cấu hình

1. **Chatwoot Account** - URL, token, account ID
2. **Telegram Bots** - Token từ @BotFather  
3. **Dify Apps** - API key và app ID
4. **Mapping** - Kết nối services

## 📊 API Endpoints

- **Auth**: `/api/admin/auth/*`
- **Users**: `/api/admin/users`
- **Chatwoot**: `/api/admin/chatwoot-accounts`
- **Telegram**: `/api/admin/telegram-bots`
- **Dify**: `/api/admin/dify-apps`

## 🚀 CI/CD

- **Auto Build**: Push code → Tự động build Docker image
- **Registry**: GitHub Container Registry (ghcr.io)
- **Manual Deploy**: Pull image và deploy thủ công

## 📝 Scripts

- `yarn start` - Production server
- `yarn dev` - Development với nodemon
- `yarn lint` - ESLint
- `yarn docker:build` - Build Docker image
- `yarn docker:prod` - Chạy production với Docker
- `yarn setup` - Setup database

## 🔒 Bảo mật

- JWT authentication
- Role-based permissions
- Input validation
- SQL injection prevention

---

**Made with ❤️ by Turbo Team**