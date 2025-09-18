# 🚀 Complete Setup Guide - Turbo Chatwoot Webhook

Hướng dẫn setup hoàn chỉnh cho production deployment với CI/CD tự động.

## 📋 Tổng quan

Hệ thống đã được setup với:
- ✅ **GitHub Actions CI/CD** - Tự động deploy khi push code
- ✅ **Docker & Docker Compose** - Containerized deployment
- ✅ **Nginx Reverse Proxy** - Load balancing và SSL
- ✅ **PostgreSQL & Redis** - Database và cache
- ✅ **Backup & Rollback** - Tự động backup và khôi phục
- ✅ **Monitoring & Logging** - Theo dõi hệ thống
- ✅ **Security** - Firewall, fail2ban, SSL

## 🎯 Quick Start (5 phút)

### ⚠️ **Lưu ý quan trọng:**
- **Chỉ clone những file cần thiết** (scripts, config, docker-compose) - KHÔNG clone source code
- **Sau đó chỉ cần push code lên GitHub** → CI/CD build Docker image và deploy
- **Không cần source code trên server** → Docker image đã chứa tất cả

### 1. Setup Server (Chạy trên server 103.142.137.118)

```bash
# SSH vào server
ssh root@103.142.137.118

# Download và chạy setup script
curl -fsSL https://raw.githubusercontent.com/thuanpt/turbo-chatwoot-webhook/master/scripts/setup-server.sh | bash

# Hoặc clone repository và chạy
git clone https://github.com/thuanpt/turbo-chatwoot-webhook.git /tmp/webhook
cd /tmp/webhook
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```
 
### 2. Setup Project Directory

```bash
# Tạo thư mục project
mkdir -p /root/workplace/vision_lab/webhook/staging
cd /root/workplace/vision_lab/webhook/staging

# Clone chỉ những file cần thiết (không clone source code)
curl -fsSL https://raw.githubusercontent.com/thuanpt/turbo-chatwoot-webhook/master/scripts/setup-server-files.sh | bash

# Hoặc clone manual với sparse checkout:
# git init
# git remote add origin https://github.com/thuanpt/turbo-chatwoot-webhook.git
# git config core.sparseCheckout true
# echo "docker-compose.prod.yml" >> .git/info/sparse-checkout
# echo "scripts/" >> .git/info/sparse-checkout
# echo "nginx/" >> .git/info/sparse-checkout
# echo "env.example" >> .git/info/sparse-checkout
# git pull origin master

# Copy environment file
cp env.example .env
```

### 3. Configure Environment

```bash
# Edit environment variables
nano .env

# Các biến quan trọng cần thay đổi:
# - DB_PASSWORD=your_secure_password
# - REDIS_PASSWORD=your_secure_password  
# - JWT_SECRET=your_very_secure_jwt_secret_here
# - ADMIN_EMAIL=admin@yourdomain.com
# - ADMIN_PASSWORD=your_secure_password
# - CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
# - CHATWOOT_ACCESS_TOKEN=your_token
# - DIFY_API_KEY=your_dify_key
# - TELEGRAM_BOT_TOKEN=your_bot_token
```

### 4. Deploy Application

```bash
# Chạy deployment
./scripts/deploy.sh deploy

# Hoặc quick deploy
./scripts/quick-deploy.sh
```

### 5. Setup SSL Certificate

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d chatwoot.turbo.vn

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🔐 GitHub Secrets Setup

### 1. Generate SSH Key

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "deploy@yourdomain.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@103.142.137.118
```

### 2. Add GitHub Secrets

Vào **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

```
PROD_HOST = 103.142.137.118
PROD_USER = root
PROD_SSH_KEY = <content_of_~/.ssh/id_rsa>
PROD_PORT = 22
```

## 🚀 CI/CD Pipeline

### Workflow Overview
1. **Clone chỉ những file cần thiết lên server** (scripts, config, docker-compose) - KHÔNG clone source code
2. **Push code lên GitHub** → CI/CD build Docker image và deploy
3. **Không cần source code trên server** → Docker image đã chứa tất cả

### Automatic Deployment
- Push code to `master` branch → Tự động deploy
- GitHub Actions sẽ:
  1. Run tests
  2. Build Docker image (chứa source code)
  3. Push to GitHub Container Registry
  4. SSH vào server và pull Docker image mới
  5. Deploy với Docker Compose
  6. Run health checks

### Manual Deployment
- Vào **Actions** tab → **Deploy to Production** → **Run workflow**

## 📊 Monitoring & Management

### Health Check
```bash
# Health check
curl http://chatwoot.turbo.vn:7070/health

# Access webhook admin panel
curl http://chatwoot.turbo.vn:7070/webhook/

# Access webhook endpoints
curl http://chatwoot.turbo.vn:7070/webhook/telegram
curl http://chatwoot.turbo.vn:7070/webhook/chatwoot
```

### View Logs
```bash
# Application logs
./scripts/deploy.sh logs

# Specific service logs
./scripts/deploy.sh logs webhook-app
./scripts/deploy.sh logs nginx
```

### System Status
```bash
# Deployment status
./scripts/deploy.sh status

# System monitoring
webhook-monitor
```

### Backup & Restore
```bash
# Create database backup
./scripts/backup-database.sh

