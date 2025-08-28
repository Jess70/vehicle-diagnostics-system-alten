import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { QueryLogsDto } from '../../dto/query-logs.dto';
import { PaginatedLogsDto } from '../../dto/log-entry.dto';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Query vehicle diagnostic logs',
    description: 'Search and filter vehicle diagnostic logs with pagination. All query parameters are optional.' 
  })
  @ApiQuery({ name: 'vehicle', required: false, description: 'Filter by vehicle ID', example: '1017' })
  @ApiQuery({ name: 'code', required: false, description: 'Filter by error code', example: 'P0171' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by log level', enum: ['INFO', 'ERROR', 'WARN', 'DEBUG'] })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601)', example: '2025-01-06T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)', example: '2025-01-06T23:59:59Z' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in message text', example: 'sensor malfunction' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 1000)', example: 50 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field', enum: ['timestamp', 'vehicleId', 'code', 'level'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Logs retrieved successfully',
    type: PaginatedLogsDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid query parameters' 
  })
  async findLogs(@Query() queryDto: QueryLogsDto): Promise<PaginatedLogsDto> {
    return this.logsService.findLogs(queryDto);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get log statistics',
    description: 'Get aggregate statistics about the log data' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalLogs: { type: 'number', example: 15000 },
        uniqueVehicles: { type: 'number', example: 25 },
        uniqueCodes: { type: 'number', example: 150 },
        logsByLevel: {
          type: 'object',
          example: {
            'INFO': 8000,
            'ERROR': 3000,
            'WARN': 3500,
            'DEBUG': 500
          }
        }
      }
    }
  })
  async getStats(): Promise<{
    totalLogs: number;
    uniqueVehicles: number;
    uniqueCodes: number;
    logsByLevel: Record<string, number>;
  }> {
    return this.logsService.getLogStats();
  }
}

