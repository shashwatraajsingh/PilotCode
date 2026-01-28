# Devin AI - Autonomous Software Engineer

🚀 **Production-Ready** | ✨ **Enterprise-Grade** | 🔒 **Secure** | 📊 **Real-Time Monitoring**

A fully-featured autonomous AI software engineer that matches Devin AI's capabilities. Built with modern tech stack, it can understand tasks, analyze codebases, plan execution, write code, debug, test, review quality, and deliver production-ready solutions - all autonomously.

## ✨ Production Features

- ✅ **Real-Time WebSocket Updates** - Live task progress and monitoring
- ✅ **JWT Authentication** - Secure user authentication and authorization
- ✅ **Context-Aware Planning** - Analyzes entire codebase before making changes
- ✅ **Code Quality Analysis** - Automated linting, complexity analysis, and formatting
- ✅ **Multi-Framework Testing** - Jest, Mocha, Pytest, Go tests with coverage
- ✅ **Rate Limiting** - API protection and abuse prevention
- ✅ **Structured Logging** - Winston-based enterprise logging
- ✅ **Error Recovery** - Intelligent retry mechanisms
- ✅ **BYOK Support** - Bring Your Own Key for API providers
- ✅ **Docker Isolation** - Sandboxed code execution

## 🚀 Tech Stack

### Core
- **Backend**: NestJS (TypeScript) with WebSocket support
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Framer Motion
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7 for sessions and rate limiting
- **Message Queue**: Apache Kafka for event streaming
- **Sandbox**: Docker for isolated code execution
- **Authentication**: JWT with refresh tokens
- **Logging**: Winston with multiple transports

### AI & Testing
- **AI Providers**: OpenAI GPT-4, Anthropic Claude
- **Testing**: Jest, Mocha, Pytest, Go Test
- **Code Quality**: ESLint, Pylint, Prettier, Black
- **Version Control**: Git, GitHub API integration

## 🧠 Architecture - 5 Core Systems

### STEP 1: The Brain (Planner + Task Decomposer)
**Location**: `apps/backend/src/brain/`

Converts natural language into executable plans:
- AI-powered task decomposition (OpenAI/Anthropic)
- Dependency analysis
- Ordered execution planning
- Success/failure condition detection

**Example**: "Add JWT authentication" → Install deps → Create auth controller → Add middleware → Write tests → Run tests → Fix errors → Commit

### STEP 2: The Hands (File System + Code Editor)
**Location**: `apps/backend/src/hands/`

Manipulates code like a real developer:
- AST-based code parsing & modification
- Multi-file editing capabilities
- Git-style diff patching
- Directory structure management
- Language-aware code generation

### STEP 3: The Legs (Terminal Runner + Debug Loop)
**Location**: `apps/backend/src/legs/`

Executes and debugs code autonomously:
- Docker-based sandboxed execution
- Real-time stdout/stderr capture
- AI-powered error analysis
- Automatic retry with fixes
- Test-driven debugging loop

### STEP 4: The Workflow Engine
**Location**: `apps/backend/src/workflow/`

Orchestrates the entire system:
- State machine (PLANNED → RUNNING → SUCCESS/FAILED → RETRY)
- Kafka-based event streaming
- Redis caching for state
- PostgreSQL for persistence
- Task history & memory
- Automatic task progression

### STEP 5: The Delivery Layer
**Location**: `apps/backend/src/delivery/`

Ships code to production:
- GitHub integration
- Auto-branch creation
- Intelligent commits with AI-generated messages
- PR creation with detailed descriptions
- Code review response automation

## 📦 Project Structure

