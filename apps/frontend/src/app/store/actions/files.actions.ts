import { createAction, props } from '@ngrx/store';
import { FileDto } from '../../core/types';

export const loadFiles = createAction('[Files] Load Files');

export const loadFilesSuccess = createAction(
  '[Files] Load Files Success',
  props<{ files: FileDto[] }>()
);

export const loadFilesFailure = createAction(
  '[Files] Load Files Failure',
  props<{ error: string }>()
);

export const updateFileStatus = createAction(
  '[Files] Update File Status',
  props<{ 
    fileId: number; 
    status: string; 
    progressPercent: number; 
    message: string;
    lastProcessedOffset?: number;
    lastProcessedLine?: number;
    totalBytes?: number;
  }>()
);

export const deleteFile = createAction(
  '[Files] Delete File',
  props<{ fileId: number }>()
);

export const deleteFileSuccess = createAction(
  '[Files] Delete File Success',
  props<{ fileId: number }>()
);

export const deleteFileFailure = createAction(
  '[Files] Delete File Failure',
  props<{ error: string }>()
);

export const addFile = createAction(
  '[Files] Add File',
  props<{ file: FileDto }>()
);
