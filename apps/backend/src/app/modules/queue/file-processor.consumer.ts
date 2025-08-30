import { Processor, Process } from '@nestjs/bull';
import { Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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
    private readonly filesService: FilesService,
    private readonly notificationGateway: NotificationGateway,
    private readonly storageService: StorageService,
    private readonly metricsService: MetricsService,
  ) {}

  @Process('process-file')
  async processFile(job: Job<FileProcessingJob>): Promise<void> {
    const { fileId, bucketName, objectName } = job.data;
    
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
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      const objectInfo = await this.storageService.getObjectInfo(objectName);
      const fileSize = objectInfo.size;
      
      let totalProcessedBytes = file.lastProcessedOffset || 0;
      let totalProcessedEntries = 0;
      let batchNumber = 0;

      // Download file once and parse all entries
      const stream = await this.storageService.getObject(objectName);
      this.logger.log(`Starting to parse stream from offset ${totalProcessedBytes}`);
      const parseResult = await this.logParserService.parseStreamFromOffset(
        stream,
        totalProcessedBytes
      );
      this.logger.log(`Parsed ${parseResult.entries.length} entries from stream`);

      if (parseResult.entries.length > 0) {
        // Process entries in batches for database insertion
        const batchSize = parseInt(process.env.LOG_PARSE_BATCH_SIZE || '100');
        
        for (let i = 0; i < parseResult.entries.length; i += batchSize) {
          batchNumber++;
          const batch = parseResult.entries.slice(i, i + batchSize);
          
          // Add file relation to each log entry
          const batchWithFile = batch.map(entry => ({
            ...entry,
            file: file
          }));
          
          await this.logsService.bulkInsertLogs(batchWithFile);
          totalProcessedEntries += batch.length;

          // Update progress tracking
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

      // Update final status
      totalProcessedBytes = parseResult.processedBytes;
      
      // Update file status with final progress
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
      this.logger.error(`Error processing file ${fileId}`, error);
      
      let errorMessage = 'Unknown error occurred';
      let errorType = 'unknown';
      
      if (error instanceof NotFoundException) {
        errorMessage = error.message;
        errorType = 'not_found';
      } else if (error instanceof InternalServerErrorException) {
        errorMessage = 'Storage service error';
        errorType = 'storage_error';
      } else if (error.message) {
        errorMessage = error.message;
        errorType = error.name || 'processing_error';
      }
      
      try {
        await this.filesService.updateFileStatus(fileId, FileStatus.FAILED, errorMessage);
      } catch (updateError) {
        this.logger.error(`Failed to update file status for ${fileId}`, updateError);
      }
      
      this.metricsService.incrementFilesFailed(errorType);
      
      try {
        this.notificationGateway.emitFileStatusUpdate(fileId, {
          status: FileStatus.FAILED,
          progressPercent: 0,
          message: `Processing failed: ${errorMessage}`
        });
      } catch (notificationError) {
        this.logger.error(`Failed to emit notification for ${fileId}`, notificationError);
      }

      throw error; 
    }
  }

}

