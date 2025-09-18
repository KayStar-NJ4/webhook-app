#!/bin/bash

# Quick Deploy Script - One-click deployment
# Usage: ./scripts/quick-deploy.sh

set -e

# Configuration
SERVER_IP="103.142.137.118"
PROJECT_DIR="/root/workplace/vision_lab/webhook/staging"
BACKUP_DIR="/root/workplace/vision_lab/webhook/staging/backup"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if we're on the server
check_server() {
    if [[ "$(hostname -I | awk '{print $1}')" != "$SERVER_IP" ]]; then
        error "This script must be run on the production server ($SERVER_IP)"
    fi
}

# Quick setup for first-time deployment
quick_setup() {
    log "Performing quick setup..."
    
    # Create directories
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Clone repository if not exists
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log "Cloning repository..."
        cd "$PROJECT_DIR"
        git clone https://github.com/thuanpt/turbo-chatwoot-webhook.git .
    fi
    
    # Copy environment file if not exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log "Creating environment file..."
        cp "$PROJECT_DIR/env.example" "$PROJECT_DIR/.env"
        warning "Please edit .env file with your configuration before deploying!"
        echo "Run: nano $PROJECT_DIR/.env"
        exit 1
    fi
    
    success "Quick setup completed"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    cd "$PROJECT_DIR"
    
    # Pull latest code
    git fetch origin
    git reset --hard origin/master
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Run deployment
    ./scripts/deploy.sh deploy
    
    success "Application deployed successfully!"
}

# Show status
show_status() {
    log "Checking deployment status..."
    
    cd "$PROJECT_DIR"
    
    echo ""
    echo "=== Deployment Status ==="
    ./scripts/deploy.sh status
    
    echo ""
    echo "=== Quick Commands ==="
    echo "  View logs:     ./scripts/deploy.sh logs"
    echo "  Create backup: ./scripts/backup-database.sh"
    echo "  Monitor:       webhook-monitor"
    echo "  Restart:       docker-compose -f docker-compose.prod.yml restart"
    echo "  Backup dir:    $BACKUP_DIR"
    echo ""
}

# Main function
main() {
    echo "=========================================="
    echo "🚀 Turbo Chatwoot Webhook - Quick Deploy"
    echo "=========================================="
    echo ""
    
    check_server
    quick_setup
    deploy_app
    show_status
    
    echo "=========================================="
    echo "✅ Quick deployment completed!"
    echo "=========================================="
}

# Run main function
main "$@"
