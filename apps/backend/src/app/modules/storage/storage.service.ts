import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export interface PreSignedUrlResponse {
  uploadUrl: string;
  fileId: string;
  bucket: string;
  objectName: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client; 
  private readonly publicMinioClient: Minio.Client; 
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost:9000');
    const [host, port] = minioEndpoint.split(':');

    this.minioClient = new Minio.Client({
      endPoint: host,
      port: parseInt(port, 10),
      useSSL: false, 
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123'),
    });

    this.publicMinioClient = this.minioClient;

    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'vehicle-logs');
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, '');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket: ${error.message}`, error.stack);
    }
  }

  async generatePreSignedUrl(
    filename: string,
    contentType?: string,
    expiresIn: number = 3600 
  ): Promise<PreSignedUrlResponse> {
    try {
      const allowedExtensions = ['.txt', '.log'];
      const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `File type ${fileExtension} not allowed. Supported types: ${allowedExtensions.join(', ')}`
        );
      }

      const fileId = uuidv4();
      const objectName = `uploads/${Date.now()}-${fileId}/${filename}`;

      const uploadUrl = await this.publicMinioClient.presignedUrl(
        'PUT',
        this.bucketName,
        objectName,
        expiresIn,
        {
          'Content-Type': contentType || 'application/octet-stream',
        }
      );
      
      this.logger.log(`Generated upload URL: ${uploadUrl.substring(0, 100)}...`);

      return {
        uploadUrl,
        fileId,
        bucket: this.bucketName,
        objectName,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to generate pre-signed URL: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async getObject(objectName: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.minioClient.getObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error(`Failed to get object ${objectName}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve file: ${objectName}`);
    }
  }

  async getObjectInfo(objectName: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.minioClient.statObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error(`Failed to get object info ${objectName}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get file info: ${objectName}`);
    }
  }

  async deleteObject(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`Object ${objectName} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete object ${objectName}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete file: ${objectName}`);
    }
  }

  async listObjects(prefix?: string): Promise<Minio.BucketItem[]> {
    try {
      const objects: Minio.BucketItem[] = [];
      const stream = this.minioClient.listObjects(this.bucketName, prefix, false);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj: Minio.BucketItem) => objects.push(obj));
        stream.on('error', reject);
        stream.on('end', () => resolve(objects));
      });
    } catch (error) {
      this.logger.error(`Failed to list objects: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to list files');
    }
  }
}
