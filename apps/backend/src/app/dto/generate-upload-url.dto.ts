import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateUploadUrlDto {
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
    description: 'ID of the user uploading the file',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  uploaderId?: number;
}
