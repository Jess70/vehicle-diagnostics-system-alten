import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FilesState } from '../reducers/files.reducer';
import { FileStatus } from '../../core/types';

export const selectFilesState = createFeatureSelector<FilesState>('files');

export const selectAllFiles = createSelector(
  selectFilesState,
  (state: FilesState) => state.files
);

export const selectFilesLoading = createSelector(
  selectFilesState,
  (state: FilesState) => state.loading
);

export const selectFilesError = createSelector(
  selectFilesState,
  (state: FilesState) => state.error
);

export const selectTotalFilesCount = createSelector(
  selectAllFiles,
  (files) => files.length
);

export const selectProcessedFilesCount = createSelector(
  selectAllFiles,
  (files) => files.filter(f => f.status === FileStatus.COMPLETED).length
);

export const selectPendingFilesCount = createSelector(
  selectAllFiles,
  (files) => files.filter(f => f.status === FileStatus.PENDING || f.status === FileStatus.PROCESSING).length
);

export const selectFileStats = createSelector(
  selectTotalFilesCount,
  selectProcessedFilesCount,
  selectPendingFilesCount,
  (totalFiles, processedFiles, pendingFiles) => ({
    totalFiles,
    processedFiles,
    pendingFiles
  })
);
