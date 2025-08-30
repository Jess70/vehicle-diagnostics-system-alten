import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { FileProcessingException } from '../exceptions/file-processing.exception';
import { FilesService } from '../modules/files/files.service';
import { MetricsService } from '../modules/metrics/metrics.service';
import { NotificationGateway } from '../modules/websocket/notification.gateway';
import { FileStatus } from '../entities/file.entity';

@Catch(FileProcessingException)
export class FileProcessingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FileProcessingExceptionFilter.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly metricsService: MetricsService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async catch(exception: FileProcessingException, host: ArgumentsHost) {
    const { fileId, errorType } = exception;
    const errorMessage = exception.message;

    this.logger.error(`File processing failed for ${fileId}: ${errorMessage}`, exception.stack);

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
    
    throw exception;
  }
}
