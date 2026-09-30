# Multi-stage Dockerfile for AgriBridge AI Production Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build production client
COPY . .
RUN npm run build

# Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy production artifacts & server dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src

# Create non-root user
USER node

EXPOSE 3001

CMD ["node", "server/index.js"]
