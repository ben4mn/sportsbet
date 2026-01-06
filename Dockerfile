FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source files (excluding node_modules via .dockerignore)
COPY . .

# Rebuild better-sqlite3 for Alpine
RUN npm rebuild better-sqlite3

# Build the frontend
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
