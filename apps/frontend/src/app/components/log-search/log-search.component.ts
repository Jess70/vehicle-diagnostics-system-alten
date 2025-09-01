import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppState } from '../../store/app.state';
import { searchLogs, clearLogs } from '../../store/actions/logs.actions';
import { selectAllLogs, selectLogsSearchTotal, selectLogsLoading, selectLogsError } from '../../store/selectors/logs.selectors';
import { LogEntryDto, LogQueryParams } from '../../core/types';
import { formatDate, getLogLevelColor } from '../../core/utils';

@Component({
  selector: 'app-log-search',
  standalone: false,
  templateUrl: './log-search.component.html',
  styleUrls: ['./log-search.component.scss']
})
export class LogSearchComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<LogEntryDto>([]);
  displayedColumns = ['timestamp', 'vehicleId', 'level', 'code', 'message'];
  
  logs$: Observable<LogEntryDto[]>;
  total$: Observable<number>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  hasSearched = false;
  currentPage = 1;
  pageSize = 10;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>
  ) {
    this.searchForm = this.fb.group({
      vehicle: [''],
      level: [''],
      code: [''],
      search: [''],
      from: [''],
      to: ['']
    });

    this.logs$ = this.store.select(selectAllLogs);
    this.total$ = this.store.select(selectLogsSearchTotal);
    this.isLoading$ = this.store.select(selectLogsLoading);
    this.error$ = this.store.select(selectLogsError);
  }

  ngOnInit(): void {
    this.logs$.pipe(takeUntil(this.destroy$)).subscribe(logs => {
      this.dataSource.data = logs;
    });

    this.loadAllLogs();

    this.searchForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.hasSearched) {
        this.searchLogs();
      }
    });
  }

  private loadAllLogs(): void {
    const params: LogQueryParams = {
      page: 1,
      limit: this.pageSize
    };
    this.store.dispatch(searchLogs({ params }));
    this.hasSearched = true;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async searchLogs(): Promise<void> {
    this.hasSearched = true;
    this.currentPage = 1;

    const formValue = this.searchForm.value;
    const params: LogQueryParams = {
      ...formValue,
      from: formValue.from ? this.formatDateForAPI(formValue.from) : undefined,
      to: formValue.to ? this.formatDateForAPI(formValue.to) : undefined,
      page: this.currentPage,
      limit: this.pageSize,
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key as keyof LogQueryParams] === '' || params[key as keyof LogQueryParams] === null) {
        delete params[key as keyof LogQueryParams];
      }
    });

    this.store.dispatch(searchLogs({ params }));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    if (this.hasSearched) {
      this.searchLogs();
    }
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.hasSearched = false;
    this.currentPage = 1;
    this.store.dispatch(clearLogs());
  }

  formatDate(date: string): string {
    return formatDate(date);
  }

  getLogLevelColor(level: string): string {
    const color = getLogLevelColor(level as any);
    return color;
  }

  filterByVehicle(vehicleId: string): void {
    this.searchForm.patchValue({ vehicle: vehicleId });
    this.searchLogs();
  }

  filterByCode(code: string): void {
    this.searchForm.patchValue({ code });
    this.searchLogs();
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}