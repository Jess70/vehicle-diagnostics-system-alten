# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
# Copy tailwind.config.js if it exists (optional)
COPY postcss.config.js ./

# Copy frontend source
COPY apps/frontend/ ./apps/frontend/

# Install dependencies
RUN npm ci 

# Build the frontend
RUN npx nx build frontend

# Production stage
FROM nginx:alpine AS production

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /usr/src/app/dist/apps/frontend/browser /usr/share/nginx/html

# Set proper permissions (using existing nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
