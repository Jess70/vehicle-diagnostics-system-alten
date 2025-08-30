import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileProcessorConsumer } from './file-processor.consumer';
import { LogParserService } from '../../utils/log-parser.service';
import { File } from '../../entities/file.entity';
import { LogEntry } from '../../entities/log-entry.entity';
import { FilesModule } from '../files/files.module';
import { LogsModule } from '../logs/logs.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { StorageModule } from '../storage/storage.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'file-processing',
    }),
    TypeOrmModule.forFeature([File, LogEntry]),
    StorageModule,
    forwardRef(() => FilesModule),
    LogsModule,
    WebSocketModule,
    MetricsModule,
  ],
  providers: [FileProcessorConsumer, LogParserService],
  exports: [FileProcessorConsumer, LogParserService],
})
export class QueueModule {}

