# 🚀 Turbo Chatwoot Webhook

Hệ thống webhook đa nền tảng kết nối Chatwoot với Telegram và Dify AI.

## ✨ Tính năng

- **1 Chatwoot Account** → **Nhiều Telegram Bots** + **Dify Apps**
- **Admin Panel** với phân quyền 4 cấp độ
- **Đa ngôn ngữ** (Tiếng Việt, English)
- **Auto CI/CD** với Docker

## 🚀 Cài đặt nhanh

### 1. Cài đặt Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Download files

```bash
# Tạo thư mục
mkdir turbo-chatwoot-webhook
cd turbo-chatwoot-webhook

# Download .env template
wget -O .env https://raw.githubusercontent.com/[username]/turbo-chatwoot-webhook/master/.env.example

# Download docker-compose
wget -O docker-compose.yaml https://raw.githubusercontent.com/[username]/turbo-chatwoot-webhook/master/docker-compose.yml
```

### 3. Cấu hình

```bash
# Chỉnh sửa .env
nano .env
```

**Cấu hình cần thiết:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# Redis
REDIS_PASSWORD=your_redis_password

# Server
NODE_ENV=production
PORT=3000
```

### 4. Deploy

```bash
# Pull image
docker pull ghcr.io/[username]/turbo-chatwoot-webhook:latest

# Start services
docker-compose up -d

# Setup database
docker-compose exec webhook-app yarn migrate
docker-compose exec webhook-app yarn seed
```

### 5. Truy cập

- **Main app**: http://localhost:3000
- **Admin panel**: http://localhost:3000/admin
- **Default login**: superadmin / password

## 🔧 Cấu hình hệ thống

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

## 🔄 Upgrade

```bash
# Pull latest image
docker pull ghcr.io/[username]/turbo-chatwoot-webhook:latest

# Restart services
docker-compose down
docker-compose up -d

# Update database (if needed)
docker-compose exec webhook-app yarn migrate
```

## 🔒 Bảo mật

- JWT authentication
- Role-based permissions
- Input validation
- SQL injection prevention

## 📝 Development

```bash
# Clone repository
git clone https://github.com/[username]/turbo-chatwoot-webhook.git
cd turbo-chatwoot-webhook

# Install dependencies
yarn install

# Setup database
yarn setup

# Start development
yarn dev
```

---

**Made with ❤️ by Turbo Team**