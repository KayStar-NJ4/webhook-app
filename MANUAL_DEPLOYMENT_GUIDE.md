# Manual Deployment Guide

This guide will help you manually deploy the Turbo Chatwoot Webhook application to your production server.

## Prerequisites

- Ubuntu/Debian server with Docker and Docker Compose installed
- SSH access to your server
- GitHub Container Registry access (for pulling the Docker image)

## Step 1: Server Preparation

### 1.1 Create Project Directory

```bash
# Create the project directory
mkdir -p ~/workplace/vision_lab/webhook/staging
cd ~/workplace/vision_lab/webhook/staging

# Create necessary subdirectories
mkdir -p nginx/html nginx/ssl backup logs
```

### 1.2 Install Docker and Docker Compose (if not already installed)

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

## Step 2: Create Configuration Files

### 2.1 Create Docker Compose File

Create `docker-compose.prod.yml`:

```yaml
services:
  webhook-app:
    image: ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest
    container_name: turbo-chatwoot-webhook-prod
    environment:
      - NODE_ENV=production
      - REPOSITORY_TYPE=redis
      - PORT=3000
      - HOSTNAME=0.0.0.0
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs:rw
      - ./backup:/app/backup:rw
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    depends_on:
      - redis
      - postgres
    networks:
      - webhook-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/webhook/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: webhook-redis-prod
    ports:
      - "127.0.0.1:6381:6379"
    volumes:
      - redis_data:/data
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - webhook-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:16-alpine
    container_name: webhook-postgres-prod
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      - POSTGRES_DB=chatwoot_webhook
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=Turbo@2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    networks:
      - webhook-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d chatwoot_webhook"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  redis_data:
    driver: local
  postgres_data:
    driver: local

networks:
  webhook-network:
    driver: bridge
```

### 2.2 Create Environment File

Create `.env` file with the following content:

```env
# Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
LOG_LEVEL=info

# JWT Configuration
JWT_SECRET=TurboChatwootWebhook2025SecretKeyForJWTTokenGeneration

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=Turbo@2025
DB_SSL=false

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Chatwoot Integration
CHATWOOT_API_URL=https://your-chatwoot-instance.com
CHATWOOT_ACCESS_TOKEN=your_chatwoot_access_token
CHATWOOT_ACCOUNT_ID=your_account_id

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_key
WEBHOOK_URL=https://your-domain.com/webhook

# Security
CORS_ORIGIN=https://your-chatwoot-instance.com
```

**Important:** Update the following values in your `.env` file:
- `CHATWOOT_API_URL`: Your Chatwoot instance URL
- `CHATWOOT_ACCESS_TOKEN`: Your Chatwoot access token
- `CHATWOOT_ACCOUNT_ID`: Your Chatwoot account ID
- `WEBHOOK_SECRET`: A secure secret key for webhook validation
- `WEBHOOK_URL`: Your webhook endpoint URL
- `CORS_ORIGIN`: Your Chatwoot instance URL for CORS

## Step 3: Deploy the Application

### 3.1 Login to GitHub Container Registry

```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3.2 Pull the Latest Docker Image

```bash
# Pull the latest image
docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest
```

### 3.3 Start the Services

```bash
# Start PostgreSQL first
echo "Starting PostgreSQL..."
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 30

# Create database (if it doesn't exist)
echo "Creating database..."
docker exec webhook-postgres-prod psql -U postgres -c "CREATE DATABASE chatwoot_webhook;" 2>/dev/null || echo "Database might already exist"

# Start all containers
echo "Starting all containers..."
docker compose -f docker-compose.prod.yml up -d
```

### 3.4 Run Database Migrations

```bash
# Wait for the webhook app to start
sleep 30

# Run database migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T webhook-app yarn migrate

# Run database seeding (if needed)
echo "Running database seeding..."
docker compose -f docker-compose.prod.yml exec -T webhook-app yarn seed
```

## Step 4: Configure Nginx (Optional)

If you want to use Nginx as a reverse proxy, create an Nginx configuration:

### 4.1 Create Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream webhook_app {
        server webhook-app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://webhook_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /webhook/health {
            proxy_pass http://webhook_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4.2 Add Nginx to Docker Compose

Add this service to your `docker-compose.prod.yml`:

```yaml
  nginx:
    image: nginx:stable-alpine
    container_name: webhook-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - webhook-app
    networks:
      - webhook-network
    restart: unless-stopped
```

## Step 5: Verify Deployment

### 5.1 Check Container Status

```bash
# Check if all containers are running
docker compose -f docker-compose.prod.yml ps

# Check container logs
docker compose -f docker-compose.prod.yml logs --tail=50
```

### 5.2 Health Check

```bash
# Test health endpoint
curl -f http://localhost:3000/webhook/health

# Or if using Nginx
curl -f http://your-domain.com/webhook/health
```

### 5.3 Test Webhook Endpoint

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/webhook/chatwoot \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Step 6: Monitoring and Maintenance

### 6.1 View Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# View specific service logs
docker compose -f docker-compose.prod.yml logs webhook-app
docker compose -f docker-compose.prod.yml logs redis
docker compose -f docker-compose.prod.yml logs postgres
```

### 6.2 Update Application

```bash
# Pull latest image
docker pull ghcr.io/kaystar-nj4/turbo-chatwoot-webhook:latest

# Restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec -T webhook-app yarn migrate
```

### 6.3 Backup Database

```bash
# Create backup
docker exec webhook-postgres-prod pg_dump -U postgres chatwoot_webhook > backup/chatwoot_webhook_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i webhook-postgres-prod psql -U postgres chatwoot_webhook < backup/your_backup_file.sql
```

## Troubleshooting

### Common Issues

1. **Container not starting**: Check logs with `docker compose -f docker-compose.prod.yml logs webhook-app`

2. **Database connection issues**: Ensure PostgreSQL is running and accessible

3. **Permission issues**: Check file permissions and Docker group membership

4. **Port conflicts**: Ensure ports 3000, 5432, and 6381 are not in use

### Useful Commands

```bash
# Restart specific service
docker compose -f docker-compose.prod.yml restart webhook-app

# Stop all services
docker compose -f docker-compose.prod.yml down

# Remove all containers and volumes (WARNING: This will delete data)
docker compose -f docker-compose.prod.yml down -v

# Clean up unused Docker resources
docker system prune -f
```

## Security Considerations

1. **Change default passwords** in the `.env` file
2. **Use HTTPS** in production with proper SSL certificates
3. **Restrict database access** to only necessary IPs
4. **Regular security updates** for the base images
5. **Monitor logs** for suspicious activities

## Support

If you encounter any issues during deployment, please check:
1. Container logs for error messages
2. Network connectivity between services
3. Environment variable configuration
4. Database and Redis connectivity

For additional support, refer to the project documentation or create an issue in the repository.