# List backups
ls -la /root/workplace/vision_lab/webhook/staging/backup/

# Rollback
./scripts/deploy.sh rollback webhook_01_01_2024
```

**Automatic Backup:**
- ⏰ **Schedule**: Every day at 00:00
- 📁 **Location**: `/root/workplace/vision_lab/webhook/staging/backup/`
- 🏷️ **Naming**: `webhook_DD_MM_YYYY`
- 🗑️ **Retention**: 30 days

## 🔧 Configuration Files

### Environment Variables
- `env.example` - Template cho environment variables
- `.env` - Production configuration (không commit)

### Docker Configuration
- `docker-compose.prod.yml` - Production Docker Compose
- `Dockerfile` - Application container (chứa source code)
- `nginx/nginx.prod.conf` - Production Nginx config

### 🐳 **Docker Workflow:**
1. **Source code** → Build thành Docker image
2. **Docker image** → Push lên GitHub Container Registry
3. **Server** → Pull Docker image và deploy
4. **Không cần source code trên server** → Docker image đã chứa tất cả

### 📁 **Files trên server (sparse checkout):**
- ✅ `docker-compose.prod.yml` - Docker Compose config
- ✅ `Dockerfile` - Docker build file
- ✅ `scripts/` - Deployment scripts
- ✅ `nginx/` - Nginx configuration
- ✅ `env.example` - Environment template
- ✅ `package.json`, `yarn.lock` - Package files
- ❌ `src/` - Source code (KHÔNG clone)
- ❌ `public/` - Frontend files (KHÔNG clone)
- ❌ Development files (KHÔNG clone)

### Scripts
- `scripts/deploy.sh` - Main deployment script
- `scripts/setup-server.sh` - Server setup script
- `scripts/quick-deploy.sh` - Quick deployment
- `scripts/setup-github-secrets.md` - GitHub secrets guide

### CI/CD
- `.github/workflows/deploy.yml` - GitHub Actions workflow

## 📁 Directory Structure

```
/root/workplace/vision_lab/webhook/
├── staging/                    # Production deployment
│   ├── .env                   # Environment variables
│   ├── docker-compose.prod.yml
│   ├── scripts/
│   └── ...
├── backups/                   # Automatic backups
│   ├── backup-20240101-120000/
│   └── ...
└── logs/                      # Application logs
    └── webhook-deploy.log
```

## 🛠️ Useful Commands

### Deployment
```bash
# Deploy new version
./scripts/deploy.sh deploy

# Create database backup
./scripts/backup-database.sh

# Rollback to previous version
./scripts/deploy.sh rollback webhook_01_01_2024

# Check status
./scripts/deploy.sh status
```

### Docker Management
```bash
# View containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### System Management
```bash
# System monitoring
webhook-monitor

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop
```

## 🔒 Security Features

### Firewall (UFW)
- SSH (port 22)
- HTTP (port 80)
- HTTPS (port 443)
- All other ports blocked

### Fail2ban
- SSH brute force protection
- Nginx attack protection
- Automatic IP blocking

### SSL/TLS
- Let's Encrypt certificates
- Automatic renewal
- Strong cipher suites
- HSTS headers

### Docker Security
- Non-root containers
- Resource limits
- Read-only filesystems
- Security scanning

## 📈 Performance Optimization

### Nginx
- Gzip compression
- Static file caching
- Connection pooling
- Rate limiting

### Database
- Connection pooling
- Query optimization
- Index optimization
- Regular maintenance

### Redis
- Memory optimization
- Persistence configuration
- Connection pooling

## 🆘 Troubleshooting

### Common Issues

#### 1. Container không start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs webhook-app

# Check environment
docker-compose -f docker-compose.prod.yml config

# Restart
docker-compose -f docker-compose.prod.yml restart
```

#### 2. Database connection failed
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Run migrations
docker-compose -f docker-compose.prod.yml exec webhook-app yarn migrate
```

#### 3. Nginx issues
```bash
# Check nginx config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

#### 4. Memory issues
```bash
# Check memory usage
docker stats

# Clean up
docker system prune -f

# Restart with fresh containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support & Documentation

### Documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Detailed deployment guide
- `ARCHITECTURE.md` - System architecture
- `CHANGELOG.md` - Version history

### Logs
- Application logs: `./logs/`
- Deployment logs: `/var/log/webhook-deploy.log`
- System logs: `/var/log/syslog`

### Monitoring
- Health endpoint: `http://yourdomain.com/health`
- Metrics: `http://yourdomain.com:9090` (if enabled)
- System monitoring: `webhook-monitor`

## 🎉 Success Checklist

- [ ] Server setup completed
- [ ] Repository cloned
- [ ] Environment configured
- [ ] Application deployed
- [ ] SSL certificate installed
- [ ] GitHub secrets configured
- [ ] CI/CD pipeline working
- [ ] Health check passing
- [ ] Backup system working
- [ ] Monitoring setup
- [ ] Documentation reviewed

---

**🎯 Bạn đã sẵn sàng deploy lên production!**

Hệ thống sẽ tự động:
- Deploy khi push code lên master branch
- Backup trước mỗi lần deploy
- Health check sau deploy
- Rollback nếu có lỗi
- Monitor và log tất cả hoạt động

**Chúc bạn deploy thành công! 🚀**
