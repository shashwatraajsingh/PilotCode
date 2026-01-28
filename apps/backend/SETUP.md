# Backend Setup Guide

## ✅ Fixed Issues

All TypeScript compilation errors and NestJS dependency injection issues have been resolved:

1. **Module Dependencies** - Fixed circular dependencies between Brain, Hands, and Legs modules using `forwardRef()`
2. **Service Exports** - Exported all required services: AIProviderService, ContextGathererService, CodeQualityService, TestRunnerService, GitService
3. **Prisma Types** - Fixed enum type imports by using string literals instead of importing from @prisma/client
4. **Swagger Types** - Fixed type conflicts by casting app instance to `any`
5. **Build System** - Configured to use TypeScript compiler directly, bypassing broken Nest CLI

## 🚀 Current Status

✅ **TypeScript Compilation**: `npx tsc --noEmit` - **0 errors**  
✅ **Build**: `npm run build` - **Success**  
✅ **Module Loading**: All Nest modules initialize correctly  
⚠️ **Database**: Needs PostgreSQL configuration (see below)

## 📋 Prerequisites

### Required Services

1. **PostgreSQL** (database)
2. **Redis** (caching & pub/sub)
3. **Kafka** (event streaming - optional for basic functionality)

### Quick Setup with Docker

```bash
# Start PostgreSQL
docker run -d \\
  --name devin-postgres \\
  -e POSTGRES_USER=devin \\
  -e POSTGRES_PASSWORD=devin_password \\
  -e POSTGRES_DB=devin_db \\
  -p 5432:5432 \\
  postgres:15

# Start Redis
docker run -d \\
  --name devin-redis \\
  -p 6379:6379 \\
  redis:7

# Start Kafka (optional)
docker run -d \\
  --name devin-kafka \\
  -p 9092:9092 \\
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \\
  confluentinc/cp-kafka:latest
```

## 🔧 Configuration

### 1. Environment Variables

Copy the example env file and configure:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://devin:devin_password@localhost:5432/devin_db

# Redis
REDIS_URL=redis://localhost:6379

# Kafka (optional)
KAFKA_BROKERS=localhost:9092

# AI Provider (at least one required)
ANTHROPIC_API_KEY=your_anthropic_key_here
# OR
OPENAI_API_KEY=your_openai_key_here

# GitHub (for PR creation)
GITHUB_TOKEN=your_github_token_here

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Server
PORT=3001
NODE_ENV=development
```

### 3. Database Migration

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

## 🎯 Running the Backend

### Development Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start

# Server will be available at:
# 📡 API: http://localhost:3001
# 📚 Docs: http://localhost:3001/api (Swagger)
# 🔌 WebSocket: ws://localhost:3001
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🔍 Troubleshooting

### Database Connection Error

If you see `PrismaClientInitializationError: Authentication failed`:

1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Check DATABASE_URL in `.env`
3. Test connection: `psql postgresql://devin:devin_password@localhost:5432/devin_db`

### Redis Connection Error

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping  # Should return "PONG"
```

### Module Resolution Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
cd ../../  # Go to root
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
cd apps/backend
npm install
npm run build
```

## 🏗️ Architecture

```
apps/backend/
├── src/
│   ├── auth/          # Authentication & authorization
│   ├── brain/         # AI provider integration & planning
│   ├── common/        # Shared services (Prisma, Redis, Kafka)
│   ├── delivery/      # GitHub integration & PR creation
│   ├── hands/         # Code editing & file operations
│   ├── legs/          # Command execution & testing
│   ├── tasks/         # Task management
│   ├── websocket/     # Real-time updates
│   └── workflow/      # Orchestration & state machine
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📝 Notes

- The backend uses TypeScript compiler (`tsc`) directly instead of Nest CLI due to dependency conflicts
- All NestJS modules use proper dependency injection with forwardRef for circular dependencies
- Prisma enums are accessed as string literals to avoid type import issues
- The application successfully initializes all modules - database is the only remaining setup step
