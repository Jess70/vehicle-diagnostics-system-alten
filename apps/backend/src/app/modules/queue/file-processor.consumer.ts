import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../entities/file.entity';
import { LogParserService } from '../../utils/log-parser.service';
import { LogsService } from '../logs/logs.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { StorageService } from '../storage/storage.service';
import { MetricsService } from '../metrics/metrics.service';

interface FileProcessingJob {
  fileId: number;
  bucketName: string;
  objectName: string;
}

@Processor('file-processing')
export class FileProcessorConsumer {
  private readonly logger = new Logger(FileProcessorConsumer.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly logParserService: LogParserService,
    private readonly logsService: LogsService,
    private readonly notificationGateway: NotificationGateway,
    private readonly storageService: StorageService,
    private readonly metricsService: MetricsService,
  ) {}

  @Process('process-file')
  async processFile(job: Job<FileProcessingJob>): Promise<void> {
    const { fileId, bucketName, objectName } = job.data;
    
    this.logger.log(`Processing file ${fileId}: ${bucketName}/${objectName}`);

    try {
      await this.updateFileStatus(fileId, FileStatus.PROCESSING);
      
      this.notificationGateway.emitFileStatusUpdate(fileId, {
        status: FileStatus.PROCESSING,
        progressPercent: 0,
        message: 'Started processing file'
      });

      const file = await this.fileRepository.findOne({ where: { id: fileId } });
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      const objectInfo = await this.storageService.getObjectInfo(objectName);
      const fileSize = objectInfo.size;
      
      let totalProcessedBytes = file.lastProcessedOffset || 0;
      let totalProcessedEntries = 0;
      let batchNumber = 0;

      while (totalProcessedBytes < fileSize) {
        batchNumber++;
        
        const stream = await this.storageService.getObject(objectName);
        
        const parseResult = await this.logParserService.parseStream(
          stream,
          fileId,
          totalProcessedBytes
        );

        if (parseResult.entries.length === 0 && parseResult.processedBytes === totalProcessedBytes) {
          break;
        }

        if (parseResult.entries.length > 0) {
          await this.logsService.bulkInsertLogs(parseResult.entries);
          totalProcessedEntries += parseResult.entries.length;
        }

        totalProcessedBytes = parseResult.processedBytes;
        
        await this.fileRepository.update(fileId, {
          lastProcessedOffset: totalProcessedBytes,
          lastProcessedLine: (file.lastProcessedLine || 0) + parseResult.processedLines,
        });

        const progressPercent = (totalProcessedBytes / fileSize) * 100;
        await job.progress(Math.round(progressPercent));

        this.notificationGateway.emitFileStatusUpdate(fileId, {
          status: FileStatus.PROCESSING,
          progressPercent: Math.round(progressPercent),
          processedBytes: totalProcessedBytes,
          totalBytes: fileSize,
          processedEntries: totalProcessedEntries,
          message: `Processing batch ${batchNumber}`
        });

        this.logger.log(
          `File ${fileId} - Batch ${batchNumber}: ${parseResult.entries.length} entries, ` +
          `${Math.round(progressPercent)}% complete`
        );
      }

      await this.updateFileStatus(fileId, FileStatus.COMPLETED);
      
      this.metricsService.incrementFilesProcessed();
      
      this.notificationGateway.emitFileStatusUpdate(fileId, {
        status: FileStatus.COMPLETED,
        progressPercent: 100,
        processedBytes: totalProcessedBytes,
        totalBytes: fileSize,
        processedEntries: totalProcessedEntries,
        message: `Processing completed successfully`
      });

      this.logger.log(
        `File ${fileId} processing completed. ` +
        `Total entries: ${totalProcessedEntries}, Size: ${totalProcessedBytes} bytes`
      );

    } catch (error) {
      this.logger.error(`Error processing file ${fileId}`, error);
      
      await this.updateFileStatus(fileId, FileStatus.FAILED, error.message);
      
      this.metricsService.incrementFilesFailed(error.name || 'unknown');
      
      this.notificationGateway.emitFileStatusUpdate(fileId, {
        status: FileStatus.FAILED,
        progressPercent: 0,
        message: `Processing failed: ${error.message}`
      });

      throw error; 
    }
  }

  private async updateFileStatus(
    fileId: number,
    status: FileStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: { status: FileStatus; errorMessage?: string; lastProcessedOffset?: number; lastProcessedLine?: number } = { status };
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.fileRepository.update(fileId, updateData);
  }


}

