import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
}));


export const databaseConfig = registerAs('database', () => ({
  path: process.env.DATABASE_PATH || '/usr/src/app/data/vehicle_diagnostics.db',
}));


export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));


export const minioConfig = registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
  publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT || 'localhost:9000',
  bucket: process.env.MINIO_BUCKET || 'vehicle-logs',
  rootUser: process.env.MINIO_ROOT_USER || 'minioadmin',
  rootPassword: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
}));


export const fileProcessingConfig = registerAs('fileProcessing', () => ({
  supportedFormats: (process.env.SUPPORTED_FORMATS || '.txt,.log').split(',').map(f => f.trim()),
  logParseBatchSize: parseInt(process.env.LOG_PARSE_BATCH_SIZE || '100', 10),
}));

export const monitoringConfig = registerAs('monitoring', () => ({
  prometheusUrl: process.env.PROMETHEUS_URL || 'http://localhost:9090',
}));


export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(3000),

  DATABASE_PATH: Joi.string()
    .required()
    .description('SQLite database file path'),

  REDIS_HOST: Joi.string()
    .hostname()
    .default('localhost'),
  REDIS_PORT: Joi.number()
    .port()
    .default(6379),

  MINIO_ENDPOINT: Joi.string()
    .pattern(/^[a-zA-Z0-9.-]+:\d+$/)
    .required()
    .description('MinIO endpoint in format host:port'),
  MINIO_PUBLIC_ENDPOINT: Joi.string()
    .pattern(/^[a-zA-Z0-9.-]+:\d+$/)
    .required()
    .description('MinIO public endpoint in format host:port'),
  MINIO_BUCKET: Joi.string()
    .pattern(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/)
    .required()
    .description('MinIO bucket name (lowercase, alphanumeric with dots and hyphens)'),
  MINIO_ROOT_USER: Joi.string()
    .min(3)
    .required()
    .description('MinIO root user'),
  MINIO_ROOT_PASSWORD: Joi.string()
    .min(8)
    .required()
    .description('MinIO root password'),

  SUPPORTED_FORMATS: Joi.string()
    .pattern(/^(\.[a-z]+)(,\.[a-z]+)*$/)
    .default('.txt,.log')
    .description('Comma-separated list of supported file extensions'),
  LOG_PARSE_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(100)
    .description('Number of log entries to process per batch'),

  PROMETHEUS_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:9090')
    .description('Prometheus server URL for health checks'),
});

export const configuration = () => ({
  app: appConfig(),
  database: databaseConfig(),
  redis: redisConfig(),
  minio: minioConfig(),
  fileProcessing: fileProcessingConfig(),
  monitoring: monitoringConfig(),
});
