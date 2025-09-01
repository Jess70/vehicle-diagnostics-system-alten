import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class PrometheusHealthIndicator {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const prometheusUrl = this.configService.get('monitoring.prometheusUrl');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${prometheusUrl}/-/healthy`).pipe(
          timeout(5000) 
        )
      );

      const isHealthy = response.status === 200;
      
      if (isHealthy) {
        return indicator.up({
          url: prometheusUrl,
          status: 'connected',
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
      } else {
        return indicator.down({
          url: prometheusUrl,
          status: 'disconnected',
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
      }
    } catch (error) {
      const errorMessage = error.message || 'Prometheus connection failed';
      return indicator.down({
        url: prometheusUrl,
        status: 'disconnected',
        error: errorMessage
      });
    }
  }
}