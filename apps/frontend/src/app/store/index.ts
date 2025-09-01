import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { AppState } from './app.state';
import { logsReducer } from './reducers/logs.reducer';
import { filesReducer } from './reducers/files.reducer';

export const reducers: ActionReducerMap<AppState> = {
  logs: logsReducer,
  files: filesReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];

export * from './app.state';
export * from './actions/logs.actions';
export * from './actions/files.actions';
export * from './selectors/logs.selectors';
export * from './selectors/files.selectors';