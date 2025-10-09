# Turbo Webhook App - Deployment Guide

Hệ thống tích hợp Telegram, Chatwoot, Dify AI và Web Chat Widget.

## 📋 Yêu cầu 1

- Docker & Docker Compose
- PostgreSQL 14+
- Nginx (optional, for reverse proxy)
- Domain với SSL certificate (optional)

## 🚀 Quick Start - Deployment trên Server

### Bước 1: Chuẩn bị Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo apt install docker-compose -y

# Add user vào docker group
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra
docker --version
docker-compose --version
```

### Bước 2: Tải Code về Server

**Option A: Clone từ GitHub**
```bash
# SSH vào server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-username/webhook-app.git
cd webhook-app
```

**Option B: Upload file từ local**
```bash
# Từ máy local
# Nén code
tar -czf webhook-app.tar.gz webhook-app/

# Upload lên server
scp webhook-app.tar.gz user@your-server-ip:/home/user/

# SSH vào server và giải nén
ssh user@your-server-ip
tar -xzf webhook-app.tar.gz
cd webhook-app
```

### Bước 3: Cấu hình Environment Variables

```bash
# Copy file mẫu
cp .env.example .env

# Sửa file .env
nano .env
```

**File `.env` cần thiết:**

```env
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=webhook_user
DB_PASSWORD=your_strong_password_here
DB_NAME=webhook_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRATION=24h

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
ADMIN_USERNAME=admin

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
LOG_MAX_FILES=10
LOG_MAX_SIZE=10m

# CORS (nếu có frontend riêng)
ALLOWED_ORIGINS=https://yourdomain.com,https://landing-bot.turbo.vn

# Optional: Monitoring
# SENTRY_DSN=your_sentry_dsn
```

### Bước 4: Cấu hình Docker Compose

**File `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: webhook-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - turbo-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  webhook-app:
    image: ghcr.io/your-username/webhook-app:latest
    # hoặc build local:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    container_name: webhook-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - turbo-network
    volumes:
      - ./logs:/app/logs
      - ./public:/app/public
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/webhook/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  turbo-network:
    driver: bridge

volumes:
  postgres_data:
```

### Bước 5: Chạy Migration và Seed Data

```bash
# Tạo network (nếu chưa có)
docker network create turbo-network

# Start database trước
docker-compose up -d postgres

# Đợi database ready (10-15 giây)
sleep 15

# Chạy migrations
docker-compose run --rm webhook-app node scripts/migrate.js

# Seed initial data
docker-compose run --rm webhook-app node scripts/seed.js

# Kiểm tra logs
docker-compose logs -f postgres
```

### Bước 6: Start Application

```bash
# Start tất cả services
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f webhook-app

# Test health check
curl http://localhost:3000/webhook/health
```

### Bước 7: Cấu hình Nginx Reverse Proxy

**File `/etc/nginx/sites-available/webhook-bot.conf`:**

```nginx
server {
    listen 80;
    server_name webhook-bot.turbo.vn;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webhook-bot.turbo.vn;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/webhook-bot.turbo.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhook-bot.turbo.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
        client_max_body_size 10M;
        proxy_buffering off;
        proxy_read_timeout 36000s;
    }

    # Admin panel static files
    location /admin {
        proxy_pass http://localhost:3000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/webhook-access.log;
    error_log  /var/log/nginx/webhook-error.log;
}
```

**Enable site:**

```bash
# Link config
sudo ln -s /etc/nginx/sites-available/webhook-bot.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Bước 8: Setup SSL với Let's Encrypt

```bash
# Cài Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d webhook-bot.turbo.vn

# Certbot sẽ tự động config SSL trong nginx
# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Quản lý Application

### Commands thường dùng

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
docker-compose logs -f webhook-app
docker-compose logs -f postgres

# View container status
docker-compose ps

# Execute command trong container
docker-compose exec webhook-app sh
docker-compose exec postgres psql -U webhook_user -d webhook_db

# Backup database
docker-compose exec postgres pg_dump -U webhook_user webhook_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U webhook_user webhook_db < backup.sql
```

