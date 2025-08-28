import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ 
    summary: 'Get core file metrics',
    description: 'Retrieve only the 3 core file processing metrics in Prometheus format' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Core metrics retrieved successfully',
    content: {
      'text/plain': {
        example: `# HELP files_uploaded_total Total number of files uploaded
# TYPE files_uploaded_total counter
files_uploaded_total{status="success"} 42

# HELP files_processed_total Total number of files successfully processed  
# TYPE files_processed_total counter
files_processed_total 38

# HELP files_failed_total Total number of files that failed processing
# TYPE files_failed_total counter
files_failed_total{error_type="unknown"} 2`
      }
    }
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('core')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ 
    summary: 'Get core file metrics only',
    description: 'Retrieve ONLY the 3 core file processing metrics without any system metrics' 
  })
  async getCoreMetrics(): Promise<string> {
    return this.metricsService.getCoreMetrics();
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Get system health status',
    description: 'Get detailed health status including system metrics and component checks' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['healthy', 'degraded', 'unhealthy'],
          example: 'healthy'
        },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: true },
            metrics: { type: 'boolean', example: true }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            totalFiles: { type: 'number', example: 42 },
            pendingFiles: { type: 'number', example: 4 },
            processingFiles: { type: 'number', example: 2 },
            totalLogs: { type: 'number', example: 15000 },
            uptime: { type: 'number', example: 3600.5 }
          }
        }
      }
    }
  })
  async getHealth(): Promise<{
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
    return this.metricsService.getHealthStatus();
  }
}

