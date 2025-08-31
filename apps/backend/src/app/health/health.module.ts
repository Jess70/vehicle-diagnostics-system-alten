import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MinioHealthIndicator } from './indicators/minio-health.indicator';
import { PrometheusHealthIndicator } from './indicators/prometheus-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { File } from '../entities/file.entity';
import { LogEntry } from '../entities/log-entry.entity';
import { StorageModule } from '../modules/storage/storage.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    MinioHealthIndicator,
    PrometheusHealthIndicator,
    RedisHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}
