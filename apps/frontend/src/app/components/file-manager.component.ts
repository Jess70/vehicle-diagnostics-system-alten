import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, interval } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ApiService, FileDto } from '../services/api.service';
import { WebSocketService, FileStatusUpdate } from '../services/websocket.service';

@Component({
  selector: 'app-file-manager',
  standalone: false,
  templateUrl: './file-manager.component.html',
  styles: [`
    .file-manager-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .main-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .loading-text {
      margin-top: 16px;
      color: #6b7280;
      font-size: 16px;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
    }

    .files-table {
      width: 100%;
      border-collapse: collapse;
    }

    .table-header {
      background-color: #f8fafc;
      color: #374151;
      font-weight: 600;
      font-size: 14px;
      padding: 16px 12px;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
    }

    .table-header-row {
      background-color: #f8fafc;
    }

    .table-row {
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;
    }

    .table-row:hover {
      background-color: #f9fafb;
    }

    .file-cell, .status-cell, .progress-cell, .date-cell, .actions-cell {
      padding: 16px 12px;
      vertical-align: top;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .file-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 14px;
      word-break: break-word;
    }

    .file-size {
      color: #6b7280;
      font-size: 12px;
    }

    .status-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-completed {
      background-color: #dcfce7;
      color: #166534;
    }

    .status-processing {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .status-default {
      background-color: #f3f4f6;
      color: #374151;
    }

    .progress-bar {
      width: 120px;
      height: 6px;
      border-radius: 3px;
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .progress-percentage {
      font-weight: 600;
      color: #1e40af;
      font-size: 14px;
    }

    .progress-details {
      color: #6b7280;
      font-size: 11px;
    }

    .status-complete {
      color: #166534;
      font-weight: 500;
      font-size: 14px;
    }

    .status-pending {
      color: #92400e;
      font-weight: 500;
      font-size: 14px;
    }

    .status-failed {
      color: #991b1b;
      font-weight: 500;
      font-size: 14px;
    }

    .date-cell {
      color: #6b7280;
      font-size: 13px;
    }

    .action-button {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      background-color: #e5e7eb;
      border-color: #9ca3af;
    }

        .action-menu {
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    /* Force white background on menu panel */
    .mat-mdc-menu-panel {
      background: white !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    }
    
    /* Force white background on menu items */
    .mat-mdc-menu-item {
      background: white !important;
      color: #333 !important;
      font-size: 14px;
      padding: 8px 16px;
      transition: background-color 0.2s ease;
    }
    
    .mat-mdc-menu-item:hover {
      background-color: #f9fafb !important;
    }
    
    /* Override any transparent backgrounds */
    .cdk-overlay-pane .mat-mdc-menu-panel,
    .cdk-overlay-pane .mat-mdc-menu-item {
      background: white !important;
      background-color: white !important;
    }
    
    /* Target the menu content specifically */
    .mat-mdc-menu-content {
      background: white !important;
      background-color: white !important;
    }
    
    /* Fix divider background */
    .mat-mdc-menu-divider {
      background-color: #e5e7eb !important;
      border-top: 1px solid #e5e7eb !important;
      margin: 4px 0 !important;
    }
    
    /* Override any transparent dividers */
    .cdk-overlay-pane .mat-mdc-menu-divider {
      background-color: #e5e7eb !important;
      border-top: 1px solid #e5e7eb !important;
    }
    
    /* Ensure divider is visible */
    .mat-divider {
      background-color: #e5e7eb !important;
      border-top: 1px solid #e5e7eb !important;
    }
    
    .menu-item {
      font-size: 14px;
      padding: 8px 16px;
    }
    
    .delete-item {
      color: #dc2626;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }

    .empty-description {
      font-size: 16px;
      color: #6b7280;
    }

    .error-section {
      margin-top: 24px;
    }

    .error-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #dc2626;
    }

    .error-title {
      color: #dc2626;
      font-size: 20px;
      font-weight: 600;
    }

    .error-item {
      border-left: 3px solid #fca5a5;
      padding: 16px;
      margin-bottom: 12px;
      background-color: #fef2f2;
      border-radius: 0 8px 8px 0;
    }

    .error-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .error-file-info {
      flex: 1;
    }

    .error-file-name {
      font-weight: 600;
      color: #991b1b;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .error-message {
      color: #dc2626;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .error-details {
      color: #b91c1c;
      font-size: 11px;
    }

    .error-actions {
      flex-shrink: 0;
    }

    .retry-button {
      background-color: #dc2626;
      color: white;
      border-radius: 6px;
      font-weight: 500;
      padding: 6px 16px;
      font-size: 13px;
    }

    .retry-button:hover {
      background-color: #b91c1c;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .file-manager-container {
        padding: 12px;
      }

      .table-container {
        font-size: 12px;
      }

      .file-name {
        font-size: 13px;
      }

      .status-badge {
        font-size: 11px;
        padding: 3px 8px;
      }

      .action-button {
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  `]
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
