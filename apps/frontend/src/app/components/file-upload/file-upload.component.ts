import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { WebSocketService, FileStatusUpdate } from '../../services/websocket.service';

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
  styleUrls: ['./file-upload.component.scss']
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
