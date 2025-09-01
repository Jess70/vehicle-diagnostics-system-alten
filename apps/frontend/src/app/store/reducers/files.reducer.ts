import { createReducer, on } from '@ngrx/store';
import { FileDto } from '../../core/types';
import * as FilesActions from '../actions/files.actions';

export interface FilesState {
  files: FileDto[];
  loading: boolean;
  error: string | null;
}

export const initialFilesState: FilesState = {
  files: [],
  loading: false,
  error: null
};

export const filesReducer = createReducer(
  initialFilesState,
  on(FilesActions.loadFiles, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FilesActions.loadFilesSuccess, (state, { files }) => ({
    ...state,
    files,
    loading: false,
    error: null
  })),
  on(FilesActions.loadFilesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(FilesActions.updateFileStatus, (state, { fileId, status, progressPercent, message, lastProcessedOffset, lastProcessedLine, totalBytes }) => {

    
    return {
      ...state,
      files: state.files.map(file =>
        file.id === fileId
          ? { 
              ...file, 
              status: status as any, 
              progressPercent,
              lastProcessedOffset: lastProcessedOffset ?? file.lastProcessedOffset,
              lastProcessedLine: lastProcessedLine ?? file.lastProcessedLine,
              sizeBytes: totalBytes ?? file.sizeBytes,
              errorMessage: status === 'FAILED' ? message : undefined
            }
          : file
      )
    };
  }),
  on(FilesActions.deleteFileSuccess, (state, { fileId }) => ({
    ...state,
    files: state.files.filter(file => file.id !== fileId)
  })),
  on(FilesActions.deleteFileFailure, (state, { error }) => ({
    ...state,
    error
  })),
  on(FilesActions.addFile, (state, { file }) => ({
    ...state,
    files: [...state.files, file]
  }))
);
