import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyUploadCompleteDto {
  @ApiProperty({ 
    description: 'Size of the uploaded file in bytes',
    example: 1048576,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  sizeBytes: number;
}
