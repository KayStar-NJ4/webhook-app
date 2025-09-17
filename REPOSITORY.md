# Repository Pattern Documentation

## 🗄️ Repository Pattern Overview

Repository pattern là một design pattern giúp tách biệt business logic khỏi data access logic. Trong project này, chúng ta có nhiều implementations khác nhau để lưu trữ data.

## 📊 Data Sources

### 1. **Redis Repository** (Default)
- **Mục đích**: Production với high performance
- **Lưu trữ**: Redis database
- **Ưu điểm**: Nhanh, persistent, có thể scale
- **Nhược điểm**: Cần setup Redis server

```javascript
// Configuration
REPOSITORY_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

### 2. **PostgreSQL Repository**
- **Mục đích**: Production với ACID compliance
- **Lưu trữ**: PostgreSQL database
- **Ưu điểm**: Reliable, ACID, complex queries
- **Nhược điểm**: Slower than Redis, cần setup PostgreSQL

```javascript
// Configuration
REPOSITORY_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## 🔄 Repository Interface

Tất cả repositories đều implement cùng một interface:

```javascript
class ConversationRepository {
  async findById(id) { /* ... */ }
  async findByPlatformId(platform, externalId) { /* ... */ }
  async save(conversation) { /* ... */ }
  async update(conversation) { /* ... */ }
  async delete(id) { /* ... */ }
  async findAll() { /* ... */ }
  async findByPlatform(platform) { /* ... */ }
}
```

## 🚀 Cách sử dụng

### 1. **Production với Redis** (Recommended)
```bash
# .env
REPOSITORY_TYPE=redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### 2. **Production với PostgreSQL**
```bash
# .env
REPOSITORY_TYPE=postgresql
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=your-password
```


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Use Cases  │ │   Services  │ │ Controllers │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Entities   │ │ Value Objects│ │ Repository  │          │
│  │             │ │             │ │ Interface   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────┐ ┌─────────────┐                          │
│  │    Redis    │ │ PostgreSQL  │                          │
│  │ Repository  │ │ Repository  │                          │
│  └─────────────┘ └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Setup Database

### Redis Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
```

### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb chatwoot_webhook

# Create user
sudo -u postgres createuser --interactive
```


## 📈 Performance Comparison

| Repository | Read Speed | Write Speed | Persistence | Scalability |
|------------|------------|-------------|-------------|-------------|
| Redis      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| PostgreSQL | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |

## 🧪 Testing

### Unit Tests
```bash
# Test với Redis repository (default)
yarn test

# Test với PostgreSQL repository
REPOSITORY_TYPE=postgresql yarn test
```

### Integration Tests
```bash
# Test với real database
REPOSITORY_TYPE=postgresql yarn test:integration
```

## 🔄 Migration giữa các Repositories

### Từ Redis sang PostgreSQL
```bash
# 1. Setup PostgreSQL
REPOSITORY_TYPE=postgresql
DB_HOST=localhost
DB_NAME=chatwoot_webhook

# 2. Restart application
yarn start
```

## 🚨 Best Practices

1. **Development**: Sử dụng Redis repository
2. **Testing**: Sử dụng Redis repository
3. **Production**: Sử dụng Redis hoặc PostgreSQL
4. **High Performance**: Sử dụng Redis
5. **ACID Compliance**: Sử dụng PostgreSQL
6. **Backup**: Luôn backup database
7. **Monitoring**: Monitor database performance

## 🔍 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check database server is running
   - Verify connection credentials
   - Check network connectivity

2. **Performance Issues**
   - Monitor database performance
   - Check query optimization
   - Consider caching strategies

3. **Data Loss**
   - Ensure proper backup procedures
   - Use persistent repositories in production
   - Monitor disk space

## 📚 Further Reading

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
