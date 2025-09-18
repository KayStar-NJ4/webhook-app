#!/bin/bash

# Turbo Chatwoot Webhook - Production Setup Script
# This script helps you set up the production environment quickly

set -e

echo "🚀 Turbo Chatwoot Webhook - Production Setup"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_header "Setting up production environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are installed ✓"

# Create project directory
PROD_DIR="$HOME/workplace/vision_lab/webhook/staging"
print_header "Creating project directory: $PROD_DIR"

mkdir -p "$PROD_DIR"
cd "$PROD_DIR"

# Create necessary subdirectories
print_status "Creating necessary directories..."
mkdir -p nginx/html nginx/ssl backup logs

# Copy configuration files
print_header "Setting up configuration files..."

# Copy docker-compose.prod.yml
if [ -f "$PROJECT_DIR/docker-compose.prod.yml" ]; then
    cp "$PROJECT_DIR/docker-compose.prod.yml" .
    print_status "Copied docker-compose.prod.yml"
else
    print_error "docker-compose.prod.yml not found in project directory"
    exit 1
fi

# Copy environment template
if [ -f "$PROJECT_DIR/env.production.template" ]; then
    cp "$PROJECT_DIR/env.production.template" .env
    print_status "Copied environment template to .env"
    print_warning "Please edit .env file with your actual configuration values"
else
    print_error "env.production.template not found in project directory"
    exit 1
fi

# Copy Nginx configuration
if [ -f "$PROJECT_DIR/nginx/nginx.prod.conf" ]; then
    cp "$PROJECT_DIR/nginx/nginx.prod.conf" nginx/nginx.conf
    print_status "Copied Nginx configuration"
    print_warning "Please update nginx/nginx.conf with your domain name"
else
    print_error "nginx/nginx.prod.conf not found in project directory"
    exit 1
fi

# Check if user is in docker group
if ! groups $USER | grep -q '\bdocker\b'; then
    print_warning "User $USER is not in the docker group"
    print_warning "You may need to run: sudo usermod -aG docker $USER"
    print_warning "Then logout and login again"
fi

print_header "Configuration files created successfully!"

# Display next steps
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Edit the .env file with your actual configuration:"
echo "   nano .env"
echo ""
echo "2. Update Nginx configuration with your domain:"
echo "   nano nginx/nginx.conf"
echo ""
echo "3. Login to GitHub Container Registry:"
echo "   echo 'YOUR_GITHUB_TOKEN' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""
echo "4. Pull the latest Docker image:"
echo "   docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest"
echo ""
echo "5. Start the services:"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "6. Run database migrations:"
echo "   docker compose -f docker-compose.prod.yml exec -T webhook-app yarn migrate"
echo ""
echo "7. Check the health endpoint:"
echo "   curl -f http://localhost:3000/webhook/health"
echo ""
echo "📖 For detailed instructions, see: MANUAL_DEPLOYMENT_GUIDE.md"
echo ""

print_status "Setup completed! 🎉"
