# Turbo Chatwoot Webhook

Hệ thống webhook trung gian kết nối Telegram với Chatwoot và Dify AI.

## 🚀 Tính năng

- Kết nối Telegram ↔ Chatwoot ↔ Dify AI
- Lưu trữ lịch sử tin nhắn đầy đủ
- Xử lý tin nhắn hai chiều (User ↔ Agent)
- Kiến trúc có thể mở rộng cho nhiều platform

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **Telegram Bot Token**: Từ @BotFather
- **Chatwoot Instance**: Với API access
- **Dify AI**: Với API key và app ID

## 🛠️ Cài đặt

### 1. Clone và cài đặt

```bash
git clone <repository-url>
cd turbo-chatwoot-webhook
yarn install
```

### 2. Cấu hình môi trường

```bash
cp env.example .env
```

Chỉnh sửa file `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com
# For local development, use ngrok: https://abc123.ngrok.io

# Chatwoot
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_ACCESS_TOKEN=your_chatwoot_access_token
CHATWOOT_ACCOUNT_ID=your_account_id

# Dify AI
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key
DIFY_APP_ID=your_dify_app_id

# CORS (comma-separated domains that can access your API)
ALLOWED_ORIGINS=https://chatwoot.turbo.vn,https://your-domain.com
# Example: ALLOWED_ORIGINS=https://chatwoot.turbo.vn,https://myapp.com
```

### 3. Tạo Telegram Bot

1. Mở [@BotFather](https://t.me/botfather)
2. Gửi `/newbot`
3. Đặt tên và username
4. Copy `BOT_TOKEN` vào `.env`

### 4. Cấu hình Chatwoot

1. Đăng nhập Chatwoot admin
2. Tạo Personal Access Token
3. Lấy Account ID từ URL hoặc API
4. Cập nhật `.env`

### 5. Cấu hình Dify AI

1. Đăng nhập Dify dashboard
2. Tạo app mới
3. Lấy API Key và App ID
4. Cập nhật `.env`

## 🚀 Chạy ứng dụng

### Development (Local)

**Bước 1: Cài đặt ngrok để expose local server**

```bash
# Cài đặt ngrok
npm install -g ngrok
# hoặc download từ https://ngrok.com/

# Chạy ngrok (trong terminal khác)
ngrok http 3000
```

**Bước 2: Cập nhật .env với ngrok URL**

```env
TELEGRAM_WEBHOOK_URL=https://abc123.ngrok.io
```

**Bước 3: Chạy server**

```bash
yarn dev
```

**Bước 4: Setup Telegram webhook (Tự động)**

```bash
yarn setup-local
```

**Hoặc setup thủ công:**

```bash
yarn setup-telegram
```

### Production

```bash
yarn start
```

### Test tích hợp

```bash
yarn test-integration
```

## 🔧 Thiết lập Webhook

### 1. Telegram Webhook

```bash
npm run setup-telegram
```

### 2. Chatwoot Webhook

1. Vào Chatwoot Admin → Settings → Integrations → Webhooks
2. Thêm URL: `https://your-domain.com/webhook/chatwoot`
3. Chọn events: `message_created`, `conversation_created`
4. Lưu

## 🧪 Test

### Test Telegram

```bash
curl -X POST http://localhost:3000/api/test/telegram \
  -H "Content-Type: application/json" \
  -d '{"chatId": "your_chat_id", "message": "Hello!"}'
```

### Test Dify AI

```bash
curl -X POST http://localhost:3000/api/test/dify \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI!", "userId": "test_user"}'
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Xem logs

```bash
# Tất cả logs
yarn logs

# Chỉ error logs
yarn logs:error
```

## 🔒 Bảo mật

- Sử dụng HTTPS cho production
- Cấu hình ALLOWED_ORIGINS trong .env
- Không commit file .env
- Validate webhook signatures

## 🚀 Deployment

### PM2

```bash
yarn global add pm2
pm2 start src/server.js --name "turbo-chatwoot-webhook"
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production
COPY . .
EXPOSE 3000
CMD ["yarn", "start"]
```

## 🔧 Troubleshooting

### Lỗi thường gặp

1. **Missing environment variables**
   - Kiểm tra file `.env`
   - Đảm bảo tất cả biến được cấu hình

2. **Telegram webhook không hoạt động**
   - Kiểm tra bot token
   - Đảm bảo webhook URL accessible
   - Kiểm tra SSL certificate

3. **Chatwoot API lỗi**
   - Kiểm tra access token
   - Kiểm tra account ID
   - Kiểm tra base URL

4. **Dify AI không phản hồi**
   - Kiểm tra API key
   - Kiểm tra app ID
   - Kiểm tra API URL

### Debug

```bash
LOG_LEVEL=debug yarn dev
```

## 📞 Support

Tạo issue trên GitHub nếu gặp vấn đề.