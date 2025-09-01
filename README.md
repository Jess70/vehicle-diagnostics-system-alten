# 🚗 Vehicle Diagnostics Dashboard - Quick Setup

A production-ready vehicle diagnostic log processing system built with Angular 20+, NestJS, and microservices architecture.

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and npm
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone and Setup
```bash
git clone <repository-url>
cd vehicle-diagnostics-system
npm install

# Optional: Create custom environment configuration
cp env.sample .env
# Edit .env file if you want to customize settings
```

### 2. Start All Services
```bash
# Start everything with Docker Compose
docker-compose up --build -d

# Check if all services are running
docker ps
```

### 3. Access the Application
- **🖥️ Frontend Dashboard**: http://localhost:4200
- **🔧 Backend API**: http://localhost:3000/api
- **📚 API Documentation**: http://localhost:3000/api/docs
- **📊 Prometheus Metrics**: http://localhost:9090
- **📈 MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

## 📁 Upload Test Files

The system accepts `.txt` and `.log` files in a specific format. Here's the required log format:
```
[2025-01-01 00:00:00] [VEHICLE_ID:1018] [ERROR] [CODE:B1000] [Airbag system fault]
[2025-01-01 00:00:05] [VEHICLE_ID:1003] [INFO] [CODE:P0420] [Catalyst system efficiency]
```

## 🔍 Using the Dashboard

### File Upload
1. Go to the **Upload** tab
2. Drag & drop your log files or click to select
3. Watch real-time progress as files are processed
4. Files are automatically parsed and stored

### Search Logs
1. Switch to the **Search** tab
2. Filter by:
   - **Vehicle ID** (e.g., 1003, 1018)
   - **Error Code** (e.g., P0420, U0420)
   - **Log Level** (INFO, WARN, ERROR, DEBUG)
   - **Date Range** (YYYY-MM-DD format)
   - **Message Text** (full-text search)
3. Results are paginated and sortable

### Monitor Files
1. Use the **Files** tab to see all uploaded files
2. Check processing status and progress
3. View error details for failed files
4. Delete files when no longer needed

## 🛠️ Development Mode

### Backend Development
```bash
# Start Redis for job queue
docker run -p 6379:6379 -d redis:alpine

# Start MinIO for file storage  
docker run -p 9000:9000 -p 9001:9001 -d \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password123 \
  minio/minio server /data --console-address ":9001"

# Run backend in dev mode
npx nx serve backend
```

### Frontend Development
```bash
# Start frontend dev server
npx nx serve frontend
```

## 🔧 Configuration

### Environment Variables Setup

Create a `.env` file in the project root to customize configuration:

```bash
# Copy the sample environment file
cp env.sample .env

# Edit the .env file with your custom values
nano .env
```

**Sample Environment Variables** (from `env.sample`):
```bash
# Backend Configuration
NODE_ENV=production
PORT=3000
DATABASE_PATH=/usr/src/app/data/vehicle_diagnostics.db

# Redis Configuration  
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_PUBLIC_ENDPOINT=localhost:9000
MINIO_BUCKET=vehicle-logs
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# File Upload Constraints
SUPPORTED_FORMATS=.txt,.log

# Log Processing Configuration
LOG_PARSE_BATCH_SIZE=100  # Number of log entries to process per batch
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Metrics
```bash
# View Prometheus metrics
curl http://localhost:3000/api/metrics

# Key metrics to monitor:
# - files_uploaded_total
# - files_processed_total  
# - files_failed_total
```

### File Upload Constraints
- **Supported formats**: .txt, .log only (specific log format required)
- **Expected format**: `[timestamp] [VEHICLE_ID:xxx] [level] [CODE:xxx] [message]`
- **Frontend validation**: File type validation before upload (JavaScript validation in browser)
- **Backend validation**: Pre-signed URL generation includes file type validation in storage service

### Real-time Updates
The dashboard uses WebSockets for real-time updates:
- File processing progress
- Queue status changes  
- System notifications




## 🐛 Troubleshooting

### Backend Health Check Failures
**Issue**: `dependency failed to start: container vehicle-diagnostics-backend is unhealthy`

**Common Causes & Solutions:**
```bash
# 1. Check container status
docker ps -a

# 2. View backend logs
docker logs vehicle-diagnostics-backend

# 3. Check health status
docker inspect --format='{{.State.Health.Status}}' vehicle-diagnostics-backend
```

**Why This Happens:**
- Database initialization takes time during first startup
- TypeORM table creation (`synchronize: true`) can be slow
- Redis connection timing during startup

**Solutions:**
1. **Wait and Retry**: `docker-compose up --build -d` (usually works on 2nd attempt)
2. **Check Dependencies**: Ensure Redis and MinIO are healthy first
3. **View Detailed Logs**: `docker logs vehicle-diagnostics-backend --tail 50`

**Additional Docker Issues (Fixed by Retrying):**
- **Connection Error**: `failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF`
- **Fix**: Stop containers (`docker-compose down`) and run `docker-compose up -d` again




## 🏗️ Build for Production

```bash
# Build both frontend and backend
npx nx build frontend --prod
npx nx build backend --prod

# Or use Docker for production builds
docker-compose -f docker-compose.prod.yml up --build
```

## 📝 Testing

```bash
# Lint code
npx nx lint backend frontend

# Build everything
npx nx build backend frontend

# Test file upload via API
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@sample-logs.txt"
```



---

**Need help?** Check the Architecture documentation for system details or Future Scope for planned enhancements.