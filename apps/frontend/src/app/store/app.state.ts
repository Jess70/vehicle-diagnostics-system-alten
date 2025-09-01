import { LogsState } from './reducers/logs.reducer';
import { FilesState } from './reducers/files.reducer';

export interface AppState {
  logs: LogsState;
  files: FilesState;
}