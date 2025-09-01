import { ApiProperty } from '@nestjs/swagger';
import { FileStatus } from '../entities/file.entity';

export class FileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'vehicle_logs_2025.txt' })
  filename: string;

  @ApiProperty({ example: 'uploads/vehicle_logs_2025.txt' })
  storagePath: string;

  @ApiProperty({ example: 'vehicle-logs' })
  bucketName: string;

  @ApiProperty({ example: 'uploads/2025-01-06/vehicle_logs_2025.txt' })
  objectName: string;

  @ApiProperty({ example: 15728640 })
  sizeBytes: number;

  @ApiProperty({ 
    enum: FileStatus,
    example: FileStatus.COMPLETED 
  })
  status: FileStatus;

  @ApiProperty({ example: 15728640 })
  lastProcessedOffset: number;

  @ApiProperty({ example: 100000, nullable: true })
  lastProcessedLine?: number;

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiProperty({ 
    example: null, 
    nullable: true,
    description: 'Error message if processing failed'
  })
  errorMessage?: string;

  @ApiProperty({ example: '2025-01-06T18:45:30.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-06T18:50:15.000Z' })
  updatedAt: Date;
}

export class FileUploadResponseDto {
  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;

  @ApiProperty({ example: 1 })
  fileId: number;

  @ApiProperty({ 
    enum: FileStatus,
    example: FileStatus.PENDING 
  })
  status: FileStatus;
}

export class FileProcessingProgressDto {
  @ApiProperty({ example: 1 })
  fileId: number;

  @ApiProperty({ 
    enum: FileStatus,
    example: FileStatus.PROCESSING 
  })
  status: FileStatus;

  @ApiProperty({ 
    example: 75.5,
    description: 'Processing progress percentage' 
  })
  progressPercent: number;

  @ApiProperty({ 
    example: 11796480,
    description: 'Number of bytes processed' 
  })
  processedBytes: number;

  @ApiProperty({ 
    example: 15728640,
    description: 'Total file size in bytes' 
  })
  totalBytes: number;

  @ApiProperty({ 
    example: 75000,
    description: 'Number of log entries processed' 
  })
  processedEntries: number;

  @ApiProperty({ 
    example: '2025-01-06T18:47:30.000Z',
    description: 'Last update timestamp' 
  })
  lastUpdated: Date;
}

