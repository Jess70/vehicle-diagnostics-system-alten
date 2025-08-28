import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FileDto {
  id: number;
  filename: string;
  storagePath: string;
  bucketName: string;
  objectName: string;
  sizeBytes: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  lastProcessedOffset: number;
  lastProcessedLine?: number;
  attempts: number;
  retentionDays: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntryDto {
  id: number;
  vehicleId: string;
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  code: string;
  message: string;
  createdAt: string;
}

export interface PaginatedLogsDto {
  data: LogEntryDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LogQueryParams {
  vehicle?: string;
  code?: string;
  level?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileUploadResponse {
  message: string;
  fileId: number;
  status: string;
}

export interface PreSignedUploadResponse {
  uploadUrl: string;
  fileId: number;
  bucket: string;
  objectName: string;
  expiresIn: number;
  message: string;
}

export interface LogStats {
  totalLogs: number;
  uniqueVehicles: number;
  uniqueCodes: number;
  logsByLevel: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.backendUrl + '/api';

  constructor(private http: HttpClient) {}

  async generateUploadUrl(filename: string, contentType?: string): Promise<PreSignedUploadResponse> {
    const payload: { filename: string; contentType?: string } = { filename };
    if (contentType) {
      payload.contentType = contentType;
    }

    return firstValueFrom(
      this.http.post<PreSignedUploadResponse>(`${this.baseUrl}/files/upload-url`, payload)
    );
  }

  async uploadFileToMinIO(url: string, file: File, progressCallback?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      console.log('Uploading to MinIO URL:', url);
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = (event.loaded / event.total) * 100;
          progressCallback(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('MinIO upload successful');
          resolve();
        } else {
          console.error('MinIO upload failed with status:', xhr.status);
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('MinIO upload error');
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  }

  async notifyUploadComplete(fileId: number, sizeBytes: number): Promise<FileUploadResponse> {
    return firstValueFrom(
      this.http.post<FileUploadResponse>(`${this.baseUrl}/files/${fileId}/upload-complete`, {
        sizeBytes
      })
    );
  }

  async uploadFile(file: File, progressCallback?: (progress: number) => void): Promise<FileUploadResponse> {
    try {
      const uploadResponse = await this.generateUploadUrl(file.name, file.type);
      await this.uploadFileToMinIO(uploadResponse.uploadUrl, file, progressCallback);
      return await this.notifyUploadComplete(uploadResponse.fileId, file.size);
    } catch (error) {
      throw new Error(`File upload failed: ${error}`);
    }
  }

  async getFiles(): Promise<FileDto[]> {
    return firstValueFrom(
      this.http.get<FileDto[]>(`${this.baseUrl}/files`)
    );
  }

  async getFile(id: number): Promise<FileDto> {
    return firstValueFrom(
      this.http.get<FileDto>(`${this.baseUrl}/files/${id}`)
    );
  }

  async getFileProgress(id: number): Promise<{
    fileId: number;
    status: string;
    progressPercent: number;
    processedBytes: number;
    totalBytes: number;
    processedEntries: number;
    lastUpdated: string;
  }> {
    return firstValueFrom(
      this.http.get<{
        fileId: number;
        status: string;
        progressPercent: number;
        processedBytes: number;
        totalBytes: number;
        processedEntries: number;
        lastUpdated: string;
      }>(`${this.baseUrl}/files/${id}/progress`)
    );
  }

  async deleteFile(id: number): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${this.baseUrl}/files/${id}`)
    );
  }

  async getLogs(params: LogQueryParams = {}): Promise<PaginatedLogsDto> {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return firstValueFrom(
      this.http.get<PaginatedLogsDto>(`${this.baseUrl}/logs`, { params: httpParams })
    );
  }

  async getLogStats(): Promise<LogStats> {
    return firstValueFrom(
      this.http.get<LogStats>(`${this.baseUrl}/logs/stats`)
    );
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: {
      totalFiles: number;
      pendingFiles: number;
      processingFiles: number;
      totalLogs: number;
      uptime: number;
    };
  }> {
    return firstValueFrom(
      this.http.get<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, boolean>;
        metrics: {
          totalFiles: number;
          pendingFiles: number;
          processingFiles: number;
          totalLogs: number;
          uptime: number;
        };
      }>(`${this.baseUrl}/metrics/health`)
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (error) {
      return dateString;
    }
  }

  formatDateShort(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 10);
    } catch (error) {
      return dateString;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PROCESSING': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getLogLevelColor(level: string): string {
    switch (level) {
      case 'INFO': return 'log-level-info';
      case 'WARN': return 'log-level-warn';
      case 'ERROR': return 'log-level-error';
      case 'DEBUG': return 'log-level-debug';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
}
