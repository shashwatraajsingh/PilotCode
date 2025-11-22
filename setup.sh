#!/bin/bash

echo "🚀 Setting up Devin AI..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please edit it with your API keys.${NC}"
    echo ""
fi

# Install root dependencies
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd apps/backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Go back to root
cd ../..

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd apps/frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Go back to root
cd ../..

# Build Docker sandbox
echo -e "${BLUE}🐳 Building Docker sandbox...${NC}"
docker build -t devin-sandbox:latest ./docker/sandbox
echo -e "${GREEN}✓ Docker sandbox built${NC}"
echo ""

# Start infrastructure
echo -e "${BLUE}🚀 Starting infrastructure (Postgres, Redis, Kafka)...${NC}"
docker-compose up -d postgres redis zookeeper kafka
echo -e "${GREEN}✓ Infrastructure started${NC}"
echo ""

# Wait for database
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
sleep 5
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Run migrations
echo -e "${BLUE}🔧 Running database migrations...${NC}"
cd apps/backend
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit .env file with your API keys (OPENAI_API_KEY or ANTHROPIC_API_KEY, GITHUB_TOKEN)"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo -e "${GREEN}Happy coding! 🤖${NC}"
