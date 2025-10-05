# 🚀 Turbo Chatwoot Webhook

Webhook trung gian kết nối các platform với Chatwoot và Dify AI.

## ✨ Tính năng

- **Multi-platform**: Telegram, Chatwoot, Dify AI
- **Admin Panel**: Giao diện quản lý hiện đại
- **Real-time**: Xử lý webhook real-time
- **Scalable**: Kiến trúc microservice

## 🚀 Cài đặt

### Development (Local)

```bash
# 1. Clone repository
git clone https://github.com/KayStar-NJ4/turbo-chatwoot-webhook.git
cd turbo-chatwoot-webhook

# 2. Cài đặt dependencies
yarn install

# 3. Tạo file .env và cấu hình (xem mục "Environment Variables" bên dưới)
#   - Windows PowerShell: New-Item -ItemType File .env
#   - macOS/Linux: touch .env
#   - Điền các biến: DB_*, REDIS_*, JWT_SECRET, CHATWOOT_ACCESS_TOKEN, TELEGRAM_BOT_TOKEN, DIFY_API_KEY

# 4. Khởi tạo database lần đầu (migrate + seed)
yarn setup
#$2b$10$VjzqcB9/wd/4kBfH4/7nwexn10d8sTThzmRbNdkKmMkirKCKQSQfW

# 5. Chạy development
yarn dev

# 6. Truy cập:
#   API Health: http://localhost:3000/webhook/health
#   Admin:      http://localhost:3000/admin
```

### Production (Docker)

Yêu cầu: cài sẵn Docker và Docker Compose trên server.

#### Cách A (khuyến nghị) — Dùng prebuilt image, không cần clone toàn bộ source

Chỉ cần tải các file mẫu và cấu hình sau:

```bash
# 1) Tạo thư mục deploy và chuyển vào đó
mkdir -p /opt/turbo-chatwoot-webhook && cd /opt/turbo-chatwoot-webhook

# 2) Tải file ví dụ docker-compose và nginx
curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/KayStar-NJ4/turbo-chatwoot-webhook/master/deploy/docker-compose.example.yml
mkdir -p nginx
curl -fsSL -o nginx/nginx.conf https://raw.githubusercontent.com/KayStar-NJ4/turbo-chatwoot-webhook/master/deploy/nginx/nginx.example.conf

# 3) Tạo file .env (production) theo biến ở mục "Environment Variables"
touch .env
#   - Điền DB_* (PostgreSQL production), REDIS_* (để trống nếu dùng redis trong compose),
#     JWT_SECRET đủ mạnh, và các token/key: CHATWOOT_ACCESS_TOKEN, TELEGRAM_BOT_TOKEN, DIFY_API_KEY

# 4) Khởi chạy
docker-compose pull
docker-compose up -d

# 5) (Tuỳ chọn) migrate/seed lần đầu
docker-compose exec app yarn migrate
docker-compose exec app yarn seed

# 6) Kiểm tra
curl -sS http://<SERVER_IP>/webhook/health

# 7) Nâng cấp phiên bản về sau
docker-compose pull && docker-compose up -d
```

#### Cách B — Build từ source (cần clone repo)

```bash
# 1) Clone repo và vào thư mục dự án
git clone https://github.com/KayStar-NJ4/turbo-chatwoot-webhook.git
cd turbo-chatwoot-webhook

# 2) Tạo file .env (production)
#    Cấu hình DB_*, REDIS_*, JWT_SECRET và các token/key cần thiết

# 3) Khởi chạy (build image từ source)
docker-compose up -d --build

# 4) (Tuỳ chọn) migrate/seed lần đầu
docker-compose exec app yarn migrate
docker-compose exec app yarn seed

# 5) Kiểm tra
curl -sS http://<SERVER_IP>/webhook/health
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
docker-compose up -d --build
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ThuanPT** - [GitHub](https://github.com/KayStar-NJ4)