# GitHub Secrets Setup Guide

Hướng dẫn setup GitHub Secrets để CI/CD hoạt động tự động.

## 🔐 Required Secrets

Thêm các secrets sau vào GitHub repository:

### 1. Repository Secrets

Vào **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### PROD_HOST
```
Name: PROD_HOST
Value: 103.142.137.118
```

#### PROD_USER
```
Name: PROD_USER
Value: root
```

#### PROD_SSH_KEY
```
Name: PROD_SSH_KEY
Value: <your_private_ssh_key_content>
```

#### PROD_PORT (Optional)
```
Name: PROD_PORT
Value: 22
```

## 🔑 SSH Key Setup

### 1. Generate SSH Key Pair

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "deploy@yourdomain.com"

# This will create:
# ~/.ssh/id_rsa (private key)
# ~/.ssh/id_rsa.pub (public key)
```

### 2. Copy Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@103.142.137.118

# Or manually add to authorized_keys
cat ~/.ssh/id_rsa.pub | ssh root@103.142.137.118 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Add Private Key to GitHub Secrets

```bash
# Copy private key content
cat ~/.ssh/id_rsa

# Add the entire content (including -----BEGIN and -----END lines) to PROD_SSH_KEY secret
```

## 🧪 Test SSH Connection

```bash
# Test SSH connection
ssh root@103.142.137.118

# Test with specific key
ssh -i ~/.ssh/id_rsa root@103.142.137.118
```

## 🚀 Test CI/CD Pipeline

### 1. Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select **master** branch
5. Click **Run workflow**

### 2. Automatic Trigger

1. Make a commit to master branch
2. Push to repository
3. Check **Actions** tab for deployment progress

## 📊 Monitor Deployment

### GitHub Actions Logs
- Go to **Actions** tab
- Click on the latest workflow run
- View logs for each step

### Server Logs
```bash
# SSH to server
ssh root@103.142.137.118

# Check deployment logs
tail -f /var/log/webhook-deploy.log

# Check container status
cd /root/workplace/vision_lab/webhook/staging
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Test SSH connection
ssh -v root@103.142.137.118
```

#### 2. Permission Denied
```bash
# Check server permissions
ls -la /root/workplace/vision_lab/webhook/staging

# Fix permissions if needed
chown -R root:root /root/workplace/vision_lab/webhook/
chmod -R 755 /root/workplace/vision_lab/webhook/
```

#### 3. Docker Issues
```bash
# Check Docker status
systemctl status docker

# Restart Docker if needed
systemctl restart docker

# Check Docker Compose
docker-compose --version
```

#### 4. Git Issues
```bash
# Check git status
cd /root/workplace/vision_lab/webhook/staging
git status

# Reset if needed
git fetch origin
git reset --hard origin/master
```

## 📝 Security Best Practices

### 1. SSH Key Security
- Use strong passphrase for SSH key
- Regularly rotate SSH keys
- Use different keys for different environments

### 2. Server Security
- Keep server updated
- Use firewall (UFW)
- Enable fail2ban
- Regular security audits

### 3. GitHub Security
- Enable 2FA on GitHub account
- Use organization secrets for team access
- Regularly review access permissions

## 🎯 Next Steps

After setting up secrets:

1. **Test deployment** with manual trigger
2. **Configure domain** and SSL certificate
3. **Setup monitoring** and alerts
4. **Create backup strategy**
5. **Document procedures** for team

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs
2. Check server logs: `/var/log/webhook-deploy.log`
3. Verify SSH connection manually
4. Check Docker and Git status on server
5. Review this guide for common solutions

---

**Note**: Keep your SSH private key secure and never commit it to the repository!
