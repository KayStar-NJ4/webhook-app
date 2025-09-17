# 🐳 Docker & CI/CD Setup

## 🚀 Quick Start

```bash
# Development
yarn docker:dev

# Production
yarn docker:prod
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Backend API   │    │     Redis       │
│   Port 80/443   │◄──►│   Port 3000     │◄──►│   Port 6379     │
│  (Frontend +    │    │   (Node.js)     │    │   (Cache)       │
│   Reverse Proxy)│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   PostgreSQL    │
│  (Admin Panel)  │    │   Port 5432     │
│  (Static Files) │    │   (Database)    │
└─────────────────┘    └─────────────────┘
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost/admin | Admin panel |
| **API** | http://localhost/api | Backend API |
| **Webhooks** | http://localhost/webhook | Webhook endpoints |
| **Health** | http://localhost/health | Health check |

## 🔧 Configuration

1. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database Setup** (Optional):
   ```bash
   yarn setup  # Run migrations and seed data
   ```

3. **Start Services**:
   ```bash
   yarn docker:prod
   ```

## 📦 Docker Images

| Tag | Description | Use Case |
|-----|-------------|----------|
| `latest` | Production image | Production deployment |
| `develop` | Development image | Development environment |
| `v1.0.0` | Release image | Specific version |

## 🔄 CI/CD Pipeline

### Branches
- **`develop`** → Deploy to development environment
- **`master`** → Deploy to production environment

### Workflows
- **CI**: Lint, test, security scan, Docker build test
- **CD**: Build and deploy to respective environment
- **Release**: Create GitHub release with Docker images

## 🛠️ Commands

### Development
```bash
yarn dev                    # Start development server
yarn docker:dev            # Start development with Docker
yarn docker:dev:down       # Stop development containers
yarn docker:logs:dev       # View development logs
```

### Production
```bash
yarn docker:prod           # Start production with Docker
yarn docker:prod:down      # Stop production containers
yarn docker:logs:prod      # View production logs
```

### Frontend
```bash
yarn build:frontend        # Build frontend for nginx
```

### Database
```bash
yarn migrate               # Run database migrations
yarn migrate:status        # Check migration status
yarn seed                  # Seed database with initial data
yarn setup                 # Run migrations + seed
```

### Maintenance
```bash
yarn clean                 # Clean build artifacts and logs
yarn lint                  # Run ESLint
yarn lint:fix              # Fix ESLint issues
```

## 🔒 Security Features

- **Non-root containers**: All containers run as non-root user
- **Rate limiting**: API and webhook endpoints protected
- **Security headers**: XSS, CSRF, and other protections
- **Vulnerability scanning**: Trivy security scans in CI
- **Resource limits**: Memory and CPU limits per container

## 📊 Monitoring

- **Health checks**: All services have health check endpoints
- **Logging**: Structured logging with Winston
- **Metrics**: Built-in metrics collection
- **Resource monitoring**: Docker resource limits and monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :80
   # Change ports in docker-compose.yml
   ```

2. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Container not starting**:
   ```bash
   # Check logs
   yarn docker:logs:prod
   # Check health
   docker-compose ps
   ```

4. **Frontend not loading**:
   ```bash
   # Rebuild frontend
   yarn build:frontend
   # Restart nginx
   docker-compose restart nginx
   ```

### Cleanup
```bash
# Clean Docker resources
docker system prune -f
docker volume prune -f

# Clean project files
yarn clean
```

## 📝 Best Practices

1. **Environment Variables**: Always use `.env` files for configuration
2. **Health Checks**: Monitor service health regularly
3. **Logging**: Check logs for errors and performance issues
4. **Security**: Keep dependencies updated, use security scans
5. **Backup**: Regular database and configuration backups
6. **Monitoring**: Set up proper monitoring and alerting
7. **Updates**: Regular updates of base images and dependencies
