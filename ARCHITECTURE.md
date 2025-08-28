# 🏗️ Vehicle Diagnostics System - Architecture Deep Dive

## Overview

This system processes vehicle diagnostic logs at scale using a microservices architecture. The design prioritizes fault tolerance, scalability, and operational visibility while maintaining simplicity for development and deployment.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular UI    │◄──►│   NestJS API     │◄──►│    SQLite DB    │
│                 │    │                  │    │                 │
│ • File Upload   │    │ • REST Endpoints │    │ • Structured    │
│ • Real-time UI  │    │ • WebSocket      │    │   Logs          │
│ • Search/Filter │    │ • Job Queue Mgmt │    │ • Indexes       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         │              │   BullMQ/Redis   │
         │              │                  │
         │              │ • Job Queue      │
         │              │ • Fault Tolerance│
         │              │ • Retry Logic    │
         │              └──────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         └─────────────►│      MinIO       │◄──►│  File Workers   │
                        │                  │    │                 │
                        │ • File Storage   │    │ • Log Parsing   │
                        │ • Pre-signed URLs│    │ • Checkpointing │
                        │ • Scalable       │    │ • Metrics       │
                        └──────────────────┘    └─────────────────┘
                                 │                        │
                                 ▼                        ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │   Prometheus     │    │   WebSocket     │
                        │                  │    │  Notifications  │
                        │ • Metrics        │    │                 │
                        │ • Monitoring     │    │ • Real-time     │
                        │ • Alerting       │    │   Updates       │
                        └──────────────────┘    └─────────────────┘
```

## Component Deep Dive

### Why MinIO?

**Problem**: Traditional file uploads through the API server create bottlenecks and don't scale well.

**Solution**: MinIO provides S3-compatible object storage that enables:

1. **Direct Client Uploads**: Frontend uploads directly to MinIO using pre-signed URLs, bypassing the API server
2. **Scalable Storage**: Can handle thousands of concurrent uploads without affecting the main application
3. **Durability**: Files are stored persistently, even if processing fails
4. **Multi-Worker Access**: Multiple processing workers can access the same files simultaneously

**Implementation Flow**:
```
Client Request → API generates pre-signed URL → Client uploads to MinIO → API notified → Job queued
```

This approach can handle 10x more concurrent uploads compared to traditional server-side processing.

### Why BullMQ?

**Problem**: Processing large log files (multi-GB) can take minutes or hours. If done synchronously, it blocks the API and provides poor user experience.

**Solution**: BullMQ (Redis-backed job queue) provides:

1. **Asynchronous Processing**: File processing happens in background workers
2. **Fault Tolerance**: Jobs survive server restarts and crashes
3. **Retry Logic**: Failed jobs are automatically retried with exponential backoff
4. **Checkpointing**: Workers can resume from where they left off after crashes
5. **Scalability**: Multiple workers can process jobs in parallel

**Fault Tolerance in Action**:
```sql
-- Worker tracks progress in database
UPDATE files SET 
  last_processed_offset = 1048576,  -- 1MB processed
  status = 'PROCESSING' 
WHERE id = 123;

-- If worker crashes, new worker resumes from offset 1048576
-- No data is lost or reprocessed
```

### Why Prometheus?

**Problem**: Without visibility into system performance, you can't scale effectively or detect issues early.

**Solution**: Prometheus provides operational metrics that enable:

1. **Queue Monitoring**: Track pending jobs to trigger auto-scaling
2. **Performance Tracking**: Measure file processing times and throughput
3. **Error Detection**: Alert when failure rates spike
4. **Capacity Planning**: Understand system limits before hitting them

**Key Metrics**:
```prometheus
# Files waiting to be processed (scale trigger)
files_pending{status="PENDING"} 

# Processing throughput
rate(files_processed_total[5m])

# Error rates
rate(files_failed_total[5m]) / rate(files_uploaded_total[5m])

# Queue depth (backpressure indicator)
bullmq_jobs_waiting
```

## Scaling Strategy

### Horizontal Scaling

The architecture supports multiple scaling dimensions:

**1. Worker Scaling**
```yaml
# docker-compose.scale.yml
services:
  worker:
    scale: 5  # Run 5 worker instances
