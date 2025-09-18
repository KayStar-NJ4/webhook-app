# 🚀 GitHub Actions Setup Guide - Turbo Chatwoot Webhook

Hướng dẫn chi tiết setup GitHub Actions và CI/CD pipeline cho dự án Turbo Chatwoot Webhook.

## 📋 **Tổng Quan**

Dự án này sử dụng GitHub Actions để:
- ✅ Build Docker image tự động
- ✅ Push image lên GitHub Container Registry (GHCR)
- ✅ Deploy tự động lên production server
- ✅ Chạy tests và linting

## 🔐 **Bước 1: Tạo SSH Key Pair**

### 1.1 Tạo SSH Key trên máy local

```bash
# Tạo SSH key pair
ssh-keygen -t rsa -b 4096 -C "deploy@kaystar-nj4.com"

# Nhấn Enter để chấp nhận đường dẫn mặc định (~/.ssh/id_rsa)
# Nhập passphrase (tùy chọn, khuyến nghị có để bảo mật)
```

### 1.2 Copy Public Key lên Server

```bash
# Copy public key lên server production
ssh-copy-id -i ~/.ssh/id_rsa.pub root@103.142.137.118

# Hoặc copy thủ công
cat ~/.ssh/id_rsa.pub | ssh root@103.142.137.118 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 1.3 Test SSH Connection

```bash
# Test kết nối SSH
ssh root@103.142.137.118

# Test với key cụ thể
ssh -i ~/.ssh/id_rsa root@103.142.137.118
```

## 🔑 **Bước 2: Thêm GitHub Repository Secrets**

### 2.1 Truy cập GitHub Secrets

1. Vào repository: `https://github.com/KayStar-NJ4/turbo-chatwoot-webhook`
2. Click **Settings** tab
3. Trong sidebar trái, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2.2 Thêm các Secrets sau:

#### **PROD_HOST**
```
Name: PROD_HOST
Value: 103.142.137.118
```

#### **PROD_USER**
```
Name: PROD_USER
Value: root
```

#### **PROD_SSH_KEY**
```
Name: PROD_SSH_KEY
Value: <copy toàn bộ nội dung file ~/.ssh/id_rsa>
```

**Cách lấy nội dung private key:**
```bash
# Trên máy local
cat ~/.ssh/id_rsa

# Copy toàn bộ output (bao gồm -----BEGIN và -----END)
```

#### **PROD_PORT** (Optional)
```
Name: PROD_PORT
Value: 22
```

## ⚙️ **Bước 3: Cấu hình GitHub Organization Settings**

### 3.1 Kiểm tra Organization Permissions

1. Vào: `https://github.com/organizations/KayStar-NJ4/settings`
2. Click **Actions** → **General**
3. Đảm bảo các settings sau:
   - ✅ **Workflow permissions**: "Read and write permissions"
   - ✅ **Allow GitHub Actions to create and approve pull requests**: Checked

### 3.2 Kiểm tra Repository Settings

1. Vào: `https://github.com/KayStar-NJ4/turbo-chatwoot-webhook/settings`
2. Click **Actions** → **General**
3. Đảm bảo:
   - ✅ **Workflow permissions**: "Read and write permissions"

## 🐳 **Bước 4: Cấu hình GitHub Container Registry**

### 4.1 Kiểm tra Package Visibility

1. Vào repository → **Packages** tab
2. Đảm bảo package có visibility phù hợp
3. Kiểm tra quyền truy cập của organization

### 4.2 Test Container Registry Access

```bash
# Test login vào GHCR (trên máy local)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull image test
docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest
```

## 🚀 **Bước 5: Test CI/CD Pipeline**

### 5.1 Manual Trigger

1. Vào repository → **Actions** tab
2. Click **Deploy to Production** workflow
3. Click **Run workflow**
4. Chọn **master** branch
5. Click **Run workflow**

### 5.2 Automatic Trigger

1. Tạo commit và push lên master branch:
```bash
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin master
```

2. Vào **Actions** tab để monitor quá trình

## 📊 **Bước 6: Monitor và Debug**

### 6.1 GitHub Actions Logs

1. Vào **Actions** tab
2. Click vào workflow run mới nhất
3. Click vào từng job để xem logs chi tiết
4. Kiểm tra các bước:
   - ✅ Checkout code
   - ✅ Setup Docker Buildx
   - ✅ Login to GitHub Container Registry
   - ✅ Build and push Docker image
   - ✅ Deploy to production server

### 6.2 Server Logs

```bash
# SSH vào server
ssh root@103.142.137.118

# Kiểm tra deployment logs
cd ~/workplace/vision_lab/webhook/staging
docker-compose -f docker-compose.prod.yml logs -f

# Kiểm tra container status
docker-compose -f docker-compose.prod.yml ps

# Kiểm tra Docker images
docker images | grep turbo-chatwoot-webhook
```

## 🔧 **Troubleshooting**

### Lỗi thường gặp:

#### 1. **"denied: installation not allowed to Write organization package"**
- ✅ **Đã fix**: Thêm `permissions` vào workflow
- Kiểm tra organization settings
- Đảm bảo repository có quyền write packages

#### 2. **SSH Connection Failed**
```bash
# Kiểm tra SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Test SSH với verbose
ssh -v root@103.142.137.118
```

#### 3. **Docker Build Failed**
- Kiểm tra Dockerfile syntax
- Kiểm tra dependencies trong package.json
- Xem logs chi tiết trong GitHub Actions

#### 4. **Deployment Failed**
```bash
# Kiểm tra server resources
df -h
free -h
docker system df

# Restart Docker nếu cần
systemctl restart docker
```

## 📝 **Workflow Files Overview**

### Các workflow files trong dự án:

1. **`.github/workflows/deploy.yml`** - Production deployment
2. **`.github/workflows/cd.yml`** - Continuous Deployment
3. **`.github/workflows/cd-develop.yml`** - Develop branch deployment
4. **`.github/workflows/ci.yml`** - Continuous Integration (tests, linting)
5. **`.github/workflows/release.yml`** - Release management

### Workflow Triggers:

- **Push to master** → Deploy to production
- **Push to develop** → Deploy to develop environment
- **Create tag** → Create release
- **Manual trigger** → Workflow dispatch

## 🎯 **Next Steps**

Sau khi setup thành công:

1. **Test deployment** với commit nhỏ
2. **Configure domain** và SSL certificate
3. **Setup monitoring** và alerts
4. **Create backup strategy**
5. **Document procedures** cho team

## 📞 **Support**

Nếu gặp vấn đề:

1. Kiểm tra GitHub Actions logs
2. Kiểm tra server logs
3. Verify SSH connection
4. Check Docker và Git status trên server
5. Review troubleshooting section

---

## 🔒 **Security Best Practices**

### SSH Key Security:
- ✅ Sử dụng passphrase cho SSH key
- ✅ Rotate SSH keys định kỳ
- ✅ Sử dụng keys khác nhau cho các environments

### GitHub Security:
- ✅ Enable 2FA trên GitHub account
- ✅ Sử dụng organization secrets cho team access
- ✅ Review access permissions định kỳ

### Server Security:
- ✅ Keep server updated
- ✅ Sử dụng firewall (UFW)
- ✅ Enable fail2ban
- ✅ Regular security audits

---

**Lưu ý**: Giữ SSH private key an toàn và không bao giờ commit vào repository!
