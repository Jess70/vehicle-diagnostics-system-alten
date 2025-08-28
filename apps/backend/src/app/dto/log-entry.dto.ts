import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '../entities/log-entry.entity';

export class LogEntryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1017' })
  vehicleId: string;

  @ApiProperty({ example: '2025-01-06T18:45:30.000Z' })
  timestamp: Date;

  @ApiProperty({ 
    enum: LogLevel,
    example: LogLevel.ERROR 
  })
  level: LogLevel;

  @ApiProperty({ example: 'P0171' })
  code: string;

  @ApiProperty({ example: 'System too lean (Bank 1)' })
  message: string;

  @ApiProperty({ example: '2025-01-06T18:45:30.000Z' })
  createdAt: Date;
}

export class PaginatedLogsDto {
  @ApiProperty({ 
    type: [LogEntryDto],
    description: 'Array of log entries' 
  })
  data: LogEntryDto[];

  @ApiProperty({ 
    example: 1,
    description: 'Current page number' 
  })
  page: number;

  @ApiProperty({ 
    example: 50,
    description: 'Number of items per page' 
  })
  limit: number;

  @ApiProperty({ 
    example: 1250,
    description: 'Total number of items' 
  })
  total: number;

  @ApiProperty({ 
    example: 25,
    description: 'Total number of pages' 
  })
  totalPages: number;

  @ApiProperty({ 
    example: true,
    description: 'Whether there are more pages' 
  })
  hasNextPage: boolean;

  @ApiProperty({ 
    example: false,
    description: 'Whether there are previous pages' 
  })
  hasPreviousPage: boolean;
}

