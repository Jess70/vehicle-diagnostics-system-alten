import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService, LogEntryDto, LogQueryParams } from '../../services/api.service';

@Component({
  selector: 'app-log-search',
  standalone: false,
  templateUrl: './log-search.component.html',
  styleUrls: ['./log-search.component.scss']
})
export class LogSearchComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchForm: FormGroup;
  dataSource = new MatTableDataSource<LogEntryDto>([]);
  displayedColumns = ['timestamp', 'vehicleId', 'level', 'code', 'message', 'actions'];
  
  isLoading = false;
  hasSearched = false;
  totalResults = 0;
  currentPage = 1;
  pageSize = 25;

  // Date picker properties
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of current month
  endDate = new Date(); // Today

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService
  ) {
    this.searchForm = this.fb.group({
      vehicle: [''],
      code: [''],
      level: [''],
      from: [''],
      to: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    // Auto-search when form values change (with debounce)
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.hasSearched) {
          this.searchLogs();
        }
      });

    // Initial search to show some data
    this.searchLogs();
  }

  ngAfterViewInit(): void {
    // Connect the data source to sort and paginator
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    
    // Set up custom sorting
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'timestamp':
          return new Date(item.timestamp).getTime();
        case 'vehicleId':
          return item.vehicleId;
        case 'level':
          return item.level;
        case 'code':
          return item.code;
        case 'message':
          return item.message;
        default:
          return item[property as keyof LogEntryDto];
      }
    };
  }

  async searchLogs(): Promise<void> {
    this.isLoading = true;
    this.hasSearched = true;

    try {
      const formValue = this.searchForm.value;
      const params: LogQueryParams = {
        ...formValue,
        from: formValue.from ? formValue.from.toISOString().split('T')[0] : undefined,
        to: formValue.to ? formValue.to.toISOString().split('T')[0] : undefined,
        page: this.currentPage,
        limit: this.pageSize,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      };

      // Remove empty/null values
      Object.keys(params).forEach(key => {
        if (params[key as keyof LogQueryParams] === '' || params[key as keyof LogQueryParams] === null) {
          delete params[key as keyof LogQueryParams];
        }
      });

      const result = await this.apiService.getLogs(params);
      
      this.dataSource.data = result.data;
      this.totalResults = result.total;

    } catch (error) {
      console.error('Error searching logs:', error);
      this.dataSource.data = [];
      this.totalResults = 0;
    } finally {
      this.isLoading = false;
    }
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.currentPage = 1;
    this.hasSearched = false;
    this.dataSource.data = [];
    this.totalResults = 0;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.searchLogs();
  }

  viewLogDetails(log: LogEntryDto): void {
    // TODO: Implement log details dialog
    console.log('View log details:', log);
  }

  filterByVehicle(vehicleId: string): void {
    this.searchForm.patchValue({ vehicle: vehicleId });
    this.currentPage = 1;
    this.searchLogs();
  }

  filterByCode(code: string): void {
    this.searchForm.patchValue({ code: code });
    this.currentPage = 1;
    this.searchLogs();
  }
}
