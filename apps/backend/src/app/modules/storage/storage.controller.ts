import { Controller, Post, Body, Get, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { StorageService, PreSignedUrlResponse } from './storage.service';
import { StorageUploadUrlDto } from '../../dto/storage-upload-url.dto';

@ApiTags('Storage')
@Controller('api/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate pre-signed URL for file upload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pre-signed URL generated successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or parameters' })
  @ApiBody({ type: StorageUploadUrlDto })
  async generateUploadUrl(
    @Body() generateUploadUrlDto: StorageUploadUrlDto
  ): Promise<PreSignedUrlResponse> {
    const { filename, contentType, expiresIn = 3600 } = generateUploadUrlDto;
    
    return await this.storageService.generatePreSignedUrl(
      filename,
      contentType,
      expiresIn
    );
  }

  @Get('objects')
  @ApiOperation({ summary: 'List objects in storage' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Filter objects by prefix' })
  async listObjects(@Query('prefix') prefix?: string) {
    return await this.storageService.listObjects(prefix);
  }

  @Get('objects/:objectName/info')
  @ApiOperation({ summary: 'Get object information' })
  async getObjectInfo(@Param('objectName') objectName: string) {
    return await this.storageService.getObjectInfo(objectName);
  }

  @Delete('objects/:objectName')
  @ApiOperation({ summary: 'Delete object from storage' })
  async deleteObject(@Param('objectName') objectName: string) {
    await this.storageService.deleteObject(objectName);
    return { message: `Object ${objectName} deleted successfully` };
  }
}
