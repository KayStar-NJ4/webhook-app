# 🚀 Turbo Chatwoot Webhook

Webhook trung gian kết nối các platform với Chatwoot và Dify AI.

## ✨ Tính năng

- **Multi-platform**: Telegram, Chatwoot, Dify AI
- **Admin Panel**: Giao diện quản lý hiện đại
- **Real-time**: Xử lý webhook real-time
- **Scalable**: Kiến trúc microservice

## 🚀 Cài đặt

### Development

```bash
# 1. Clone repository
git clone https://github.com/KayStar-NJ4/turbo-chatwoot-webhook.git
cd turbo-chatwoot-webhook

# 2. Cài đặt dependencies
yarn install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env với thông tin database

# 4. Setup database
yarn setup

# 5. Chạy development
yarn dev

# 6. Truy cập: http://localhost:3000/admin
```

### Production

```bash
# 1. Download environment file
wget -O .env https://raw.githubusercontent.com/KayStar-NJ4/turbo-chatwoot-webhook/master/.env.example

# 2. Download docker-compose
wget -O docker-compose.yml https://raw.githubusercontent.com/KayStar-NJ4/turbo-chatwoot-webhook/master/docker-compose.yml

# 3. Chỉnh sửa .env với thông tin production

# 4. Pull latest Docker image
docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest

# 5. Chạy với Docker
docker-compose up -d

# 6. Truy cập: http://your-domain.com/admin
```

## 🔄 CI/CD

**Automated Build:** GitHub Actions tự động build và push Docker images khi push vào `master` branch.

**Manual Deployment:** Bạn tự deploy bằng cách pull image và chạy docker-compose.

```bash
# Pull latest image
docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest

# Deploy
docker-compose up -d
```

## 📋 Scripts

```bash
yarn start          # Production start
yarn dev            # Development với nodemon
yarn lint           # Lint code
yarn lint:fix       # Fix lint errors
yarn migrate        # Chạy database migrations
yarn seed           # Seed dữ liệu mặc định
yarn setup          # Setup database (migrate + seed)
yarn docker:build   # Build và chạy Docker
yarn docker:down    # Stop Docker containers
yarn docker:logs    # Xem Docker logs
```

## 🏗️ Kiến trúc

```
src/
├── app.js                 # Entry point
├── domain/               # Domain entities
├── application/          # Use cases
├── infrastructure/       # External services
└── presentation/         # Controllers, routes, middleware

public/
└── admin/               # Frontend admin panel
    ├── index.html
    ├── src/
    └── js/
```

## 🔧 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# Services
CHATWOOT_ACCESS_TOKEN=your-token
TELEGRAM_BOT_TOKEN=your-bot-token
DIFY_API_KEY=your-api-key
```

## 📡 API Endpoints

- `GET /` - API information
- `GET /webhook/health` - Health check
- `POST /webhook/telegram` - Telegram webhook
- `POST /webhook/chatwoot` - Chatwoot webhook
- `GET /api/status` - Server status
- `GET /admin` - Admin panel

## 🐳 Docker

```bash
# Build image
docker build -t turbo-chatwoot-webhook .

# Run container
docker run -p 3000:3000 --env-file .env turbo-chatwoot-webhook

# Docker Compose
docker-compose up -d
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ThuanPT** - [GitHub](https://github.com/KayStar-NJ4)