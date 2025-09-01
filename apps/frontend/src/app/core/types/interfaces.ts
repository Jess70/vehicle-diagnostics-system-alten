import { FileStatus, LogLevel } from './enums';

export interface FileDto {
  id: number;
  filename: string;
  storagePath: string;
  bucketName: string;
  objectName: string;
  sizeBytes: number;
  status: FileStatus;
  lastProcessedOffset: number;
  lastProcessedLine?: number;
  attempts: number;
  retentionDays: number;
  errorMessage?: string;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntryDto {
  id: number;
  vehicleId: string;
  timestamp: string;
  level: LogLevel;
  code: string;
  message: string;
  filename: string;
  lineNumber: number;
  createdAt: string;
}

export interface LogQueryParams {
  vehicle?: string;
  level?: LogLevel;
  code?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLogsDto {
  data: LogEntryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FileUploadResponse {
  message: string;
  fileId: number;
  status: string;
}

export interface PreSignedUploadResponse {
  uploadUrl: string;
  fileId: number;
  bucket: string;
  objectName: string;
  expiresIn: number;
  message: string;
}

export interface DashboardStats {
  totalFiles: number;
  processedFiles: number;
  pendingFiles: number;
  totalLogs: number;
}

export interface WebSocketNotification {
  type: string;
  data: any;
  timestamp: string;
}

export interface FileStatusUpdate {
  fileId: number;
  status: FileStatus;
  progressPercent: number;
  message?: string;
  errorMessage?: string;
  processedBytes?: number;
  totalBytes?: number;
  processedEntries?: number;
}
