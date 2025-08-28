import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { File } from './entities/file.entity';
import { LogEntry } from './entities/log-entry.entity';
import { FilesModule } from './modules/files/files.module';
import { LogsModule } from './modules/logs/logs.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'vehicle_diagnostics.db'),
      entities: [File, LogEntry],
      synchronize: true, 
      logging: process.env.NODE_ENV === 'development',
    }),

    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: 3,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),



    StorageModule,
    FilesModule,
    LogsModule,
    QueueModule,
    WebSocketModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
