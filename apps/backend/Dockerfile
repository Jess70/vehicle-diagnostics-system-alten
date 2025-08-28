# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Install all dependencies (including dev deps for build)
RUN npm ci 

# Build the backend
RUN npx nx build backend

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production  && npm cache clean --force

# Copy built application
COPY --from=builder /usr/src/app/dist/backend ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY healthcheck.js ./

# Create directories for uploads and database
RUN mkdir -p /usr/src/app/uploads /usr/src/app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
RUN chown -R backend:nodejs /usr/src/app
USER backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "dist/main.js"]
