import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { File } from './entities/file.entity';
import { LogEntry } from './entities/log-entry.entity';
import { AppConfigModule } from './config/config.module';
import { FilesModule } from './modules/files/files.module';
import { LogsModule } from './modules/logs/logs.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('database.path'),
        entities: [File, LogEntry],
        synchronize: true, 
        logging: configService.get('app.nodeEnv') === 'development',
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          maxRetriesPerRequest: 3,
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      }),
    }),



    StorageModule,
    FilesModule,
    LogsModule,
    QueueModule,
    WebSocketModule,
    MetricsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
