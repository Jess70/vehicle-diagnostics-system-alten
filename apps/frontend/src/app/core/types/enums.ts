export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum WebSocketEvents {
  CONNECT = 'connect',
  CONNECTED = 'connected',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  FILE_STATUS_UPDATE = 'file-status-update',
  SUBSCRIBE_TO_FILE = 'subscribe-to-file',
  UNSUBSCRIBE_FROM_FILE = 'unsubscribe-from-file',
  NOTIFICATION = 'notification'
}

export enum AllowedMimeTypes {
  TEXT_PLAIN = 'text/plain'
}

export enum AllowedExtensions {
  TXT = '.txt',
  LOG = '.log'
}

export enum StatusIconNames {
  PENDING = 'schedule',
  UPLOADING = 'cloud_upload',
  PROCESSING = 'autorenew',
  COMPLETED = 'check_circle',
  FAILED = 'error',
  DEFAULT = 'help'
}

export enum StatusColors {
  PENDING = 'status-pending',
  UPLOADING = 'status-uploading',
  PROCESSING = 'status-processing', 
  COMPLETED = 'status-completed',
  FAILED = 'status-failed',
  DEFAULT = 'text-gray-600'
}

export enum TabType {
  UPLOAD = 'upload',
  SEARCH = 'search',
  FILES = 'files'
}
