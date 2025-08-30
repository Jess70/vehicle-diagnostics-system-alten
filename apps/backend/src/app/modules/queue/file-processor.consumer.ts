import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../entities/file.entity';
import { LogParserService } from '../../utils/log-parser.service';
import { LogsService } from '../logs/logs.service';
import { FilesService } from '../files/files.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { StorageService } from '../storage/storage.service';
import { MetricsService } from '../metrics/metrics.service';

import { 
  FileProcessingException, 
  FileNotFoundProcessingException, 
  StorageProcessingException, 
  ParseProcessingException 
} from '../../exceptions/file-processing.exception';
import { FileProcessingExceptionFilter } from '../../filters/file-processing-exception.filter';

interface FileProcessingJob {
  fileId: number;
  bucketName: string;
  objectName: string;
}

@Processor('file-processing')
@UseFilters(FileProcessingExceptionFilter)
export class FileProcessorConsumer {
  private readonly logger = new Logger(FileProcessorConsumer.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly logParserService: LogParserService,
    private readonly logsService: LogsService,
    private readonly filesService: FilesService,
    private readonly notificationGateway: NotificationGateway,
    private readonly storageService: StorageService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {}

  @Process('process-file')
  async processFile(job: Job<FileProcessingJob>): Promise<void> {
    const { fileId, bucketName, objectName } = job.data;
    const startTime = Date.now();
    
    this.logger.log(`Processing file ${fileId}: ${bucketName}/${objectName}`);

    try {
      await this.filesService.updateFileStatus(fileId, FileStatus.PROCESSING);
      
      this.notificationGateway.emitFileStatusUpdate(fileId, {
        status: FileStatus.PROCESSING,
        progressPercent: 0,
        message: 'Started processing file'
      });

      const file = await this.fileRepository.findOne({ where: { id: fileId } });
      if (!file) {
        throw new FileNotFoundProcessingException(fileId);
      }

      const objectInfo = await this.storageService.getObjectInfo(objectName);
      const fileSize = objectInfo.size;
      
      let totalProcessedBytes = file.lastProcessedOffset || 0;
      let totalProcessedEntries = 0;
      let batchNumber = 0;

      const stream = await this.storageService.getObject(objectName);
      this.logger.log(`Starting to parse stream from offset ${totalProcessedBytes}`);
      const parseResult = await this.logParserService.parseStreamFromOffset(
        stream,
        totalProcessedBytes
      );
      this.logger.log(`Parsed ${parseResult.entries.length} entries from stream`);

      if (parseResult.entries.length > 0) {
       
        const batchSize = this.configService.get('fileProcessing.logParseBatchSize');
        
        for (let i = 0; i < parseResult.entries.length; i += batchSize) {
          batchNumber++;
          const batch = parseResult.entries.slice(i, i + batchSize);
          
        
          const batchWithFile = batch.map(entry => ({
            ...entry,
            file: file
          }));
          
          await this.logsService.bulkInsertLogs(batchWithFile);
          totalProcessedEntries += batch.length;

          const currentProgress = ((i + batch.length) / parseResult.entries.length) * 100;
          await job.progress(Math.round(currentProgress));

          this.notificationGateway.emitFileStatusUpdate(fileId, {
            status: FileStatus.PROCESSING,
            progressPercent: Math.round(currentProgress),
            processedBytes: parseResult.processedBytes,
            totalBytes: fileSize,
            processedEntries: totalProcessedEntries,
            message: `Processing batch ${batchNumber} (${totalProcessedEntries} entries)`
          });

          this.logger.log(
            `File ${fileId} - Batch ${batchNumber}: ${batch.length} entries, ` +
            `${Math.round(currentProgress)}% complete (${totalProcessedEntries}/${parseResult.entries.length} entries)`
          );
        }
      }

      totalProcessedBytes = parseResult.processedBytes;
      
      await this.filesService.updateFileStatus(
        fileId,
        FileStatus.PROCESSING,
        undefined,
        totalProcessedBytes,
        (file.lastProcessedLine || 0) + parseResult.processedLines
      );

      await this.filesService.updateFileStatus(fileId, FileStatus.COMPLETED);
      
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
      if (error instanceof FileProcessingException) {
        throw error; 
      }
      
      if (error.message?.includes('storage') || error.message?.includes('MinIO')) {
        throw new StorageProcessingException(fileId, error.message);
      }
      
      if (error.message?.includes('parse') || error.message?.includes('format')) {
        throw new ParseProcessingException(fileId, error.message);
      }
      
      throw new FileProcessingException(error.message || 'Unknown processing error', fileId);
    }
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error('Queue processing error:', error);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }
}

