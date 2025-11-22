#!/bin/bash

echo "🚀 Starting Devin AI - Production Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your API keys.${NC}"
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd apps/backend
npm install

echo -e "${BLUE}🗄️  Setting up database...${NC}"
npx prisma generate
npx prisma migrate deploy

cd ../..

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd apps/frontend
npm install

cd ../..

echo -e "${BLUE}🐳 Building Docker images...${NC}"
docker build -t devin-sandbox:latest ./docker/sandbox 2>/dev/null || echo "Sandbox image already exists"

echo -e "${BLUE}🚀 Starting services with Docker Compose...${NC}"
docker-compose up -d postgres redis zookeeper kafka

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo ""
echo -e "${GREEN}✅ Infrastructure services started!${NC}"
echo ""
echo -e "${BLUE}Starting backend...${NC}"
cd apps/backend
npm run start:dev &
BACKEND_PID=$!

echo -e "${BLUE}Starting frontend...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

cd ../..

echo ""
echo "========================================"
echo -e "${GREEN}✨ Devin AI is starting up!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📍 Access points:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   API Docs:  http://localhost:3001/api"
echo ""
echo -e "${YELLOW}📝 First time setup:${NC}"
echo "   1. Register a user at /auth/register"
echo "   2. Add your API keys in the UI"
echo "   3. Create your first task at /create"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; echo 'Done!'; exit" INT

wait
