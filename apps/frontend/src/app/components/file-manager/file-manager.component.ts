import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { FileDto } from '../../core/types';
import { formatFileSize, formatDate, getStatusColor } from '../../core/utils';
import { AppState } from '../../store/app.state';
import { selectAllFiles, selectFilesLoading } from '../../store/selectors/files.selectors';
import * as FilesActions from '../../store/actions/files.actions';

@Component({
  selector: 'app-file-manager',
  standalone: false,
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit, OnDestroy {

  files$: Observable<FileDto[]>;
  isLoading$: Observable<boolean>;
  dataSource = new MatTableDataSource<FileDto>([]);
  displayedColumns = ['filename', 'status', 'progress', 'createdAt', 'updatedAt', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    public apiService: ApiService,
    private snackBar: MatSnackBar,
    private store: Store<AppState>
  ) {
    this.files$ = this.store.select(selectAllFiles);
    this.isLoading$ = this.store.select(selectFilesLoading);
  }

  ngOnInit(): void {
    this.files$.pipe(takeUntil(this.destroy$)).subscribe(files => {
      this.dataSource.data = files;
    });


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  refreshFiles(): void {
    this.store.dispatch(FilesActions.loadFiles());
  }



  getProcessingProgress(file: FileDto): number {
    // Use progressPercent from WebSocket updates if available
    if (file.progressPercent !== undefined) {
      return file.progressPercent;
    }
    // Fallback to calculating from processed bytes
    if (file.sizeBytes === 0) return 0;
    return Math.round((file.lastProcessedOffset / file.sizeBytes) * 100);
  }

  getStatusClass(status: string): string {
    return getStatusColor(status as any);
  }



  async deleteFile(file: FileDto): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    this.store.dispatch(FilesActions.deleteFile({ fileId: file.id }));
    this.snackBar.open(`File "${file.filename}" deleted successfully`, 'Close', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }
  
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  formatDate(dateString: string): string {
    return formatDate(dateString);
  }
}
