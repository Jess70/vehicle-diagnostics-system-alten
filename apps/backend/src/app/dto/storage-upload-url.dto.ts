import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StorageUploadUrlDto {
  @ApiProperty({ 
    description: 'Name of the file to upload',
    example: 'diagnostic-log-2025-01-06.txt'
  })
  @IsString()
  filename: string;

  @ApiProperty({ 
    description: 'MIME type of the file',
    example: 'text/plain',
    required: false
  })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiProperty({ 
    description: 'URL expiration time in seconds',
    example: 3600,
    minimum: 300,
    maximum: 86400,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(300) 
  @Max(86400) 
  expiresIn?: number;
}
