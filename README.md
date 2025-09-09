# Turbo Chatwoot Webhook - Bot Telegram Thông Minh

Hệ thống webhook trung gian kết nối Telegram với Chatwoot và Dify AI, được cải tiến để xử lý đa cuộc trò chuyện thông minh.

## 🎯 Vấn đề đã giải quyết

Bot Telegram trước đây gặp các vấn đề:
- ❌ Không phân biệt được tin nhắn từ nhiều cuộc trò chuyện
- ❌ Tạo conversation mới mỗi lần nhận tin nhắn
- ❌ Không hỗ trợ group chat hiệu quả
- ❌ Mất context cuộc trò chuyện
- ❌ Trả lời tin nhắn cũ

## ✅ Cải tiến đã thực hiện

### 1. **Nhận biết đa cuộc trò chuyện thông minh**
- Phân biệt rõ ràng giữa **private chat** và **group chat**
- Sử dụng `conversationId` thông minh:
  - Private chat: `conversationId = userId`
  - Group chat: `conversationId = chatId`
- Mỗi cuộc trò chuyện có conversation riêng biệt

### 2. **Duy trì context cuộc trò chuyện**
- Không tạo conversation mới mỗi lần
- Sử dụng conversation đã có trong memory mapping
- Context được duy trì trên cả 3 platform (Telegram, Chatwoot, Dify)

### 3. **Hỗ trợ group chat hoàn chỉnh**
- Tin nhắn group được format: `[Tên người gửi]: Nội dung tin nhắn`
- Tên group được hiển thị chính xác trong Chatwoot
- Thông tin người gửi được lưu đầy đủ

### 4. **Tránh xử lý tin nhắn trùng lặp**
- Sử dụng `conversationId + messageId` làm unique key
- Chỉ trả lời tin nhắn mới, bỏ qua tin nhắn đã xử lý

### 5. **Cải thiện tích hợp Dify AI**
- Gửi context về group chat và tên người gửi
- Duy trì conversation context liên tục
- AI hiểu được context cuộc trò chuyện tốt hơn

## 🚀 Tính năng

- **Kết nối đa platform**: Telegram ↔ Chatwoot ↔ Dify AI
- **Hỗ trợ đa cuộc trò chuyện**: Private chat và Group chat
- **Nhận biết thông minh**: Phân biệt tin nhắn từ nhiều cuộc trò chuyện
- **Duy trì context**: Không mất lịch sử cuộc trò chuyện
- **Lưu trữ lịch sử**: Tin nhắn đầy đủ trên cả 3 platform
- **Xử lý hai chiều**: User ↔ Agent ↔ AI
- **Kiến trúc mở rộng**: Dễ dàng thêm platform mới

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.0.0
- **Yarn**: >= 1.22.0
- **Telegram Bot Token**: Từ @BotFather
- **Chatwoot Instance**: Với API access
- **Dify AI**: Với API key và app ID

## 🛠️ Cài đặt

### 1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd turbo-chatwoot-webhook
yarn config set registry https://registry.npmjs.org/
yarn install
```

### 2. Cấu hình môi trường

```bash
cp env.example .env
```

### 3. Tạo Telegram Bot

1. Mở [@BotFather](https://t.me/botfather)
2. Gửi `/newbot`
3. Đặt tên và username cho bot
4. Copy `BOT_TOKEN` vào file `.env`

### 4. Cấu hình Chatwoot

1. Đăng nhập Chatwoot admin
2. Tạo Personal Access Token
3. Lấy Account ID từ URL hoặc API
4. Cập nhật file `.env`

### 5. Cấu hình Dify AI

1. Đăng nhập Dify dashboard
2. Tạo app mới
3. Lấy API Key và App ID
4. Cập nhật file `.env`

## 🚀 Chạy ứng dụng

### Development (Local)

**Bước 1: Cài đặt ngrok để expose local server**

```bash
# Cài đặt ngrok
yarn global add ngrok
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

**Bước 4: Setup Telegram webhook**

```bash
yarn setup-local
```

### Production

```bash
yarn start
```

## 🧪 Test

### Test các cải tiến

```bash
yarn test-improvements
```

### Test tích hợp

```bash
yarn test-integration
```

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

## 🔧 Thiết lập Webhook

### 1. Telegram Webhook

```bash
yarn setup-telegram
```

### 2. Chatwoot Webhook

1. Vào Chatwoot Admin → Settings → Integrations → Webhooks
2. Thêm URL: `https://your-domain.com/webhook/chatwoot`
3. Chọn events: `message_created`, `conversation_created`
4. Lưu

## 📊 Cách hoạt động

### Private Chat
1. User gửi tin nhắn → `conversationId = userId`
2. Tìm/tạo conversation trong Chatwoot với tên user
3. Gửi tin nhắn đến Dify với `userId`
4. Trả lời về Telegram và lưu vào Chatwoot

### Group Chat
1. User gửi tin nhắn trong group → `conversationId = chatId`
2. Tìm/tạo conversation trong Chatwoot với tên group
3. Gửi tin nhắn đến Dify với format `[Tên user]: Nội dung`
4. Trả lời về group và lưu vào Chatwoot

## 📁 Cấu trúc dữ liệu

### TelegramMessage
```javascript
{
  messageId: number,
  chatId: string,           // ID của chat (group hoặc private)
  userId: string,           // ID của người gửi
  conversationId: string,   // ID để tracking conversation
  displayName: string,      // Tên hiển thị
  isGroupChat: boolean,     // Có phải group chat không
  groupTitle: string,       // Tên group (nếu là group)
  // ... các field khác
}
```

### Conversation Mapping
```javascript
// conversationMap: Map<conversationId, chatwootConversationId>
// difyConversationMap: Map<conversationId, difyConversationId>
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

## 🎉 Kết quả

Bot giờ đây có thể:
- ✅ Tham gia nhiều cuộc trò chuyện (private + group)
- ✅ Nhận biết tin nhắn từ đâu
- ✅ Trả lời đúng cuộc trò chuyện
- ✅ Cập nhật Chatwoot với tên đúng
- ✅ Duy trì context cuộc trò chuyện
- ✅ Không tạo conversation mới mỗi lần
- ✅ Chỉ trả lời tin nhắn mới