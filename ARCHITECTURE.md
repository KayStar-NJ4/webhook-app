# Architecture Documentation

## 🏗️ Clean Architecture Overview

This project follows Clean Architecture principles with clear separation of concerns across multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Controllers │ │  Middleware │ │   Routes    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Use Cases  │ │   Services  │ │   DTOs      │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Entities   │ │ Value Objects│ │ Repositories│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Services   │ │ Repositories│ │   Config    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── domain/                    # Domain Layer
│   ├── entities/             # Business entities
│   │   ├── Message.js        # Message entity
│   │   └── Conversation.js   # Conversation entity
│   ├── valueObjects/         # Value objects
│   │   └── Platform.js       # Platform value object
│   └── repositories/         # Repository interfaces
│       ├── ConversationRepository.js
│       └── MessageRepository.js
├── application/              # Application Layer
│   ├── useCases/            # Business use cases
│   │   ├── ProcessMessageUseCase.js
│   │   └── GetConversationsUseCase.js
│   └── services/            # Application services
│       └── MessageBrokerService.js
├── infrastructure/          # Infrastructure Layer
│   ├── config/             # Configuration
│   │   └── Config.js       # Config with validation
│   ├── repositories/       # Repository implementations
│   │   ├── InMemoryConversationRepository.js
│   │   └── InMemoryMessageRepository.js
│   ├── services/           # External service implementations
│   │   ├── TelegramService.js
│   │   ├── ChatwootService.js
│   │   └── DifyService.js
│   ├── container/          # Dependency injection
│   │   ├── Container.js    # DI container
│   │   └── ServiceRegistry.js
│   └── logging/            # Logging infrastructure
│       └── Logger.js
└── presentation/           # Presentation Layer
    ├── controllers/        # HTTP controllers
    │   ├── WebhookController.js
    │   ├── ConversationController.js
    │   └── TelegramController.js
    ├── middleware/         # Express middleware
    │   ├── ErrorHandler.js
    │   ├── RequestLogger.js
    │   └── Validation.js
    ├── routes/            # Route definitions
    │   ├── WebhookRoutes.js
    │   └── ApiRoutes.js
    └── Server.js          # Express server setup
```

## 🔄 Data Flow

### 1. Message Processing Flow

```
Telegram Webhook → WebhookController → MessageBrokerService → ProcessMessageUseCase
                                                                      ↓
Chatwoot ← ChatwootService ← Conversation ← ConversationRepository ← Use Case
    ↓
Dify AI ← DifyService ← Message ← MessageRepository ← Use Case
    ↓
Response → TelegramService → Telegram Bot
```

### 2. Dependency Injection Flow

```
Application → ServiceRegistry → Container → Services
     ↓
Controllers ← Use Cases ← Repositories ← External Services
```

## 🎯 Key Design Principles

### 1. **Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Infrastructure depends on domain, not vice versa

### 2. **Single Responsibility**
- Each class has one reason to change
- Controllers handle HTTP, Use Cases handle business logic
- Services handle external integrations

### 3. **Open/Closed Principle**
- Open for extension, closed for modification
- New platforms can be added without changing existing code
- New use cases can be added without modifying existing ones

### 4. **Interface Segregation**
- Clients shouldn't depend on interfaces they don't use
- Repository interfaces are specific to their needs
- Service interfaces are focused on their responsibilities

## 🔧 Dependency Injection

The application uses a custom DI container to manage dependencies:

```javascript
// Service registration
container.register('telegramService', (container) => new TelegramService({
  config: container.get('config'),
  logger: container.get('logger')
}), true)

// Service resolution
const telegramService = container.get('telegramService')
```

### Benefits:
- **Testability**: Easy to mock dependencies
- **Flexibility**: Can swap implementations
- **Maintainability**: Clear dependency relationships
- **Configuration**: Centralized service configuration

## 🧪 Testing Strategy

### 1. **Unit Tests**
- Test individual components in isolation
- Mock external dependencies
- Focus on business logic

### 2. **Integration Tests**
- Test component interactions
- Use real implementations where possible
- Test data flow between layers

### 3. **Test Structure**
```
src/__tests__/
├── domain/              # Domain layer tests
├── application/         # Application layer tests
├── infrastructure/      # Infrastructure layer tests
└── presentation/        # Presentation layer tests
```

## 🚀 Benefits of This Architecture

### 1. **Maintainability**
- Clear separation of concerns
- Easy to locate and modify code
- Reduced coupling between components

### 2. **Testability**
- Each layer can be tested independently
- Easy to mock dependencies
- High test coverage possible

### 3. **Scalability**
- Easy to add new features
- Can scale individual components
- Supports microservices migration

### 4. **Flexibility**
- Can swap implementations
- Easy to add new platforms
- Configurable behavior

## 🔄 Migration from Old Architecture

The refactored architecture maintains backward compatibility while providing:

1. **Better Error Handling**: Centralized error management
2. **Improved Logging**: Structured logging with context
3. **Enhanced Validation**: Request validation with Joi
4. **Dependency Injection**: Loose coupling between components
5. **Clean Code**: Following SOLID principles
6. **Better Testing**: Comprehensive test coverage

## 📚 Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
