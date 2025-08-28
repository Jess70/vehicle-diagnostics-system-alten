import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService, LogEntryDto, LogQueryParams } from '../services/api.service';

@Component({
  selector: 'app-log-search',
  standalone: false,
  templateUrl: './log-search.component.html',
  styles: [`
    .log-search-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .search-form-card {
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .search-form-card mat-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -16px -16px 16px -16px;
      padding: 16px;
      border-radius: 4px 4px 0 0;
    }
    
    .search-form-card mat-card-title {
      font-size: 20px;
      font-weight: 600;
    }
    
    .search-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    /* Add left padding to input fields */
    .search-form .mat-mdc-form-field {
      padding-left: 8px;
    }
    
    .search-form .mat-mdc-text-field-wrapper {
      padding-left: 12px;
    }
    
    .search-form input.mat-mdc-input-element,
    .search-form .mat-mdc-select {
      padding-left: 8px;
    }
    
    /* Fix dropdown arrow positioning */
    .search-form .mat-mdc-select-arrow-wrapper {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .search-form .mat-mdc-select-arrow {
      color: rgba(0, 0, 0, 0.54);
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 1;
    }
    
    /* Ensure select field has proper padding and contains arrow */
    .search-form .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      padding-right: 40px;
      overflow: hidden;
    }
    
    .search-form .mat-mdc-form-field .mat-mdc-form-field-flex {
      overflow: hidden;
    }
    
    /* Add background to dropdown menu */
    .mat-mdc-select-panel {
      background: white !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    .mat-mdc-option {
      background: white !important;
      color: #333 !important;
      padding: 8px 16px !important;
    }
    
    .mat-mdc-option:hover {
      background: #f5f5f5 !important;
    }
    
    .mat-mdc-option.mat-mdc-option-active {
      background: #e3f2fd !important;
    }
    

    
    .action-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .button-group {
      display: flex;
      gap: 12px;
    }
    
    .button-group button {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .button-group button[mat-raised-button] {
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
    }
    
    .button-group button[mat-raised-button]:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px -3px rgba(59, 130, 246, 0.3);
    }
    
    .results-count {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
      padding: 8px 16px;
      background-color: #f3f4f6;
      border-radius: 6px;
    }
    
    .results-card {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .results-card mat-card-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      margin: -16px -16px 16px -16px;
      padding: 16px;
      border-radius: 4px 4px 0 0;
    }
    
    .results-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #6b7280;
    }
    
    .loading-container p {
      margin-top: 16px;
      font-size: 16px;
    }
    
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .mat-mdc-table {
      // min-width: 800px;
      background: white;
    }
    
    .mat-mdc-header-row {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-weight: 600;
      color: #374151;
    }
    
    .table-row {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .table-row:hover {
      background-color: #f9fafb;
      transform: scale(1.001);
    }
    
    .vehicle-chip {
      display: inline-block;
      padding: 4px 12px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
    }
    
    .level-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .level-chip.status-info {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .level-chip.status-warn {
      background-color: #fef3c7;
      color: #d97706;
    }
    
    .level-chip.status-error {
      background-color: #fee2e2;
      color: #dc2626;
    }
    
    .level-chip.status-debug {
      background-color: #f3e8ff;
      color: #7c3aed;
    }
    
    .code-chip {
      display: inline-block;
      padding: 4px 8px;
      background-color: #f3f4f6;
      color: #374151;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #d1d5db;
    }
    
    .message-text {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #374151;
      font-size: 14px;
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #6b7280;
      text-align: center;
    }
    

    
    .no-results h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    
    .no-results p {
      font-size: 16px;
      line-height: 1.5;
      max-width: 400px;
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
      min-width: 80px;
    }
    
    .action-button:hover {
      background-color: #e5e7eb;
      border-color: #9ca3af;
      transform: translateY(-1px);
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
    
    /* Fix paginator select menu background */
    .mat-mdc-select-panel {
      background: white !important;
      background-color: white !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    }
    
    .mat-mdc-option {
      background: white !important;
      background-color: white !important;
      color: #333 !important;
      padding: 8px 16px !important;
    }
    
    .mat-mdc-option:hover {
      background: #f5f5f5 !important;
      background-color: #f5f5f5 !important;
    }
    
    .mat-mdc-option.mat-mdc-option-active {
      background: #e3f2fd !important;
      background-color: #e3f2fd !important;
    }
    
    /* Override paginator overlay backgrounds */
    .cdk-overlay-pane .mat-mdc-select-panel,
    .cdk-overlay-pane .mat-mdc-option {
      background: white !important;
      background-color: white !important;
    }
    
    /* Target paginator specific elements */
    .mat-mdc-paginator .mat-mdc-select-panel,
    .mat-mdc-paginator .mat-mdc-option {
      background: white !important;
      background-color: white !important;
    }
    
    .menu-item {
      font-size: 14px;
      padding: 8px 16px;
      transition: background-color 0.2s ease;
    }
    
    .menu-item:hover {
      background-color: #f9fafb;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .log-search-container {
        padding: 16px;
      }
      
      .search-form {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .action-buttons {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .button-group {
        justify-content: center;
      }
      
      .results-count {
        text-align: center;
      }
      
      .table-container {
        margin: 0 -16px;
        border-radius: 0;
      }
    }
  `]
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
