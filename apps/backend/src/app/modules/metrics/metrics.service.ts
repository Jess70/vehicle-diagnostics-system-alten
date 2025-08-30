import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../entities/file.entity';
import { LogEntry } from '../../entities/log-entry.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  private filesUploadedSuccess = 0;
  private filesUploadedError = 0;
  private filesProcessedTotal = 0;
  private filesFailedTotal = 0;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(LogEntry)
    private readonly logEntryRepository: Repository<LogEntry>,
  ) {
    this.logger.log('Metrics service initialized with simple counter metrics');
  }

  incrementFilesUploaded(status: 'success' | 'error' = 'success'): void {
    if (status === 'success') {
      this.filesUploadedSuccess++;
    } else {
      this.filesUploadedError++;
    }
  }

  incrementFilesProcessed(): void {
    this.filesProcessedTotal++;
  }

  incrementFilesFailed(errorType: string = 'unknown'): void {
    this.filesFailedTotal++;
  }

  async getMetrics(): Promise<string> {
    const metrics = [];
    
    metrics.push('# HELP files_uploaded_total Total number of files uploaded');
    metrics.push('# TYPE files_uploaded_total counter');
    metrics.push(`files_uploaded_total{status="success"} ${this.filesUploadedSuccess}`);
    metrics.push(`files_uploaded_total{status="error"} ${this.filesUploadedError}`);
    
    metrics.push('');
    metrics.push('# HELP files_processed_total Total number of files successfully processed');
    metrics.push('# TYPE files_processed_total counter');
    metrics.push(`files_processed_total ${this.filesProcessedTotal}`);
    
    metrics.push('');
    metrics.push('# HELP files_failed_total Total number of files that failed processing');
    metrics.push('# TYPE files_failed_total counter');
    metrics.push(`files_failed_total{error_type="unknown"} ${this.filesFailedTotal}`);
    
    return metrics.join('\n');
  }



  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: {
      totalFiles: number;
      pendingFiles: number;
      processingFiles: number;
      totalLogs: number;
      uptime: number;
    };
  }> {
    const checks = {
      database: false,
      metrics: true,
    };

    let totalFiles = 0;
    let pendingFiles = 0;
    let processingFiles = 0;
    let totalLogs = 0;

    // Test database connectivity without complex queries
    try {
      // Simple query to test database connection
      await this.fileRepository.query('SELECT 1');
      checks.database = true;
      
      // Only run count queries if database is confirmed working
      try {
        totalFiles = await this.fileRepository.count();
        pendingFiles = await this.fileRepository.count({ 
          where: { status: FileStatus.PENDING } 
        });
        processingFiles = await this.fileRepository.count({ 
          where: { status: FileStatus.PROCESSING } 
        });
        totalLogs = await this.logEntryRepository.count();
      } catch (countError) {
        // Database connected but queries failed - still healthy for startup
        this.logger.warn('Database connected but count queries failed (normal during startup)', countError.message);
      }
    } catch (dbError) {
      this.logger.warn('Database connection failed during health check', dbError.message);
      checks.database = false;
    }

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!checks.database) {
      status = 'unhealthy';
    } else if (processingFiles > 10) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      metrics: {
        totalFiles,
        pendingFiles,
        processingFiles,
        totalLogs,
        uptime: process.uptime(),
      },
    };
  }
}

