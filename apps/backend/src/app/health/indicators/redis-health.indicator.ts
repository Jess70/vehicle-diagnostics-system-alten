import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  private redis: Redis;

  constructor(
    private configService: ConfigService,
    private healthIndicatorService: HealthIndicatorService,
  ) {
    
    // Create Redis connection for health checks
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      connectTimeout: 5000,
      lazyConnect: true,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    
    try {
      const host = this.configService.get('redis.host');
      const port = this.configService.get('redis.port');
      
      // Test Redis connectivity with ping
      const pong = await this.redis.ping();
      const isHealthy = pong === 'PONG';
      
      if (isHealthy) {
        return indicator.up({
          host,
          port,
          status: 'connected'
        });
      } else {
        return indicator.down({
          host,
          port,
          status: 'disconnected',
          error: 'Redis ping failed'
        });
      }
    } catch (error) {
      const errorMessage = error.message || 'Redis connection failed';
      return indicator.down({
        host: this.configService.get('redis.host'),
        port: this.configService.get('redis.port'),
        status: 'disconnected',
        error: errorMessage
      });
    }
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}