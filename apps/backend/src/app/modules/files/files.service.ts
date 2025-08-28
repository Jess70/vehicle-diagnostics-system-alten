import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { File, FileStatus } from '../../entities/file.entity';
import { FileDto, FileUploadResponseDto, FileProcessingProgressDto } from '../../dto/file.dto';
import { StorageService } from '../storage/storage.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectQueue('file-processing')
    private readonly fileProcessingQueue: Queue,
    private readonly storageService: StorageService,
    private readonly metricsService: MetricsService,
  ) {}

  async generateUploadUrl(filename: string, contentType?: string, uploaderId?: number) {
    this.logger.log(`Generating upload URL for: ${filename}`);

    const uploadDetails = await this.storageService.generatePreSignedUrl(filename, contentType);

    const fileEntity = this.fileRepository.create({
      filename,
      storagePath: `${uploadDetails.bucket}/${uploadDetails.objectName}`, 
      bucketName: uploadDetails.bucket,
      objectName: uploadDetails.objectName,
      uploaderId,
      sizeBytes: 0, 
      status: FileStatus.PENDING,
    });

    const savedFile = await this.fileRepository.save(fileEntity);

    return {
      ...uploadDetails,
      fileId: savedFile.id,
      message: 'Upload URL generated successfully',
    };
  }

  async notifyUploadComplete(fileId: number, sizeBytes: number): Promise<FileUploadResponseDto> {
    this.logger.log(`Upload complete notification for file: ${fileId}`);

    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    await this.fileRepository.update(fileId, {
      sizeBytes,
      status: FileStatus.PENDING, 
    });

    await this.fileProcessingQueue.add('process-file', {
      fileId: file.id,
      bucketName: file.bucketName,
      objectName: file.objectName,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.metricsService.incrementFilesUploaded('success');
    
    this.logger.log(`File queued for processing: ${fileId}`);

    return {
      message: 'File upload confirmed and queued for processing',
      fileId: file.id,
      status: FileStatus.PENDING,
    };
  }

  async findAll(): Promise<FileDto[]> {
    const files = await this.fileRepository.find({
      order: { createdAt: 'DESC' },
    });

    return files.map(file => this.mapFileToDto(file));
  }

  async findById(id: number): Promise<FileDto> {
    const file = await this.fileRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return this.mapFileToDto(file);
  }

  async updateFileStatus(
    fileId: number, 
    status: FileStatus, 
    errorMessage?: string,
    lastProcessedOffset?: number,
    lastProcessedLine?: number
  ): Promise<void> {
    const updateData: { status: FileStatus; errorMessage?: string; lastProcessedOffset?: number; lastProcessedLine?: number } = { status };
    
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }
    
    if (lastProcessedOffset !== undefined) {
      updateData.lastProcessedOffset = lastProcessedOffset;
    }
    
    if (lastProcessedLine !== undefined) {
      updateData.lastProcessedLine = lastProcessedLine;
    }

    await this.fileRepository.update(fileId, updateData);
    this.logger.log(`File ${fileId} status updated to ${status}`);
  }

  async getProcessingProgress(fileId: number): Promise<FileProcessingProgressDto> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['logs'],
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const progressPercent = file.sizeBytes > 0 
      ? (file.lastProcessedOffset / file.sizeBytes) * 100 
      : 0;

    return {
      fileId: file.id,
      status: file.status,
      progressPercent: Math.round(progressPercent * 100) / 100,
      processedBytes: file.lastProcessedOffset,
      totalBytes: file.sizeBytes,
      processedEntries: file.logs?.length || 0,
      lastUpdated: file.updatedAt,
    };
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    try {
      await this.storageService.deleteObject(file.objectName);
    } catch (error) {
      this.logger.warn(`Could not delete file from storage: ${file.objectName}`, error);
    }

    await this.fileRepository.delete(id);
    this.logger.log(`File ${id} deleted successfully`);
  }

  private mapFileToDto(file: File): FileDto {
    return {
      id: file.id,
      filename: file.filename,
      storagePath: file.storagePath,
      bucketName: file.bucketName,
      objectName: file.objectName,
      sizeBytes: file.sizeBytes,
      status: file.status,
      lastProcessedOffset: file.lastProcessedOffset,
      lastProcessedLine: file.lastProcessedLine,
      attempts: file.attempts,
      retentionDays: file.retentionDays,
      errorMessage: file.errorMessage,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
