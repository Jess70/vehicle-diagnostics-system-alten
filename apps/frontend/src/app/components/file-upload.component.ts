import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { WebSocketService, FileStatusUpdate } from '../services/websocket.service';

interface UploadingFile {
  file: File;
  fileId?: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.component.html',
  styles: [`
    .file-upload-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .upload-card {
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .upload-dropzone {
      min-height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 3px dashed #e0e0e0;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      position: relative;
      overflow: hidden;
    }
    
    .upload-dropzone::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .upload-dropzone:hover {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04);
    }
    
    .upload-dropzone:hover::before {
      left: 100%;
    }
    
    .upload-dropzone.dragover {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      transform: scale(1.02);
      box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04);
    }
    
    .upload-icon {
      margin-bottom: 16px;
    }
    
    .upload-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6b7280;
      transition: all 0.3s ease;
    }
    
    .upload-dropzone:hover .upload-icon mat-icon {
      color: #3b82f6;
      transform: scale(1.1);
    }
    
    .upload-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    .upload-description {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    /* Select Files Button Styling */
    .upload-dropzone button[mat-raised-button] {
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
    }
    
    .upload-dropzone button[mat-raised-button]:hover {
      border-color: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 8px 15px -3px rgba(59, 130, 246, 0.3);
    }
    
    .upload-dropzone button[mat-raised-button]:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px -1px rgba(59, 130, 246, 0.2);
    }
    
    .upload-progress {
      margin-top: 24px;
    }
    
    .file-item {
      margin-bottom: 16px;
      padding: 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid #f3f4f6;
      transition: all 0.3s ease;
    }
    
    .file-item:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }
    
    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
    }
    
    .file-info mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-right: 12px;
    }
    
    .file-details {
      flex: 1;
    }
    
    .file-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 16px;
      margin-bottom: 4px;
      word-break: break-word;
    }
    
    .file-size {
      font-size: 14px;
      color: #6b7280;
    }
    
    .file-status {
      text-align: right;
      min-width: 140px;
    }
    
    .status-message {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .status-uploading { color: #3b82f6; }
    .status-processing { color: #f59e0b; }
    .status-completed { color: #10b981; }
    .status-failed { color: #ef4444; }
    
    .progress-text {
      font-size: 12px;
      color: #6b7280;
    }
    
    .progress-bar {
      margin: 12px 0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #ef4444;
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }
    
    .error-message mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .file-upload-container {
        padding: 16px;
      }
      
      .upload-dropzone {
        padding: 32px 16px;
      }
      
      .upload-title {
        font-size: 20px;
      }
      
      .upload-description {
        font-size: 14px;
      }
      
      .file-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .file-status {
        text-align: left;
        margin-top: 8px;
        min-width: auto;
      }
    }
  `]
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploadingFiles: UploadingFile[] = [];
  isDragOver = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    public apiService: ApiService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.webSocketService.fileUpdates
      .pipe(
        takeUntil(this.destroy$),
        filter((update): update is FileStatusUpdate => update !== null)
      )
      .subscribe(update => this.handleFileStatusUpdate(update));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    this.handleFiles(files);
    
    target.value = '';
  }

  onSelectFilesClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  private async handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      if (!this.validateFile(file)) {
        continue;
      }

      const uploadingFile: UploadingFile = {
        file,
        status: 'uploading',
        progress: 0,
        message: 'Uploading...'
      };

      this.uploadingFiles.push(uploadingFile);

      try {
        const response = await this.apiService.uploadFile(file, (progress) => {
          uploadingFile.progress = Math.round(progress);
          uploadingFile.message = `Uploading... ${Math.round(progress)}%`;
        });
        
        uploadingFile.fileId = response.fileId;
        uploadingFile.status = 'processing';
        uploadingFile.message = 'Upload complete, processing file...';
        uploadingFile.progress = 0;

        this.webSocketService.subscribeToFile(response.fileId);

        this.snackBar.open(`File "${file.name}" uploaded to storage successfully!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });

      } catch (error: unknown) {
        uploadingFile.status = 'failed';
        uploadingFile.message = 'Upload failed';
        uploadingFile.error = error instanceof Error ? error.message : 'Unknown error';

        this.snackBar.open(`Failed to upload "${file.name}"`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    }
  }

  private validateFile(file: File): boolean {
    const allowedTypes = ['.txt', '.log'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      this.snackBar.open(
        `File "${file.name}" has unsupported format. Allowed: ${allowedTypes.join(', ')}`,
        'Close',
        { duration: 5000, panelClass: 'error-snackbar' }
      );
      return false;
    }



    return true;
  }

  private handleFileStatusUpdate(update: FileStatusUpdate): void {
    const fileInfo = this.uploadingFiles.find(f => f.fileId === update.fileId);
    if (!fileInfo) return;

    fileInfo.progress = update.progressPercent;
    fileInfo.message = update.message;

    switch (update.status) {
      case 'PROCESSING':
        fileInfo.status = 'processing';
        break;
      case 'COMPLETED':
        fileInfo.status = 'completed';
        fileInfo.progress = 100;
        fileInfo.message = 'Processing completed successfully';
        
        this.snackBar.open(
          `File "${fileInfo.file.name}" processed successfully!`,
          'Close',
          { duration: 5000, panelClass: 'success-snackbar' }
        );
        break;
      case 'FAILED':
        fileInfo.status = 'failed';
        fileInfo.error = update.message;
        
        this.snackBar.open(
          `File "${fileInfo.file.name}" processing failed`,
          'Close',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
        break;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-orange-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getStatusIconName(status: string): string {
    switch (status) {
      case 'uploading': return 'cloud_upload';
      case 'processing': return 'settings';
      case 'completed': return 'check_circle';
      case 'failed': return 'error';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'uploading': return 'status-uploading';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      default: return 'text-gray-600';
    }
  }
}
