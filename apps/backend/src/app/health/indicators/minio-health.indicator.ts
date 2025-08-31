import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { StorageService } from '../../modules/storage/storage.service';

@Injectable()
export class MinioHealthIndicator {
  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    
    try {
      const bucketName = this.configService.get('minio.bucket');
      const endpoint = this.configService.get('minio.endpoint');
      
      // Test MinIO connectivity by checking if bucket exists
      const bucketExists = await this.storageService['minioClient'].bucketExists(bucketName);
      
      if (bucketExists) {
        return indicator.up({
          endpoint,
          bucket: bucketName,
          status: 'connected'
        });
      } else {
        return indicator.down({
          endpoint,
          bucket: bucketName,
          status: 'disconnected',
          error: 'Bucket does not exist'
        });
      }
    } catch (error) {
      const errorMessage = error.message || 'MinIO connection failed';
      return indicator.down({
        endpoint: this.configService.get('minio.endpoint'),
        bucket: this.configService.get('minio.bucket'),
        status: 'disconnected',
        error: errorMessage
      });
    }
  }
}