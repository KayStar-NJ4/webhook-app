# 🚀 Webhook Configuration Summary

## 🌐 **URL Structure**

### **Main Site (không động vào)**
- `https://chatwoot.turbo.vn` - Main Chatwoot site (đã có sẵn)

### **Webhook Service (port 7070)**
- `https://chatwoot.turbo.vn:7070/webhook/` - Admin panel
- `https://chatwoot.turbo.vn:7070/webhook/telegram` - Telegram webhook
- `https://chatwoot.turbo.vn:7070/webhook/chatwoot` - Chatwoot webhook
- `https://chatwoot.turbo.vn:7070/webhook/api/` - API endpoints
- `https://chatwoot.turbo.vn:7070/health` - Health check

## 🔧 **Configuration Files**

### **1. Docker Compose (`docker-compose.prod.yml`)**
```yaml
ports:
  - "7070:80"    # HTTP
  - "7071:443"   # HTTPS (nếu cần)
```

### **2. Nginx Config (`nginx/nginx.prod.conf`)**
```nginx
# Root location - let main site handle it
location / {
    # Do nothing, let main site handle
}

# Webhook endpoints - main path
location /webhook/ {
    try_files $uri $uri/ @webhook_backend;
}

# Webhook backend proxy
location @webhook_backend {
    proxy_pass http://webhook_app;
    # ... proxy settings
}
```

### **3. Environment Variables (`env.example`)**
```bash
# CORS Configuration
CORS_ORIGIN=https://chatwoot.turbo.vn,https://your-chatwoot-instance.com

# Telegram Bot Configuration
TELEGRAM_WEBHOOK_URL=https://chatwoot.turbo.vn:7070/webhook/telegram
```

## 🚀 **Deployment Commands**

### **Setup Server**
```bash
# SSH vào server
ssh root@103.142.137.118

# Setup server
curl -fsSL https://raw.githubusercontent.com/thuanpt/turbo-chatwoot-webhook/master/scripts/setup-server.sh | bash

# Clone files cần thiết
cd /root/workplace/vision_lab/webhook/staging
curl -fsSL https://raw.githubusercontent.com/thuanpt/turbo-chatwoot-webhook/master/scripts/setup-server-files.sh | bash
```

### **Configure Environment**
```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### **Deploy**
```bash
# Deploy application
./scripts/deploy.sh deploy

# Hoặc quick deploy
./scripts/quick-deploy.sh
```

## 📊 **Monitoring & Testing**

### **Health Check**
```bash
# Health check
curl http://chatwoot.turbo.vn:7070/health

# Access webhook admin panel
curl http://chatwoot.turbo.vn:7070/webhook/

# Test webhook endpoints
curl http://chatwoot.turbo.vn:7070/webhook/telegram
curl http://chatwoot.turbo.vn:7070/webhook/chatwoot
```

### **View Logs**
```bash
# Application logs
./scripts/deploy.sh logs

# Container status
docker-compose -f docker-compose.prod.yml ps

# System monitoring
webhook-monitor
```

## 🔐 **GitHub Secrets Setup**

### **Repository Secrets**
```
PROD_HOST = 103.142.137.118
PROD_USER = root
PROD_SSH_KEY = <your_private_ssh_key>
PROD_PORT = 22
```

### **SSH Key Setup**
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "deploy@chatwoot.turbo.vn"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@103.142.137.118

# Add private key to GitHub Secrets
cat ~/.ssh/id_rsa
```

## 🎯 **Key Points**

### **✅ What's Configured:**
- Port 7070 cho webhook service
- Subpath `/webhook/` để tránh conflict với main site
- Docker containerization
- CI/CD pipeline với GitHub Actions
- Automatic backup system
- Health monitoring
- Security (firewall, fail2ban)

### **❌ What's NOT Touched:**
- Main site `chatwoot.turbo.vn` (port 80/443)
- Existing services
- Root path `/` (let main site handle)

### **🔄 Workflow:**
1. **Push code** → GitHub Actions build Docker image
2. **Docker image** → Push to GitHub Container Registry
3. **Server** → Pull Docker image và deploy
4. **Access** → `chatwoot.turbo.vn:7070/webhook/`

## 📞 **Support**

- **Health Check**: `http://chatwoot.turbo.vn:7070/health`
- **Admin Panel**: `http://chatwoot.turbo.vn:7070/webhook/`
- **Logs**: `./scripts/deploy.sh logs`
- **Status**: `./scripts/deploy.sh status`

---

**🎉 Ready to deploy!** Webhook service sẽ chạy trên `chatwoot.turbo.vn:7070/webhook/` mà không ảnh hưởng đến main site.
