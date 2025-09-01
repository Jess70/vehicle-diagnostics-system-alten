import { createReducer, on } from '@ngrx/store';
import * as LogsActions from '../actions/logs.actions';
import { LogQueryParams } from '../../core/types';

export interface LogsState {
  logs: any[];
  searchTotal: number; 
  overallTotal: number;
  loading: boolean;
  error: string | null;
  lastSearchParams: LogQueryParams | null;
}

export const initialLogsState: LogsState = {
  logs: [],
  searchTotal: 0,
  overallTotal: 0,
  loading: false,
  error: null,
  lastSearchParams: null
};

export const logsReducer = createReducer(
  initialLogsState,
  on(LogsActions.searchLogs, (state, { params }) => ({
    ...state,
    loading: true,
    error: null,
    lastSearchParams: params
  })),
  on(LogsActions.searchLogsSuccess, (state, { logs, total, params }) => ({
    ...state,
    logs,
    searchTotal: total,
    loading: false,
    error: null,
    lastSearchParams: params
  })),
  on(LogsActions.searchLogsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(LogsActions.clearLogs, (state) => ({
    ...state,
    logs: [],
    searchTotal: 0,
    error: null
  })),
  on(LogsActions.loadTotalCount, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LogsActions.loadTotalCountSuccess, (state, { total }) => ({
    ...state,
    overallTotal: total,
    loading: false,
    error: null
  })),
  on(LogsActions.loadTotalCountFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
