import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { AppState } from '../../store/app.state';
import { selectFileStats } from '../../store/selectors/files.selectors';
import { selectLogsTotal } from '../../store/selectors/logs.selectors';
import { loadFiles } from '../../store/actions/files.actions';
import { loadTotalCount } from '../../store/actions/logs.actions';
import { TabType } from '../../core/types';

@Component({
  selector: 'app-dashboard-page',
  standalone: false,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit, OnDestroy {
  title = 'Vehicle Diagnostics Dashboard';
  
  activeTab: TabType = TabType.UPLOAD;
  fileStats$: Observable<any>;
  totalLogs$: Observable<number>;
  TabType = TabType; // For template access

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.fileStats$ = this.store.select(selectFileStats);
    this.totalLogs$ = this.store.select(selectLogsTotal);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.store.dispatch(loadFiles());
      this.store.dispatch(loadTotalCount());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }
}
