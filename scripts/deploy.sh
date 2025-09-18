#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh [backup|rollback|status|logs]

set -e

# Configuration
PROJECT_DIR="/root/workplace/vision_lab/webhook/staging"
BACKUP_DIR="/root/workplace/vision_lab/webhook/staging/backup"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/var/log/webhook-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$PROJECT_DIR/logs"
    success "Directories created"
}

# Backup current deployment
backup_deployment() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating backup: $backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup docker-compose file
    if [ -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ]; then
        cp "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" "$backup_path/"
    fi
    
    # Backup environment file
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$backup_path/"
    fi
    
    # Backup nginx config
    if [ -d "$PROJECT_DIR/nginx" ]; then
        cp -r "$PROJECT_DIR/nginx" "$backup_path/"
    fi
    
    # Backup database (if using local postgres)
    if docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log "Backing up PostgreSQL database..."
        docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres chatwoot_webhook > "$backup_path/database.sql"
    fi
    
    # Backup Redis data
    if docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ps redis | grep -q "Up"; then
        log "Backing up Redis data..."
        docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" exec -T redis redis-cli --rdb - > "$backup_path/redis.rdb"
    fi
    
    # Create backup metadata
    cat > "$backup_path/backup-info.txt" << EOF
Backup created: $(date)
Git commit: $(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")
Docker images:
$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep webhook || echo "No webhook images found")
EOF
    
    success "Backup created: $backup_path"
    echo "$backup_name"
}

# Deploy new version
deploy() {
    log "Starting deployment..."
    
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    # Create backup before deployment
    backup_name=$(backup_deployment)
    
    # Pull latest Docker image (chứa source code)
    log "Pulling latest Docker image..."
    docker pull ghcr.io/thuanpt/turbo-chatwoot-webhook:latest
    
    # Stop existing containers gracefully
    log "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T webhook-app yarn migrate || warning "Migration failed or not needed"
    
    # Health check
    log "Performing health check..."
    if curl -f http://localhost:7070/health > /dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed - deployment may have issues"
    fi
    
    # Clean up old images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Clean up old backups (keep last 30 days)
    log "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "webhook_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    
    success "Deployment completed successfully!"
    log "Backup created: $backup_name"
}

# Rollback to previous version
rollback() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        log "Available backups:"
        ls -la "$BACKUP_DIR" | grep webhook_ | awk '{print $9}'
        error "Please specify backup name: ./scripts/deploy.sh rollback <backup-name>"
    fi
    
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        error "Backup not found: $backup_path"
    fi
    
    log "Rolling back to: $backup_name"
    
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    # Stop current containers
    log "Stopping current containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Restore files
    log "Restoring files from backup..."
    if [ -f "$backup_path/$DOCKER_COMPOSE_FILE" ]; then
        cp "$backup_path/$DOCKER_COMPOSE_FILE" ./
    fi
    
    if [ -f "$backup_path/.env" ]; then
        cp "$backup_path/.env" ./
    fi
    
    if [ -d "$backup_path/nginx" ]; then
        cp -r "$backup_path/nginx" ./
    fi
    
    # Restore database if backup exists
    if [ -f "$backup_path/database.sql" ]; then
        log "Restoring database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d chatwoot_webhook < "$backup_path/database.sql"
    fi
    
    # Start containers
    log "Starting containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Health check
    log "Performing health check..."
    sleep 30
    if curl -f http://localhost:7070/health > /dev/null 2>&1; then
        success "Rollback completed successfully!"
    else
        error "Rollback failed - health check failed"
    fi
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo "=================="
    
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    # Git status
    echo "Git Status:"
    git log --oneline -5
    echo ""
    
    # Docker status
    echo "Docker Containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
    
    # Health check
    echo "Health Check:"
    if curl -f http://localhost:7070/health > /dev/null 2>&1; then
        success "✅ Service is healthy"
    else
        error "❌ Service is unhealthy"
    fi
    echo ""
    
    # Disk usage
    echo "Disk Usage:"
    df -h "$PROJECT_DIR"
    echo ""
    
    # Recent logs
    echo "Recent Logs (last 20 lines):"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20
}

# Show logs
show_logs() {
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    if [ -n "$1" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f "$1"
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# Main script logic
main() {
    check_root
    setup_directories
    
    case "${1:-deploy}" in
        "backup")
            backup_deployment
            ;;
        "rollback")
            rollback "$2"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "deploy")
            deploy
            ;;
        *)
            echo "Usage: $0 [deploy|backup|rollback|status|logs]"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy new version (default)"
            echo "  backup   - Create backup of current deployment"
            echo "  rollback - Rollback to previous version"
            echo "  status   - Show deployment status"
            echo "  logs     - Show container logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
