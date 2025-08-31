import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckResult } from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description: 'Checks the health of all critical services (Database, Redis, MinIO, Prometheus)'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy or degraded' })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }
}