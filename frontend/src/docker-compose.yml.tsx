# KLSI 4.0 - Docker Compose Configuration
# Development dan production deployment

version: '3.8'

services:
  # Frontend Application
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Development mode (optional)
  frontend-dev:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "${DEV_PORT:-5173}:5173"
    command: npm run dev
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:8000}
    profiles:
      - dev

networks:
  default:
    name: klsi-network
