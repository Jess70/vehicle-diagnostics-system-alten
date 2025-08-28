import { 
  Controller, 
  Post, 
  Get, 
  Delete,
  Param, 
  Body,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { FilesService } from './files.service';
import { FileDto, FileUploadResponseDto, FileProcessingProgressDto } from '../../dto/file.dto';

class GenerateUploadUrlDto {
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsNumber()
  uploaderId?: number;
}

class NotifyUploadCompleteDto {
  @IsNumber()
  @Min(1)
  sizeBytes: number;
}

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @ApiOperation({ 
    summary: 'Generate pre-signed URL for file upload',
    description: 'Generate a pre-signed URL to upload files directly to MinIO. Supported formats: .txt, .log, .csv, .jsonl' 
  })
  @ApiBody({ type: GenerateUploadUrlDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Pre-signed URL generated successfully',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid file type or parameters' 
  })
  async generateUploadUrl(@Body() generateUploadUrlDto: GenerateUploadUrlDto) {
    return this.filesService.generateUploadUrl(
      generateUploadUrlDto.filename,
      generateUploadUrlDto.contentType,
      generateUploadUrlDto.uploaderId
    );
  }

  @Post(':id/upload-complete')
  @ApiOperation({ 
    summary: 'Notify upload completion',
    description: 'Notify the backend that file upload to MinIO is complete and ready for processing' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number', 
    description: 'File ID returned from upload-url endpoint' 
  })
  @ApiBody({ type: NotifyUploadCompleteDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload completion confirmed, file queued for processing',
    type: FileUploadResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'File not found' 
  })
  async notifyUploadComplete(
    @Param('id', ParseIntPipe) id: number,
    @Body() notifyUploadCompleteDto: NotifyUploadCompleteDto
  ): Promise<FileUploadResponseDto> {
    return this.filesService.notifyUploadComplete(id, notifyUploadCompleteDto.sizeBytes);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all uploaded files',
    description: 'Retrieve a list of all uploaded files with their processing status' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of files retrieved successfully',
    type: [FileDto] 
  })
  async findAll(): Promise<FileDto[]> {
    return this.filesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get file by ID',
    description: 'Retrieve detailed information about a specific file' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number', 
    description: 'File ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'File details retrieved successfully',
    type: FileDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'File not found' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FileDto> {
    return this.filesService.findById(id);
  }

  @Get(':id/progress')
  @ApiOperation({ 
    summary: 'Get file processing progress',
    description: 'Get real-time processing progress for a specific file' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number', 
    description: 'File ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Processing progress retrieved successfully',
    type: FileProcessingProgressDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'File not found' 
  })
  async getProgress(@Param('id', ParseIntPipe) id: number): Promise<FileProcessingProgressDto> {
    return this.filesService.getProcessingProgress(id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete file',
    description: 'Delete a file and all its associated log entries' 
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number', 
    description: 'File ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'File deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'File not found' 
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.filesService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }
}
