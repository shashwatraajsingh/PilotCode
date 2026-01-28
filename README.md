<div align="center">

# PilotCode

### Autonomous AI Software Engineer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**An enterprise-grade autonomous coding agent that transforms natural language into production-ready code.**

[Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## Overview

PilotCode is a production-ready autonomous software engineer that can understand requirements, analyze codebases, plan execution strategies, write code, debug issues, run tests, and deliver solutions via pull requests—all without human intervention.

Built for teams that need reliable, secure, and scalable AI-assisted development.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Intelligent Planning** | Decomposes complex tasks into ordered, dependency-aware subtasks |
| **Code Manipulation** | AST-based parsing with language-aware modifications |
| **Sandboxed Execution** | Docker-isolated command execution with security boundaries |
| **Self-Healing Debug** | Autonomous error analysis with iterative fix-and-retry loops |
| **Git Integration** | Automated branching, commits, and PR creation with AI-generated descriptions |
| **Real-Time Streaming** | WebSocket-based progress updates and live execution monitoring |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│  Next.js 14 (App Router) • React 18 • Tailwind CSS • WebSocket │
├─────────────────────────────────────────────────────────────────┤
│                         API Gateway                             │
│  NestJS • JWT Auth • Rate Limiting • OpenAPI/Swagger           │
├─────────────────────────────────────────────────────────────────┤
│                      Core Services                              │
│  Brain (Planner) • Hands (Editor) • Legs (Executor) • Delivery │
├─────────────────────────────────────────────────────────────────┤
│                      Infrastructure                             │
│  PostgreSQL 16 • Redis 7 • Apache Kafka • Docker Sandbox       │
├─────────────────────────────────────────────────────────────────┤
│                      AI Providers                               │
│  OpenAI GPT-4 Turbo • Anthropic Claude 3                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture

PilotCode follows a modular 5-stage pipeline architecture:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Brain     │───▶│    Hands     │───▶│    Legs      │───▶│   Workflow   │───▶│   Delivery   │
│   (Planner)  │    │   (Editor)   │    │  (Executor)  │    │   (Engine)   │    │    (Git)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                    │                   │                   │                   │
   AI-powered          AST-based           Sandboxed          State machine        GitHub API
   decomposition       code edits          execution          orchestration        integration
```

### Stage 1: Brain (`/src/brain/`)
Converts natural language into structured execution plans using LLM-powered task decomposition with dependency analysis.

### Stage 2: Hands (`/src/hands/`)  
Manipulates source code through AST parsing, multi-file editing, and intelligent code generation with style preservation.

### Stage 3: Legs (`/src/legs/`)
Executes commands in Docker-sandboxed environments with real-time output capture and AI-powered error diagnosis.

### Stage 4: Workflow Engine (`/src/workflow/`)
Orchestrates task progression through state transitions with Kafka event streaming and Redis state caching.

### Stage 5: Delivery (`/src/delivery/`)
Integrates with GitHub for automated branch creation, intelligent commits, and PR management with AI-generated descriptions.

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/shashwatraajsingh/PilotCode.git
cd PilotCode

# Automated setup (recommended)
./start.sh

# Or manual setup
cp .env.example .env
npm install
npm run install:all

# Database setup
cd apps/backend
npx prisma generate
npx prisma migrate deploy
cd ../..

# Start infrastructure
docker-compose up -d postgres redis zookeeper kafka

# Run development servers
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Documentation | http://localhost:3001/api |
| WebSocket | ws://localhost:3001/events |

---

## Configuration

### Required Environment Variables

```bash
# AI Provider (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# GitHub Integration
GITHUB_TOKEN=ghp_...

# JWT Security (generate with: openssl rand -base64 64)
JWT_SECRET=<your-strong-secret>
JWT_REFRESH_SECRET=<your-strong-refresh-secret>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pilotcode

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092
```

### Optional Configuration

```bash
# Model settings
AI_MODEL=gpt-4-turbo-preview
AI_TEMPERATURE=0.2
MAX_TOKENS=4096

# Sandbox settings
USE_DOCKER_SANDBOX=true
DOCKER_SANDBOX_IMAGE=pilotcode-sandbox:latest

# Production CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## API Reference

### Authentication

All endpoints require JWT authentication via Bearer token.

```bash
# Register
POST /auth/register
Content-Type: application/json
{"email": "user@example.com", "password": "SecurePass123", "name": "User"}

# Login
POST /auth/login
Content-Type: application/json
{"email": "user@example.com", "password": "SecurePass123"}

# Response: { "access_token": "...", "refresh_token": "..." }
```

### Task Management

```bash
# Create Task
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Add JWT authentication to the Express API",
  "repoUrl": "https://github.com/user/repo",
  "targetBranch": "main",
  "autoDeliver": true
}

# Response
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "executionPlan": {
    "subtaskCount": 5,
    "estimatedDuration": "15 minutes",
    "complexity": "medium"
  }
}
```

```bash
# Get Task Status
GET /tasks/:taskId
Authorization: Bearer <token>

# List Tasks
GET /tasks?limit=20
Authorization: Bearer <token>

# Deliver Task (Create PR)
POST /tasks/:taskId/deliver
Authorization: Bearer <token>
```

### WebSocket Events

Connect to `/events` namespace with JWT token:

```javascript
const socket = io('http://localhost:3001/events', {
  auth: { token: accessToken }
});

// Subscribe to task updates
socket.emit('subscribe:task', { taskId: '...' });

// Listen for events
socket.on('task:progress', (data) => { /* { taskId, message, progress, step } */ });
socket.on('task:status', (data) => { /* { taskId, status, metadata } */ });
socket.on('task:file-change', (data) => { /* { taskId, filePath, operation } */ });
socket.on('task:command', (data) => { /* { taskId, command, exitCode, stdout, stderr } */ });
socket.on('task:error', (data) => { /* { taskId, message, recoverable } */ });
```

---

## Project Structure

```
PilotCode/
├── apps/
│   ├── backend/                    # NestJS API Server
│   │   ├── src/
│   │   │   ├── auth/               # JWT authentication
│   │   │   ├── brain/              # Task planning & decomposition
│   │   │   ├── hands/              # File system & code editing
│   │   │   ├── legs/               # Command execution & debugging
│   │   │   ├── workflow/           # State machine & orchestration
│   │   │   ├── delivery/           # GitHub integration
│   │   │   ├── tasks/              # Unified task API
│   │   │   ├── websocket/          # Real-time events
│   │   │   └── common/             # Shared utilities & middleware
│   │   ├── prisma/                 # Database schema & migrations
│   │   └── package.json
│   │
│   └── frontend/                   # Next.js Web Application
│       ├── app/                    # App Router pages
│       ├── components/             # React components
│       ├── contexts/               # React contexts (Auth)
│       ├── lib/                    # API clients & utilities
│       └── package.json
│
├── docker/                         # Docker configurations
│   └── sandbox/                    # Isolated execution environment
│
├── docker-compose.yml              # Development infrastructure
├── SECURITY_AUDIT.md               # Security documentation
└── DEPLOY_RENDER.md                # Deployment guide
```

---

## Security

PilotCode implements defense-in-depth security measures:

| Layer | Implementation |
|-------|----------------|
| **Authentication** | JWT with refresh token rotation, bcrypt password hashing |
| **Authorization** | Role-based access control, resource ownership validation |
| **Input Validation** | class-validator DTOs, UUID parameter validation |
| **Execution Isolation** | Docker sandbox with restricted network, memory limits |
| **Path Security** | Allowlist-based path validation, traversal prevention |
| **Command Security** | Spawn with shell=false, dangerous pattern blocking |
| **HTTP Security** | Security headers, CORS restrictions, rate limiting |
| **Secret Management** | Environment-based configuration, production fail-fast |

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for detailed security documentation.

---

## Deployment

### Docker Compose (Production)

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

### Cloud Platforms

**Recommended Architecture:**
- **Frontend**: Vercel (automatic Next.js optimization)
- **Backend**: Render / Railway / AWS ECS
- **Database**: Managed PostgreSQL (Supabase / RDS)
- **Cache**: Managed Redis (Upstash / ElastiCache)
- **Queue**: Managed Kafka (Confluent Cloud / MSK)

See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) for detailed deployment instructions.

---

## Development

### Running Tests

```bash
# All tests
npm test

# Backend unit tests
cd apps/backend && npm test

# Frontend tests  
cd apps/frontend && npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format
```

---

## Contributing

We welcome contributions. Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with precision by developers, for developers.**

[Report Bug](https://github.com/shashwatraajsingh/PilotCode/issues) • [Request Feature](https://github.com/shashwatraajsingh/PilotCode/issues) • [Documentation](https://github.com/shashwatraajsingh/PilotCode/wiki)

</div>
