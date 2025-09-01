# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci 

# Copy source code
COPY apps/frontend/ ./apps/frontend/

# Build the application
RUN npx nx build frontend --prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /usr/src/app/dist/apps/frontend/browser /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
