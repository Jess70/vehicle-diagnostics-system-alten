import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  protected title = 'Vehicle Diagnostics Dashboard';
  activeTab: 'upload' | 'search' | 'files' = 'upload';
  
  // Dashboard Stats
  totalFiles = 0;
  processedFiles = 0;
  pendingFiles = 0;
  totalLogs = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private webSocketService: WebSocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only load stats if we're running in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadStats();
      
      // Listen for real-time file status updates
      this.webSocketService.fileUpdates
        .pipe(
          takeUntil(this.destroy$),
          filter(update => update !== null)
        )
        .subscribe(update => {
          this.loadStats(); // Refresh stats immediately when files change status
        });

      // Listen for general notifications (like file deletions)
      this.webSocketService.notifications
        .pipe(
          takeUntil(this.destroy$),
          filter(notification => notification !== null)
        )
        .subscribe(notification => {
          if (notification && (notification.data?.['action'] === 'deleted' || notification.type === 'success')) {
            this.loadStats(); // Refresh stats immediately
          }
        });
      
      // Fallback refresh stats every 5 minutes (in case WebSocket disconnects)
      interval(300000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadStats();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'upload' | 'search' | 'files'): void {
    this.activeTab = tab;
  }

  private async loadStats(): Promise<void> {
    try {
      // Get file stats
      const files = await this.apiService.getFiles();
      this.totalFiles = files.length;
      this.processedFiles = files.filter(f => f.status === 'COMPLETED').length;
      this.pendingFiles = files.filter(f => f.status === 'PENDING' || f.status === 'PROCESSING').length;

      // Get log stats
      const logStats = await this.apiService.getLogStats();
      this.totalLogs = logStats.totalLogs;
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
}
