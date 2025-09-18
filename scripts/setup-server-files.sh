#!/bin/bash

# Setup Server Files Script
# Chỉ clone những file cần thiết cho server, không clone source code

set -e

# Configuration
PROJECT_DIR="/root/workplace/vision_lab/webhook/staging"
REPO_URL="https://github.com/thuanpt/turbo-chatwoot-webhook.git"

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

# Create project directory
create_directory() {
    log "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    success "Project directory created: $PROJECT_DIR"
}

# Clone only necessary files
clone_necessary_files() {
    log "Cloning only necessary files..."
    
    # Initialize git repository
    git init
    
    # Add remote
    git remote add origin "$REPO_URL"
    
    # Fetch only specific files
    git config core.sparseCheckout true
    
    # Define sparse checkout patterns (only files needed on server)
    cat > .git/info/sparse-checkout << 'EOF'
# Docker configuration
docker-compose.prod.yml
Dockerfile

# Environment template
env.example

# Nginx configuration
nginx/
nginx/nginx.prod.conf

# Scripts
scripts/
scripts/deploy.sh
scripts/backup-database.sh
scripts/setup-server.sh
scripts/quick-deploy.sh
scripts/setup-github-secrets.md

# Documentation
DEPLOYMENT.md
SETUP_COMPLETE.md

# Package files (for Docker build)
package.json
yarn.lock

# GitHub Actions (for reference)
.github/workflows/deploy.yml
EOF
    
    # Pull only the necessary files
    git pull origin master
    
    success "Necessary files cloned successfully"
}

# Create backup directory
create_backup_directory() {
    log "Creating backup directory..."
    mkdir -p "$PROJECT_DIR/backup"
    success "Backup directory created"
}

# Set permissions
set_permissions() {
    log "Setting permissions..."
    chmod +x scripts/*.sh
    chown -R root:root "$PROJECT_DIR"
    success "Permissions set"
}

# Show summary
show_summary() {
    log "Server files setup completed!"
    echo ""
    echo "=========================================="
    echo "📁 Files on server:"
    echo "=========================================="
    echo ""
    echo "Docker Configuration:"
    echo "  ✅ docker-compose.prod.yml"
    echo "  ✅ Dockerfile"
    echo ""
    echo "Scripts:"
    echo "  ✅ scripts/deploy.sh"
    echo "  ✅ scripts/backup-database.sh"
    echo "  ✅ scripts/setup-server.sh"
    echo "  ✅ scripts/quick-deploy.sh"
    echo ""
    echo "Configuration:"
    echo "  ✅ env.example"
    echo "  ✅ nginx/nginx.prod.conf"
    echo ""
    echo "Documentation:"
    echo "  ✅ DEPLOYMENT.md"
    echo "  ✅ SETUP_COMPLETE.md"
    echo ""
    echo "Directories:"
    echo "  ✅ backup/"
    echo "  ✅ nginx/"
    echo "  ✅ scripts/"
    echo ""
    echo "❌ Source code (src/) - NOT cloned"
    echo "❌ Frontend files (public/) - NOT cloned"
    echo "❌ Development files - NOT cloned"
    echo ""
    echo "=========================================="
    echo "🎯 Next steps:"
    echo "=========================================="
    echo "1. Copy environment file:"
    echo "   cp env.example .env"
    echo ""
    echo "2. Edit environment variables:"
    echo "   nano .env"
    echo ""
    echo "3. Deploy application:"
    echo "   ./scripts/deploy.sh deploy"
    echo ""
    echo "4. Setup GitHub Secrets for CI/CD"
    echo ""
    echo "=========================================="
}

# Main function
main() {
    echo "=========================================="
    echo "🚀 Setting up server files (Docker only)"
    echo "=========================================="
    echo ""
    echo "This script will clone only the necessary files"
    echo "for Docker deployment, NOT the source code."
    echo ""
    
    create_directory
    clone_necessary_files
    create_backup_directory
    set_permissions
    show_summary
}

# Run main function
main "$@"