```
DevinAI/
├── apps/
│   ├── backend/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── brain/        # STEP 1: Task Planning
│   │   │   ├── hands/        # STEP 2: Code Editing
│   │   │   ├── legs/         # STEP 3: Execution
│   │   │   ├── workflow/     # STEP 4: Orchestration
│   │   │   ├── delivery/     # STEP 5: GitHub Integration
│   │   │   ├── common/       # Shared utilities
│   │   │   └── main.ts
│   │   ├── prisma/           # Database schema
│   │   └── package.json
│   │
│   └── frontend/             # Next.js Frontend
│       ├── app/              # App router
│       ├── components/       # Shadcn + Aceternity UI
│       ├── lib/              # Utilities
│       └── package.json
│
├── packages/
│   └── types/                # Shared TypeScript types
│
├── docker/
│   └── sandbox/              # Execution sandbox
│
├── docker-compose.yml
└── package.json
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Git

### One-Command Setup

```bash
# 1. Clone the repository
git clone <your-repo>
cd DevinAI

# 2. Run the automated start script
./start.sh
```

The script will:
- ✅ Create `.env` from example if needed
- ✅ Install all dependencies
- ✅ Set up database with Prisma
- ✅ Start Docker services (Postgres, Redis, Kafka)
- ✅ Launch backend and frontend

### Manual Setup

If you prefer manual control:

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your API keys (OpenAI, Anthropic, GitHub)

# 2. Install dependencies
npm install
cd apps/backend && npm install
cd ../frontend && npm install

# 3. Set up database
cd apps/backend
npx prisma generate
npx prisma migrate deploy

# 4. Start infrastructure
docker-compose up -d postgres redis zookeeper kafka

# 5. Run database migrations
cd apps/backend
npx prisma migrate dev

# 6. Start development servers
cd ../..
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

## 🎯 Usage

### Web Interface

1. Open http://localhost:3000
2. Enter your task: "Add Stripe payment integration to my Next.js app"
3. Watch Devin plan, code, test, and deliver!

### API Usage

```typescript
// POST /api/tasks
{
  "description": "Add JWT authentication to Express API",
  "repoUrl": "https://github.com/user/repo",
  "targetBranch": "main"
}

// Response
{
  "taskId": "uuid",
  "status": "planned",
  "executionPlan": {
    "subtasks": [...]
  }
}

// WebSocket for real-time updates
ws://localhost:3001/tasks/{taskId}/stream
```

## 🔌 API Endpoints

- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task status
- `GET /api/tasks/:id/stream` - WebSocket stream
- `POST /api/tasks/:id/retry` - Retry failed task
- `GET /api/executions` - List all executions
- `POST /api/github/pr` - Create PR manually

## 🎨 Features

### AI-Powered Planning
- Context-aware task breakdown
- Automatic dependency detection
- Risk assessment
- Time estimation

### Smart Code Editing
- Preserves code style
- Handles imports automatically
- Multi-file refactoring
- Type-safe modifications

### Autonomous Debugging
- Reads error messages
- Suggests fixes
- Applies patches
- Re-runs tests
- Learns from failures

### Production-Ready Delivery
- Clean commit history
- Meaningful commit messages
- Comprehensive PR descriptions
- CI/CD integration

## 🔐 Security

- Sandboxed code execution (Docker)
- API key encryption
- Rate limiting
- Input validation
- GitHub token security

## 📊 Monitoring

- Real-time task progress via WebSocket
- Execution logs in PostgreSQL
- Metrics via Kafka consumers
- Redis cache statistics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
cd apps/backend
npm test

# Run frontend tests
cd apps/frontend
npm test

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to cloud platforms
# Vercel (Frontend) + Railway/Render (Backend)
```

## 📝 Environment Variables

See `.env.example` for all required variables:
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - AI provider
- `GITHUB_TOKEN` - GitHub API access
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `KAFKA_BROKERS` - Kafka brokers

## 🤝 Contributing

Contributions welcome! See CONTRIBUTING.md

## 📄 License

MIT License - see LICENSE file

## 🎬 Demo

Try it with these example tasks:

1. **Add Feature**: "Add user authentication with JWT and refresh tokens"
2. **Fix Bug**: "Fix the memory leak in the image processing service"
3. **Refactor**: "Migrate from REST to GraphQL API"
4. **Test**: "Add comprehensive unit tests for the payment module"
5. **Deploy**: "Set up CI/CD pipeline with GitHub Actions"

## 🌟 Star History

If you find this project useful, please star it on GitHub!

---

Built with ❤️ using TypeScript, NestJS, Next.js, and AI
