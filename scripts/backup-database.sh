#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-database.sh

set -e

# Configuration
PROJECT_DIR="/root/workplace/vision_lab/webhook/staging"
BACKUP_DIR="/root/workplace/vision_lab/webhook/staging/backup"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/var/log/webhook-backup.log"

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

# Create backup directory
setup_directories() {
    log "Setting up backup directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    success "Backup directories created"
}

# Backup PostgreSQL database
backup_postgres() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Starting PostgreSQL backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    # Check if PostgreSQL container is running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps postgres | grep -q "Up"; then
        warning "PostgreSQL container is not running, skipping database backup"
        return 0
    fi
    
    # Backup database
    log "Backing up PostgreSQL database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres -d chatwoot_webhook --verbose --no-password > "$backup_path/database.sql" 2>>"$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        success "PostgreSQL backup completed: $backup_path/database.sql"
    else
        error "PostgreSQL backup failed"
    fi
    
    # Compress backup
    log "Compressing database backup..."
    gzip "$backup_path/database.sql"
    
    # Get database size
    local db_size=$(du -h "$backup_path/database.sql.gz" | cut -f1)
    log "Database backup size: $db_size"
}

# Backup Redis data
backup_redis() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Starting Redis backup: $backup_name"
    
    cd "$PROJECT_DIR" || error "Cannot access project directory: $PROJECT_DIR"
    
    # Check if Redis container is running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps redis | grep -q "Up"; then
        warning "Redis container is not running, skipping Redis backup"
        return 0
    fi
    
    # Backup Redis data
    log "Backing up Redis data..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli --rdb - > "$backup_path/redis.rdb" 2>>"$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        success "Redis backup completed: $backup_path/redis.rdb"
    else
        warning "Redis backup failed, trying alternative method..."
        # Alternative method: save Redis data
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli BGSAVE
        sleep 5
        docker cp "$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis):/data/dump.rdb" "$backup_path/redis.rdb"
    fi
    
    # Compress backup
    log "Compressing Redis backup..."
    gzip "$backup_path/redis.rdb"
    
    # Get Redis size
    local redis_size=$(du -h "$backup_path/redis.rdb.gz" | cut -f1)
    log "Redis backup size: $redis_size"
}

# Backup application files
backup_application() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Backing up application files..."
    
    # Backup environment file
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$backup_path/"
        log "Environment file backed up"
    fi
    
    # Backup docker-compose file
    if [ -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ]; then
        cp "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" "$backup_path/"
        log "Docker Compose file backed up"
    fi
    
    # Backup nginx config
    if [ -d "$PROJECT_DIR/nginx" ]; then
        cp -r "$PROJECT_DIR/nginx" "$backup_path/"
        log "Nginx configuration backed up"
    fi
    
    # Backup logs (last 7 days)
    if [ -d "$PROJECT_DIR/logs" ]; then
        mkdir -p "$backup_path/logs"
        find "$PROJECT_DIR/logs" -name "*.log" -mtime -7 -exec cp {} "$backup_path/logs/" \;
        log "Application logs backed up"
    fi
}

# Create backup metadata
create_backup_metadata() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating backup metadata..."
    
    # Create backup info file
    cat > "$backup_path/backup-info.txt" << EOF
Backup Information
==================
Backup Name: $backup_name
Created: $(date)
Created by: $(whoami)
Server: $(hostname)
IP: $(hostname -I | awk '{print $1}')

Git Information:
- Repository: $(cd "$PROJECT_DIR" && git remote get-url origin 2>/dev/null || echo "unknown")
- Commit: $(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")
- Branch: $(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
- Last commit: $(cd "$PROJECT_DIR" && git log -1 --pretty=format:"%h - %an, %ar : %s" 2>/dev/null || echo "unknown")

Docker Information:
- Docker version: $(docker --version)
- Docker Compose version: $(docker-compose --version)

Container Status:
$(docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ps 2>/dev/null || echo "Docker Compose not available")

System Information:
- OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -a)
- Kernel: $(uname -r)
- Architecture: $(uname -m)
- Memory: $(free -h | grep Mem | awk '{print $2}')
- Disk: $(df -h / | tail -1 | awk '{print $2}')

Backup Contents:
$(ls -la "$backup_path" 2>/dev/null || echo "No contents")

Backup Sizes:
$(du -sh "$backup_path"/* 2>/dev/null || echo "No files")
EOF
    
    success "Backup metadata created"
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 30 days)..."
    
    # Remove backups older than 30 days
    find "$BACKUP_DIR" -name "webhook_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    
    # Count remaining backups
    local backup_count=$(find "$BACKUP_DIR" -name "webhook_*" -type d | wc -l)
    log "Remaining backups: $backup_count"
    
    # Show disk usage
    local backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log "Total backup size: $backup_size"
}

# Verify backup integrity
verify_backup() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Verifying backup integrity..."
    
    # Check if backup directory exists
    if [ ! -d "$backup_path" ]; then
        error "Backup directory not found: $backup_path"
    fi
    
    # Check if database backup exists and is not empty
    if [ -f "$backup_path/database.sql.gz" ]; then
        local db_size=$(stat -c%s "$backup_path/database.sql.gz")
        if [ $db_size -gt 0 ]; then
            success "Database backup verified: $db_size bytes"
        else
            error "Database backup is empty"
        fi
    else
        warning "Database backup not found"
    fi
    
    # Check if Redis backup exists and is not empty
    if [ -f "$backup_path/redis.rdb.gz" ]; then
        local redis_size=$(stat -c%s "$backup_path/redis.rdb.gz")
        if [ $redis_size -gt 0 ]; then
            success "Redis backup verified: $redis_size bytes"
        else
            warning "Redis backup is empty"
        fi
    else
        warning "Redis backup not found"
    fi
    
    success "Backup verification completed"
}

# Send notification (if configured)
send_notification() {
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    local backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1)
    
    log "Backup completed successfully!"
    log "Backup name: $backup_name"
    log "Backup size: $backup_size"
    log "Backup location: $backup_path"
    
    # You can add email/Slack notification here if needed
    # Example:
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"✅ Database backup completed: $backup_name ($backup_size)\"}" \
    #     "$SLACK_WEBHOOK_URL"
}

# Main backup function
main() {
    log "Starting database backup process..."
    
    check_root
    setup_directories
    
    # Create backup with timestamp
    local backup_name="webhook_$(date +%d_%m_%Y)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Check if backup already exists for today
    if [ -d "$backup_path" ]; then
        warning "Backup for today already exists: $backup_name"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Backup cancelled"
            exit 0
        fi
        rm -rf "$backup_path"
    fi
    
    # Perform backups
    backup_postgres
    backup_redis
    backup_application
    create_backup_metadata
    verify_backup
    cleanup_old_backups
    send_notification
    
    success "Database backup completed successfully!"
    log "Backup location: $backup_path"
}

# Run main function
main "$@"
