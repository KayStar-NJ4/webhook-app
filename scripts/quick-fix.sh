#!/bin/bash

echo "🚀 Quick fix for deployment issues..."

# Stop all services
echo "Stopping all services..."
docker compose -f docker-compose.prod.yml down

# Remove old volumes to start fresh
echo "Removing old database volume..."
docker volume rm webhook_postgres_data 2>/dev/null || echo "Volume not found"

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 30

# Check if database was created
echo "Checking database..."
docker exec webhook-postgres-prod psql -U postgres -c "\l" | grep chatwoot_webhook

if [ $? -ne 0 ]; then
    echo "Creating database manually..."
    docker exec webhook-postgres-prod psql -U postgres -c "CREATE DATABASE chatwoot_webhook;"
    
    echo "Running initialization script..."
    docker exec -i webhook-postgres-prod psql -U postgres -d chatwoot_webhook < scripts/init-db.sql
fi

# Wait for app to start
echo "Waiting for app to start..."
sleep 30

# Check status
echo "=== Final Status ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Health Check ==="
if curl -f http://localhost:9090/webhook/health; then
    echo "✅ Quick fix successful!"
else
    echo "❌ Still having issues..."
    docker compose -f docker-compose.prod.yml logs --tail=20
fi
