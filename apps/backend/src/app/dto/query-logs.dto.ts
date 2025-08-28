import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLogsDto {
  @ApiPropertyOptional({ 
    description: 'Vehicle ID to filter by',
    example: '1017' 
  })
  @IsOptional()
  @IsString()
  vehicle?: string;

  @ApiPropertyOptional({ 
    description: 'Error code to filter by',
    example: 'P0171' 
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ 
    description: 'Log level to filter by',
    example: 'ERROR',
    enum: ['INFO', 'ERROR', 'WARN', 'DEBUG']
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ 
    description: 'Start date for timestamp range (ISO 8601)',
    example: '2025-01-06T00:00:00Z' 
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ 
    description: 'End date for timestamp range (ISO 8601)',
    example: '2025-01-06T23:59:59Z' 
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ 
    description: 'Search text in message field',
    example: 'sensor malfunction' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of results per page',
    example: 50,
    minimum: 1,
    maximum: 1000,
    default: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    example: 'timestamp',
    enum: ['timestamp', 'vehicleId', 'code', 'level']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

