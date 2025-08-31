import { Injectable, Logger } from '@nestjs/common';
import { register, Counter } from 'prom-client';


@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  private readonly filesUploadedTotal = new Counter({
    name: 'files_uploaded_total',
    help: 'Total number of files uploaded',
  });

  private readonly filesProcessedTotal = new Counter({
    name: 'files_processed_total',
    help: 'Total number of files successfully processed',
  });

  private readonly filesFailedTotal = new Counter({
    name: 'files_failed_total',
    help: 'Total number of files that failed processing',
    labelNames: ['error_type'] as const,
  });


  constructor() {
    this.logger.log('Metrics service initialized');
    this.filesUploadedTotal.inc(0);
    this.filesProcessedTotal.inc(0);
    this.filesFailedTotal.inc({ error_type: 'unknown' }, 0);
  }


  incrementFilesUploaded(): void   {
    this.filesUploadedTotal.inc(1);
  }

  incrementFilesProcessed(): void {
    this.filesProcessedTotal.inc();
  }

  incrementFilesFailed(errorType: string = 'unknown'): void {
    this.filesFailedTotal.inc({ error_type: errorType });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  clearMetrics(): void {
    register.clear();
  }
}

