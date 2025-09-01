import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  FileDto, 
  LogQueryParams, 
  PaginatedLogsDto, 
  FileUploadResponse,
  PreSignedUploadResponse
} from '../types';

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
      

      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = (event.loaded / event.total) * 100;
          progressCallback(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {

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

  async deleteFile(fileId: number): Promise<void> {

    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/files/${fileId}`)
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

  async getTotalLogsCount(): Promise<{ total: number }> {
    return firstValueFrom(
      this.http.get<{ total: number }>(`${this.baseUrl}/logs/count`)
    );
  }
}