```

**2. Storage Scaling**
```
MinIO Cluster:
┌─────────┐  ┌─────────┐  ┌─────────┐
│ MinIO-1 │  │ MinIO-2 │  │ MinIO-3 │
└─────────┘  └─────────┘  └─────────┘
     │            │            │
     └────────────┼────────────┘
                  │
            Distributed Storage
```

### Auto-scaling Triggers

**Scale Up When**:
- `files_pending > 100` (queue backlog)
- `avg_processing_time > 300s` (performance degradation)
- `worker_cpu_usage > 80%` (resource exhaustion)

**Scale Down When**:
- `files_pending < 10` (low demand)
- `worker_idle_time > 900s` (over-provisioned)

## Fault Tolerance Design

### 1. Checkpointing Strategy

Workers process files in chunks and checkpoint progress:

```typescript
// Pseudo-code for worker processing
async function processFile(fileId: number) {
  const file = await getFile(fileId);
  const startOffset = file.last_processed_offset || 0;
  
  const stream = createReadStream(file.path, { start: startOffset });
  
  for await (const chunk of stream) {
    // Process 1000 lines at a time
    const logs = parseLogChunk(chunk);
    await database.insertLogs(logs);
    
    // Checkpoint every 1000 lines
    await updateFileProgress(fileId, stream.bytesRead);
  }
}
```

### 2. Idempotent Processing

Each log entry has a unique hash to prevent duplicates:

```sql
-- Unique constraint prevents duplicate processing
CREATE UNIQUE INDEX ux_logs_unique_hash ON logs(unique_hash);

-- Worker can safely retry without creating duplicates
INSERT OR IGNORE INTO logs (vehicle_id, timestamp, code, message, unique_hash)
VALUES (?, ?, ?, ?, ?);
```

### Database Performance Optimization

**Current Database Indexing** (TypeORM Entity Decorators):
```typescript
// LogEntry entity indexes
@Index(['vehicleId'])        // Fast vehicle-specific searches
@Index(['code'])             // Quick error code lookups  
@Index(['timestamp'])        // Efficient date range filtering
@Index(['uniqueHash'], { unique: true })  // Duplicate prevention
```

**Actual SQL Indexes Created:**
```sql
-- Implemented indexes on log_entries table
CREATE INDEX idx_log_entries_vehicle_id ON log_entries(vehicleId);
CREATE INDEX idx_log_entries_code ON log_entries(code);
CREATE INDEX idx_log_entries_timestamp ON log_entries(timestamp);
CREATE UNIQUE INDEX idx_log_entries_unique_hash ON log_entries(uniqueHash);
```

**Note**: File entity currently has no indexes. Additional indexes for `level`, `fileId`, and file management can be added as future performance optimizations.

### 3. Dead Letter Queue

Failed jobs after max retries go to a dead letter queue for manual inspection:

```typescript
const jobOptions = {
  attempts: 3,
  backoff: 'exponential',
  removeOnComplete: 10,
  removeOnFail: 50
};
```



## Real-time Communication

### WebSocket Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Browser   │◄──────────────►│   Gateway   │
└─────────────┘                └─────────────┘
                                       │
                                       ▼
┌─────────────┐    Events      ┌─────────────┐
│   Workers   │───────────────►│  Event Bus  │
└─────────────┘                └─────────────┘
```

**Event Types**:
- `file.status.updated`: Processing progress
- `file.completed`: Processing finished
- `file.failed`: Processing error
- `system.notification`: General alerts

## Security Considerations

### File Upload Security

1. **Pre-signed URL Validation**:
   - Time-limited (15 minutes by default)
   - File type restricted (validated by StorageService)
   - Direct client-to-MinIO upload (backend never handles file data)

2. **Content Validation**:
   - File extension check (.txt, .log only)
   - MIME type validation
   - Log format validation (specific structure required)
   - No size limits enforced (MinIO handles large files efficiently)


## Monitoring and Observability

### Health Checks

```typescript
// Application health endpoint
GET /api/metrics/health

Response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected", 
  "minio": "connected",
  "workers": 3
}
```

### Custom Metrics

```prometheus
# Business metrics
files_uploaded_total{status="success"} 1234
files_processed_total 1200
files_failed_total{error_type="parse_error"} 34

# System metrics  
http_requests_total{method="POST",endpoint="/api/files"} 5678
websocket_connections_active 45
worker_processing_duration_seconds{quantile="0.95"} 120
```



This architecture provides a solid foundation that can grow from handling hundreds of files per day to processing millions of diagnostic events in real-time.
