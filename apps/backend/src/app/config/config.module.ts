import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { 
  appConfig, 
  databaseConfig, 
  redisConfig, 
  minioConfig, 
  fileProcessingConfig,
  monitoringConfig,
  validationSchema 
} from './configuration';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        minioConfig,
        fileProcessingConfig,
        monitoringConfig,
      ],
      envFilePath: ['.env', '.env.local', '.env.development'],
      validationSchema,
      validationOptions: {
        allowUnknown: true, 
        abortEarly: true,    // Stop on first validation error
      },
      expandVariables: true, // Allow variable expansion like ${VAR}
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
