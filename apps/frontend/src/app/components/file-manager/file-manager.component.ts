import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, interval } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ApiService, FileDto } from '../../services/api.service';
import { WebSocketService, FileStatusUpdate } from '../../services/websocket.service';

@Component({
  selector: 'app-file-manager',
  standalone: false,
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<FileDto>([]);
  displayedColumns = ['filename', 'status', 'progress', 'createdAt', 'updatedAt', 'actions'];
  
  isLoading = false;
  totalFiles = 0;
  pendingFiles = 0;
  processingFiles = 0;
  completedFiles = 0;
  errorFiles: FileDto[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    public apiService: ApiService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFiles();

    // Listen for file status updates via WebSocket
    this.webSocketService.fileUpdates
      .pipe(
        takeUntil(this.destroy$),
        filter((update): update is FileStatusUpdate => update !== null)
      )
      .subscribe(update => this.handleFileStatusUpdate(update));

    // Listen for general notifications (including file deletions) via WebSocket
    this.webSocketService.notifications
      .pipe(
        takeUntil(this.destroy$),
        filter(notification => notification !== null)
      )
      .subscribe(notification => {
        if (notification && notification.data?.['action'] === 'deleted') {
          // Refresh the files list immediately when a file is deleted
          this.loadFiles();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFiles(): Promise<void> {
    this.isLoading = true;

    try {
      const files = await this.apiService.getFiles();
      this.dataSource.data = files;
      this.updateStats(files);
    } catch (error) {
      console.error('Error loading files:', error);
      this.snackBar.open('Error loading files', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
    } finally {
      this.isLoading = false;
    }
  }

  refreshFiles(): void {
    this.loadFiles();
  }

  private updateStats(files: FileDto[]): void {
    this.totalFiles = files.length;
    this.pendingFiles = files.filter(f => f.status === 'PENDING').length;
    this.processingFiles = files.filter(f => f.status === 'PROCESSING').length;
    this.completedFiles = files.filter(f => f.status === 'COMPLETED').length;
    this.errorFiles = files.filter(f => f.status === 'FAILED');
  }

  getProcessingProgress(file: FileDto): number {
    if (file.sizeBytes === 0) return 0;
    return Math.round((file.lastProcessedOffset / file.sizeBytes) * 100);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'PROCESSING':
        return 'status-processing';
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      default:
        return 'status-default';
    }
  }

  private handleFileStatusUpdate(update: FileStatusUpdate): void {
    const file = this.dataSource.data.find(f => f.id === update.fileId);
    if (!file) return;

    // Update file status and progress
    file.status = update.status as any;
    if (update.processedBytes !== undefined) {
      file.lastProcessedOffset = update.processedBytes;
    }
    file.updatedAt = update.timestamp;

    // Update stats
    this.updateStats(this.dataSource.data);

    // Trigger change detection
    this.dataSource.data = [...this.dataSource.data];
  }

  viewFileDetails(file: FileDto): void {
    // TODO: Implement file details dialog
    console.log('View file details:', file);
  }

  viewFileLogs(file: FileDto): void {
    // TODO: Navigate to logs view with file filter
    console.log('View logs for file:', file);
  }

  async reprocessFile(file: FileDto): Promise<void> {
    // TODO: Implement reprocessing functionality
    console.log('Reprocess file:', file);
    this.snackBar.open('File reprocessing is not yet implemented', 'Close', {
      duration: 3000
    });
  }

  async deleteFile(file: FileDto): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.apiService.deleteFile(file.id);
      
      this.snackBar.open(`File "${file.filename}" deleted successfully`, 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
      
      // Refresh the list
      this.loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      this.snackBar.open('Error deleting file', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
    }
  }
}
