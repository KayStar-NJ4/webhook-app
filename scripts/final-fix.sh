#!/bin/bash

echo "🚀 Final fix for deployment issues..."

# Stop all services
echo "Stopping all services..."
docker compose -f docker-compose.prod.yml down

# Remove old database volume to start fresh
echo "Removing old database volume..."
docker volume rm webhook_postgres_data 2>/dev/null || echo "Volume not found"

# Start PostgreSQL first
echo "Starting PostgreSQL..."
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 30

# Check if PostgreSQL is running
echo "Checking PostgreSQL status..."
docker exec webhook-postgres-prod psql -U postgres -c "SELECT version();" 2>/dev/null || {
    echo "❌ PostgreSQL not ready, waiting more..."
    sleep 30
}

# Create database manually
echo "Creating database 'chatwoot_webhook'..."
docker exec webhook-postgres-prod psql -U postgres -c "CREATE DATABASE chatwoot_webhook;" 2>/dev/null || echo "Database might already exist"

# Run initialization script
echo "Running database initialization..."
docker exec -i webhook-postgres-prod psql -U postgres -d chatwoot_webhook < scripts/init-db.sql

# Start all services
echo "Starting all services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for app to start
echo "Waiting for app to start..."
sleep 60

# Check status
echo "=== Final Status ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Health Check ==="
if curl -f http://localhost:9090/webhook/health; then
    echo "✅ Final fix successful!"
    echo "🎉 Deployment is working!"
else
    echo "❌ Still having issues..."
    echo "=== Debug Info ==="
    docker compose -f docker-compose.prod.yml logs --tail=20 webhook-app
    docker compose -f docker-compose.prod.yml logs --tail=10 postgres
fi
