FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN cd apps/frontend && npm install

# Copy source code
COPY apps/frontend ./apps/frontend

# Build application
RUN cd apps/frontend && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/package*.json ./
COPY --from=builder /app/apps/frontend/public ./public

EXPOSE 3000

CMD ["npm", "start"]
