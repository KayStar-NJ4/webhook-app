#!/bin/bash

# Fix database issues for webhook deployment
echo "🔧 Fixing database issues..."

# Stop the webhook app first
echo "Stopping webhook app..."
docker compose -f docker-compose.prod.yml stop webhook-app

# Create the database manually
echo "Creating database 'chatwoot_webhook'..."
docker exec webhook-postgres-prod psql -U postgres -c "CREATE DATABASE chatwoot_webhook;" 2>/dev/null || echo "Database might already exist"

# Run the initialization script
echo "Running database initialization..."
docker exec -i webhook-postgres-prod psql -U postgres -d chatwoot_webhook < scripts/init-db.sql

# Start the webhook app
echo "Starting webhook app..."
docker compose -f docker-compose.prod.yml start webhook-app

# Wait a bit and check status
echo "Waiting for app to start..."
sleep 30

echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Health Check ==="
if curl -f http://localhost:9090/webhook/health; then
  echo "✅ Database fix successful - Health check passed"
else
  echo "❌ Still having issues - checking logs..."
  docker compose -f docker-compose.prod.yml logs --tail=20 webhook-app
fi
