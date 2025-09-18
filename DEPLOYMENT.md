# 🚀 Production Deployment Guide

Hướng dẫn deploy tự động lên server production với CI/CD pipeline.

## 📋 Yêu cầu hệ thống

### Server Requirements
- **OS**: Ubuntu 20.04+ hoặc CentOS 8+
- **RAM**: Tối thiểu 2GB, khuyến nghị 4GB+
- **CPU**: 2 cores trở lên
- **Disk**: 20GB trống
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

### Network Requirements
- **Ports**: 80, 443, 22 (SSH)
- **Domain**: Có domain name trỏ về server
- **SSL**: Certificate cho HTTPS (Let's Encrypt khuyến nghị)

## 🔧 Setup Server

### 1. Cài đặt Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Tạo thư mục project

```bash
# Tạo thư mục project
sudo mkdir -p /root/workplace/vision_lab/webhook/staging
sudo mkdir -p /root/workplace/vision_lab/webhook/backups

# Clone chỉ những file cần thiết (không clone source code)
cd /root/workplace/vision_lab/webhook/staging
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

# Set permissions
sudo chown -R root:root /root/workplace/vision_lab/webhook/
```

### 3. Cấu hình Environment Variables

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Các biến quan trọng cần thay đổi:**

```bash
# Database
DB_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# JWT Secret (Generate strong secret)
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters

# Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password_here

# Chatwoot integration
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_ACCESS_TOKEN=your_chatwoot_access_token_here
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id_here

# Dify AI integration
DIFY_API_KEY=your_dify_api_key_here
DIFY_APP_ID=your_dify_app_id_here

# Telegram bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook/telegram

# CORS
CORS_ORIGIN=https://yourdomain.com,https://your-chatwoot-instance.com
```

### 4. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d chatwoot.turbo.vn

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔐 GitHub Secrets Configuration

Thêm các secrets sau vào GitHub repository:

### Repository Secrets
```
PROD_HOST=103.142.137.118
PROD_USER=root
PROD_SSH_KEY=<your_private_ssh_key>
PROD_PORT=22
```

### SSH Key Setup

```bash
# Generate SSH key pair (on local machine)
ssh-keygen -t rsa -b 4096 -C "deploy@yourdomain.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@103.142.137.118

# Add private key to GitHub Secrets as PROD_SSH_KEY
cat ~/.ssh/id_rsa
```

## 🚀 Deployment Process

### Automatic Deployment (CI/CD)

1. **Push to master branch** - Tự động trigger deployment
2. **Manual deployment** - Sử dụng GitHub Actions workflow_dispatch

### Manual Deployment

```bash
# SSH vào server
ssh root@103.142.137.118

# Chạy deployment script
cd /root/workplace/vision_lab/webhook/staging
./scripts/deploy.sh deploy
```

## 📊 Monitoring & Management

### Health Check

```bash
# Check service status
curl http://chatwoot.turbo.vn:7070/health

# Access webhook admin panel
curl http://chatwoot.turbo.vn:7070/webhook/

# Access webhook endpoints
curl http://chatwoot.turbo.vn:7070/webhook/telegram
curl http://chatwoot.turbo.vn:7070/webhook/chatwoot

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Backup & Restore

```bash
# Create database backup
./scripts/backup-database.sh

# List backups
ls -la /root/workplace/vision_lab/webhook/staging/backup/

# Rollback to previous version
./scripts/deploy.sh rollback webhook_01_01_2024
```

**Automatic Backup Schedule:**
- Database backup: Every day at 00:00
- Backup location: `/root/workplace/vision_lab/webhook/staging/backup/`
- Backup naming: `webhook_DD_MM_YYYY`
- Retention: 30 days

### Log Management

```bash
# View application logs
./scripts/deploy.sh logs

# View specific service logs
./scripts/deploy.sh logs webhook-app
./scripts/deploy.sh logs nginx
./scripts/deploy.sh logs redis
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Container không start được
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs webhook-app

# Check environment variables
docker-compose -f docker-compose.prod.yml config

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### 2. Database connection issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Run migrations manually
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

# Clean up unused images
docker image prune -f

# Restart with fresh containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Optimization

#### 1. Database Optimization
```bash
# Check database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d chatwoot_webhook -c "SELECT * FROM pg_stat_activity;"

# Optimize database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d chatwoot_webhook -c "VACUUM ANALYZE;"
```

#### 2. Redis Optimization
```bash
# Check Redis memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# Clear Redis cache if needed
docker-compose -f docker-compose.prod.yml exec redis redis-cli flushall
```

## 📈 Scaling & Load Balancing

### Horizontal Scaling

```bash
# Scale webhook-app service
docker-compose -f docker-compose.prod.yml up -d --scale webhook-app=3

# Update nginx upstream configuration
# Add multiple backend servers in nginx.conf
```

### Load Balancer Setup

```bash
# Install HAProxy (alternative to nginx)
sudo apt install haproxy -y

# Configure HAProxy for load balancing
# /etc/haproxy/haproxy.cfg
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Docker Security
```bash
# Run containers as non-root user
# Use read-only filesystems where possible
# Limit container resources
# Regular security updates
```

### 3. SSL/TLS Configuration
```bash
# Use strong SSL configuration
# Enable HSTS
# Regular certificate renewal
```

## 📝 Maintenance

### Regular Tasks

#### Daily
- Monitor application logs
- Check system resources
- Verify backup completion

#### Weekly
- Update system packages
- Review security logs
- Performance analysis

#### Monthly
- Update Docker images
- Review and rotate secrets
- Capacity planning

### Update Process

```bash
# Update application
git pull origin master
./scripts/deploy.sh deploy

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io -y
```

## 🆘 Emergency Procedures

### Service Down
1. Check container status: `docker-compose -f docker-compose.prod.yml ps`
2. View logs: `docker-compose -f docker-compose.prod.yml logs`
3. Restart services: `docker-compose -f docker-compose.prod.yml restart`
4. If needed, rollback: `./scripts/deploy.sh rollback <backup-name>`

### Data Loss
1. Stop services: `docker-compose -f docker-compose.prod.yml down`
2. Restore from backup: `./scripts/deploy.sh rollback <backup-name>`
3. Verify data integrity
4. Restart services: `docker-compose -f docker-compose.prod.yml up -d`

### Security Incident
1. Isolate server from network
2. Preserve logs and evidence
3. Assess damage
4. Restore from clean backup
5. Update security measures

## 📞 Support

- **Documentation**: [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/thuanpt/turbo-chatwoot-webhook/issues)
- **Logs**: `/var/log/webhook-deploy.log`

---

**Lưu ý**: Luôn test deployment trên staging environment trước khi deploy lên production!
