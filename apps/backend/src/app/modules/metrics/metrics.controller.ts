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
files_uploaded_total 42

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




}

