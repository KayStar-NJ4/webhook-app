#!/bin/bash

echo "🔧 Fixing environment variables..."

# Stop all services
echo "Stopping all services..."
docker compose -f docker-compose.prod.yml down

# Check current .env file
echo "=== Current .env file ==="
if [ -f .env ]; then
    echo "DB_PORT in .env:"
    grep "DB_PORT" .env || echo "DB_PORT not found in .env"
    echo "DB_HOST in .env:"
    grep "DB_HOST" .env || echo "DB_HOST not found in .env"
else
    echo ".env file not found"
fi

# Fix .env file
echo "Fixing .env file..."
if [ -f .env ]; then
    # Backup original
    cp .env .env.backup
    
    # Fix DB_PORT
    sed -i 's/DB_PORT=5434/DB_PORT=5432/g' .env
    sed -i 's/DB_HOST=.*/DB_HOST=postgres/g' .env
    sed -i 's/DB_NAME=.*/DB_NAME=chatwoot_webhook/g' .env
    sed -i 's/DB_USER=.*/DB_USER=postgres/g' .env
    sed -i 's/REPOSITORY_TYPE=.*/REPOSITORY_TYPE=postgresql/g' .env
    
    echo "Updated .env file:"
    grep -E "(DB_|REPOSITORY_)" .env
else
    echo "Creating new .env file..."
    cat > .env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=postgres

# Repository Type
REPOSITORY_TYPE=postgresql

# Other settings
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
EOF
fi

# Remove old database volume
echo "Removing old database volume..."
docker volume rm webhook_postgres_data 2>/dev/null || echo "Volume not found"

# Start PostgreSQL first
echo "Starting PostgreSQL..."
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
sleep 30

# Create database
echo "Creating database..."
docker exec webhook-postgres-prod psql -U postgres -c "CREATE DATABASE chatwoot_webhook;" 2>/dev/null || echo "Database might already exist"

# Run initialization
echo "Running database initialization..."
docker exec -i webhook-postgres-prod psql -U postgres -d chatwoot_webhook < scripts/init-db.sql

# Start all services
echo "Starting all services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for app
echo "Waiting for app to start..."
sleep 60

# Check status
echo "=== Final Status ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Health Check ==="
if curl -f http://localhost:9090/webhook/health; then
    echo "✅ Environment fix successful!"
    echo "🎉 Deployment is working!"
else
    echo "❌ Still having issues..."
    echo "=== Debug Info ==="
    docker compose -f docker-compose.prod.yml logs --tail=20 webhook-app
fi
