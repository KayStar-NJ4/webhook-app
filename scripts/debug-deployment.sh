#!/bin/bash

echo "🔍 Debugging deployment issues..."

echo "=== 1. Check container network ==="
docker network ls
docker network inspect webhook-network 2>/dev/null || echo "Network not found"

echo "=== 2. Check PostgreSQL container ==="
docker exec webhook-postgres-prod psql -U postgres -c "SELECT version();" 2>/dev/null || echo "Cannot connect to PostgreSQL"

echo "=== 3. Check if database exists ==="
docker exec webhook-postgres-prod psql -U postgres -c "\l" 2>/dev/null | grep chatwoot_webhook || echo "Database chatwoot_webhook not found"

echo "=== 4. Check webhook app environment ==="
docker exec turbo-chatwoot-webhook-prod env | grep -E "(DB_|POSTGRES_)" 2>/dev/null || echo "Cannot get environment variables"

echo "=== 5. Test database connection from webhook app ==="
docker exec turbo-chatwoot-webhook-prod nc -zv postgres 5432 2>/dev/null || echo "Cannot connect to postgres:5432"

echo "=== 6. Check logs ==="
echo "PostgreSQL logs:"
docker logs webhook-postgres-prod --tail=10

echo "Webhook app logs:"
docker logs turbo-chatwoot-webhook-prod --tail=10
