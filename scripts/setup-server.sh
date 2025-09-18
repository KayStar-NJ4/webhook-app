#!/bin/bash

# Server Setup Script for Production Deployment
# Usage: ./scripts/setup-server.sh

set -e

# Configuration
SERVER_IP="103.142.137.118"
PROJECT_DIR="/root/workplace/vision_lab/webhook/staging"
BACKUP_DIR="/root/workplace/vision_lab/webhook/staging/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    success "System packages updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install dependencies
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group
    usermod -aG docker $USER
    
    success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make executable
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
}

# Install additional tools
install_tools() {
    log "Installing additional tools..."
    
    apt install -y \
        git \
        curl \
        wget \
        unzip \
        htop \
        nano \
        vim \
        ufw \
        certbot \
        python3-certbot-nginx \
        nginx \
        fail2ban \
        logrotate
    
    success "Additional tools installed"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW
    ufw --force reset
    
    # Set defaults
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
# Allow HTTP and HTTPS
ufw allow 7070/tcp
ufw allow 7071/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Configure fail2ban
configure_fail2ban() {
    log "Configuring fail2ban..."
    
    # Create jail.local
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    success "Fail2ban configured"
}

# Create project directories
create_directories() {
    log "Creating project directories..."
    
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "/var/log/webhook"
    
    # Set permissions
    chown -R root:root /root/workplace/
    chmod -R 755 /root/workplace/
    
    success "Project directories created"
}

# Configure log rotation
configure_log_rotation() {
    log "Configuring log rotation..."
    
    cat > /etc/logrotate.d/webhook << EOF
/var/log/webhook/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /bin/kill -USR1 \$(cat /var/run/nginx.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF
    
    success "Log rotation configured"
}

# Configure system limits
configure_limits() {
    log "Configuring system limits..."
    
    cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF
    
    cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
    
    sysctl -p
    
    success "System limits configured"
}

# Install monitoring tools
install_monitoring() {
    log "Installing monitoring tools..."
    
    # Install htop, iotop, nethogs
    apt install -y htop iotop nethogs
    
    # Create monitoring script
    cat > /usr/local/bin/webhook-monitor << 'EOF'
#!/bin/bash

echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Disk Usage ==="
df -h
echo ""

echo "=== Docker Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=== Service Health ==="
curl -s http://localhost/health || echo "Health check failed"
echo ""

echo "=== Recent Logs ==="
docker-compose -f /root/workplace/vision_lab/webhook/staging/docker-compose.prod.yml logs --tail=10
EOF
    
    chmod +x /usr/local/bin/webhook-monitor
    
    success "Monitoring tools installed"
}

# Create systemd service for auto-start
create_systemd_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/webhook.service << EOF
[Unit]
Description=Turbo Chatwoot Webhook
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable webhook.service
    
    success "Systemd service created"
}

# Setup cron jobs
setup_cron() {
    log "Setting up cron jobs..."
    
    # Create cron script
    cat > /usr/local/bin/webhook-cron << 'EOF'
#!/bin/bash

# Daily database backup at 00:00
/root/workplace/vision_lab/webhook/staging/scripts/backup-database.sh

# Clean old logs
find /var/log/webhook -name "*.log" -mtime +30 -delete

# Clean old Docker images
docker image prune -f

# Update system packages (weekly)
if [ $(date +%u) -eq 1 ]; then
    apt update && apt upgrade -y
fi
EOF
    
    chmod +x /usr/local/bin/webhook-cron
    
    # Add to crontab - Database backup at 00:00 daily
    (crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/webhook-cron") | crontab -
    
    success "Cron jobs configured - Database backup scheduled at 00:00 daily"
}

# Main setup function
main() {
    log "Starting server setup for Turbo Chatwoot Webhook..."
    
    check_root
    update_system
    install_docker
    install_docker_compose
    install_tools
    configure_firewall
    configure_fail2ban
    create_directories
    configure_log_rotation
    configure_limits
    install_monitoring
    create_systemd_service
    setup_cron
    
    success "Server setup completed successfully!"
    
    echo ""
    echo "=========================================="
    echo "🎉 Server setup completed!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Clone your repository:"
    echo "   cd $PROJECT_DIR"
    echo "   git clone https://github.com/thuanpt/turbo-chatwoot-webhook.git ."
    echo ""
    echo "2. Configure environment variables:"
    echo "   cp env.example .env"
    echo "   nano .env"
    echo ""
    echo "3. Run initial deployment:"
    echo "   ./scripts/deploy.sh deploy"
    echo ""
    echo "4. Setup SSL certificate:"
    echo "   certbot --nginx -d yourdomain.com"
    echo ""
    echo "5. Configure GitHub Secrets for CI/CD:"
    echo "   - PROD_HOST: $SERVER_IP"
    echo "   - PROD_USER: root"
    echo "   - PROD_SSH_KEY: <your_private_ssh_key>"
    echo ""
    echo "Useful commands:"
    echo "  - Monitor: webhook-monitor"
    echo "  - Deploy: ./scripts/deploy.sh deploy"
    echo "  - Backup: ./scripts/deploy.sh backup"
    echo "  - Status: ./scripts/deploy.sh status"
    echo "  - Logs: ./scripts/deploy.sh logs"
    echo ""
    echo "=========================================="
}

# Run main function
main "$@"
