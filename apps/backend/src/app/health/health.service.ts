import { Injectable } from '@nestjs/common';
import { 
  HealthCheckService, 
  TypeOrmHealthIndicator, 
  HealthCheck,
  HealthCheckResult 
} from '@nestjs/terminus';
import { MinioHealthIndicator } from './indicators/minio-health.indicator';
import { PrometheusHealthIndicator } from './indicators/prometheus-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private minioHealth: MinioHealthIndicator,
    private prometheusHealth: PrometheusHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @HealthCheck()
  async checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.minioHealth.isHealthy('minio'),
      () => this.prometheusHealth.isHealthy('prometheus'),
    ]);
  }
}