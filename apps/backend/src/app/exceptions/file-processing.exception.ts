import { HttpException, HttpStatus } from '@nestjs/common';

export class FileProcessingException extends HttpException {
  constructor(
    message: string,
    public readonly fileId: number,
    public readonly errorType: string = 'processing_error',
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message, status);
  }
}

export class FileNotFoundProcessingException extends FileProcessingException {
  constructor(fileId: number) {
    super(`File with ID ${fileId} not found`, fileId, 'not_found', HttpStatus.NOT_FOUND);
  }
}

export class StorageProcessingException extends FileProcessingException {
  constructor(fileId: number, originalError: string) {
    super(`Storage error: ${originalError}`, fileId, 'storage_error');
  }
}

export class ParseProcessingException extends FileProcessingException {
  constructor(fileId: number, originalError: string) {
    super(`Parse error: ${originalError}`, fileId, 'parse_error');
  }
}