### Update Application

```bash
# Pull latest code
git pull origin master

# Pull latest image (nếu dùng pre-built)
docker-compose pull webhook-app

# Rebuild (nếu build local)
docker-compose build webhook-app

# Run migrations
docker-compose run --rm webhook-app node scripts/migrate.js

# Restart
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f webhook-app
```

### Rollback

```bash
# Stop hiện tại
docker-compose down

# Checkout version cũ
git checkout previous-tag-or-commit

# Rebuild & start
docker-compose up -d

# Check logs
docker-compose logs -f
```

## 📊 Monitoring & Logs

### Check Application Health

```bash
# Health endpoint
curl http://localhost:3000/webhook/health

# Admin login
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### View Logs

```bash
# Application logs
docker-compose logs -f webhook-app

# Nginx logs
sudo tail -f /var/log/nginx/webhook-access.log
sudo tail -f /var/log/nginx/webhook-error.log

# Database logs
docker-compose logs -f postgres

# Container logs location
ls -lh ./logs/
```

### Disk Usage

```bash
# Check disk space
df -h

# Docker disk usage
docker system df

# Clean old images
docker image prune -a

# Clean volumes (CAREFUL!)
docker volume prune
```

## 🔐 Security Checklist

- [ ] Đổi password mặc định của admin
- [ ] Set JWT_SECRET mạnh (>32 ký tự)
- [ ] Set DB_PASSWORD mạnh
- [ ] Enable firewall (ufw)
- [ ] Chỉ mở port cần thiết (80, 443, 22)
- [ ] Setup SSL/TLS certificate
- [ ] Regular backup database
- [ ] Update system thường xuyên
- [ ] Monitor logs
- [ ] Set rate limiting trong nginx

### Firewall Setup

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## 🗄️ Database Backup & Restore

### Automatic Backup Script

**File `backup.sh`:**

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/webhook_db_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U webhook_user webhook_db > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Setup Cron:**

```bash
# Make executable
chmod +x backup.sh

# Add to crontab (backup daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /home/user/webhook-app/backup.sh
```

### Restore Backup

```bash
# Decompress
gunzip backup.sql.gz

# Restore
docker-compose exec -T postgres psql -U webhook_user webhook_db < backup.sql
```

## 🐛 Troubleshooting

### Application không start

```bash
# Check logs
docker-compose logs webhook-app

# Check database connection
docker-compose exec webhook-app node -e "require('./src/infrastructure/config/Config').default.validate()"

# Restart
docker-compose restart webhook-app
```

### Database connection error

```bash
# Check postgres running
docker-compose ps postgres

# Check network
docker network inspect turbo-network

# Restart database
docker-compose restart postgres
```

### Permission denied errors

```bash
# Fix logs directory
sudo chown -R 1001:1001 logs/

# Fix volumes
docker-compose down
docker volume rm webhook-app_postgres_data
docker-compose up -d
```

### Out of disk space

```bash
# Clean Docker
docker system prune -a
docker volume prune

# Clean logs
find ./logs -name "*.log" -mtime +30 -delete
```

## 📚 Admin Panel Usage

1. Truy cập: `https://webhook-bot.turbo.vn/admin`
2. Login với credentials trong `.env`
3. Setup các tích hợp:
   - **Telegram Bots**: Thêm bot token và setup webhook
   - **Chatwoot Accounts**: Kết nối Chatwoot instance
   - **Dify Apps**: Thêm Dify AI bot
   - **Web Apps**: Tạo API key cho landing page
   - **Platform Mappings**: Kết nối các platform với nhau

## 🔗 Related Services

- **Landing Page**: Deploy riêng với `turbo-landing-page`
- **Chatwoot**: Setup riêng hoặc dùng cloud
- **Dify**: Setup riêng hoặc dùng cloud

## 📞 Support

- GitHub Issues: [Link to repo]
- Documentation: [Link to wiki]
- Email: admin@yourdomain.com

## 📄 License

[Your License]
