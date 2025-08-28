import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File } from '../../entities/file.entity';
import { LogEntry } from '../../entities/log-entry.entity';
import { StorageModule } from '../storage/storage.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, LogEntry]),
    BullModule.registerQueue({
      name: 'file-processing',
    }),
    StorageModule,
    MetricsModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

