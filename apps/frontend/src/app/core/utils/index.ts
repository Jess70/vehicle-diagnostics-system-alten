import { FileStatus, LogLevel, AllowedMimeTypes, AllowedExtensions, StatusIconNames, StatusColors } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
  } catch (error) {
    return dateString;
  }
}

export function getStatusColor(status: FileStatus): string {
  switch (status) {
    case FileStatus.COMPLETED: return 'text-green-600 bg-green-100';
    case FileStatus.PROCESSING: return 'text-blue-600 bg-blue-100';
    case FileStatus.PENDING: return 'text-yellow-600 bg-yellow-100';
    case FileStatus.FAILED: return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.INFO: return 'status-info';
    case LogLevel.WARN: return 'status-warn';
    case LogLevel.ERROR: return 'status-error';
    case LogLevel.DEBUG: return 'status-debug';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  const allowedMimeTypes = Object.values(AllowedMimeTypes);
  const allowedExtensions = Object.values(AllowedExtensions);
  
  // Primary validation: MIME type (more reliable)
  if (file.type && !allowedMimeTypes.includes(file.type as AllowedMimeTypes)) {
    return {
      isValid: false,
      error: `File "${file.name}" has unsupported MIME type. Expected: text/plain files only`
    };
  }
  
  // Fallback validation: extension (for files without MIME type)
  if (!file.type) {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension as AllowedExtensions)) {
      return {
        isValid: false,
        error: `File "${file.name}" has unsupported format. Allowed: ${allowedExtensions.join(', ')}`
      };
    }
  }

  return { isValid: true };
}
