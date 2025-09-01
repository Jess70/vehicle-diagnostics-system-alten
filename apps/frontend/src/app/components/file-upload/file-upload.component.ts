import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { formatFileSize, validateFile } from '../../core/utils';
import { FileDto, FileStatus } from '../../core/types';
import { AppState } from '../../store/app.state';
import * as FilesActions from '../../store/actions/files.actions';
import { selectAllFiles } from '../../store/selectors/files.selectors';

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  processingFiles$!: Observable<FileDto[]>;
  isDragOver = false;
  private destroy$ = new Subject<void>();

  constructor(
    public apiService: ApiService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar,
    private store: Store<AppState>
  ) {}

  ngOnInit(): void {
      this.processingFiles$ = this.store.select(selectAllFiles).pipe(
        map(files => files.filter(file => 
          file.status === FileStatus.PENDING || 
          file.status === FileStatus.PROCESSING
        ))
      );
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

  private async handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        this.snackBar.open(validation.error!, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        continue;
      }

      try {
        const response = await this.apiService.uploadFile(file);

        const newFile: FileDto = {
          id: response.fileId,
          filename: file.name,
          storagePath: `uploads/${response.fileId}/${file.name}`,
          bucketName: 'vehicle-logs',
          objectName: file.name,
          status: FileStatus.PENDING,
          sizeBytes: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastProcessedLine: undefined,
          lastProcessedOffset: 0,
          attempts: 0,
          retentionDays: 30,
          errorMessage: undefined,
          progressPercent: 0
        };
        
        this.store.dispatch(FilesActions.addFile({ file: newFile }));
        this.webSocketService.subscribeToFile(response.fileId);

        this.snackBar.open(`File "${file.name}" uploaded to storage successfully!`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Upload failed for', file.name, ':', errorMessage);

        this.snackBar.open(`Failed to upload "${file.name}": ${errorMessage}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    }
  }

  getFileStatusIcon(status: FileStatus): string {
    switch (status) {
      case FileStatus.PENDING: return 'schedule';
      case FileStatus.PROCESSING: return 'autorenew';
      case FileStatus.COMPLETED: return 'check_circle';
      case FileStatus.FAILED: return 'error';
      default: return 'help';
    }
  }

  getFileStatusIconColor(status: FileStatus): string {
    switch (status) {
      case FileStatus.PENDING: return 'text-yellow-600';
      case FileStatus.PROCESSING: return 'text-orange-600';
      case FileStatus.COMPLETED: return 'text-green-600';
      case FileStatus.FAILED: return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getFileStatusColor(status: FileStatus): string {
    switch (status) {
      case FileStatus.PENDING: return 'status-pending';
      case FileStatus.PROCESSING: return 'status-processing';
      case FileStatus.COMPLETED: return 'status-completed';
      case FileStatus.FAILED: return 'status-failed';
      default: return 'text-gray-600';
    }
  }

  getFileStatusMessage(file: FileDto): string {
    switch (file.status) {
      case FileStatus.PENDING: return 'Queued for processing...';
      case FileStatus.PROCESSING: return `Processing... ${file.progressPercent || 0}%`;
      case FileStatus.COMPLETED: return 'Processing complete!';
      case FileStatus.FAILED: return file.errorMessage || 'Processing failed';
      default: return `Unknown status: ${file.status}`;
    }
  }

  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
