import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  const config = new DocumentBuilder()
    .setTitle('Vehicle Diagnostics API')
    .setDescription('API for vehicle diagnostic log processing and querying')
    .setVersion('1.0')
    .addTag('files', 'File upload and management')
    .addTag('logs', 'Vehicle diagnostic logs')
    .addTag('metrics', 'System metrics')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const configService = app.get(ConfigService);
  const port = configService.get('app.port');
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
