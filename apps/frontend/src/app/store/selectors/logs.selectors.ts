import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LogsState } from '../reducers/logs.reducer';

export const selectLogsState = createFeatureSelector<LogsState>('logs');

export const selectAllLogs = createSelector(
  selectLogsState,
  (state: LogsState) => state.logs
);

export const selectLogsLoading = createSelector(
  selectLogsState,
  (state: LogsState) => state.loading
);

export const selectLogsError = createSelector(
  selectLogsState,
  (state: LogsState) => state.error
);

export const selectLogsTotal = createSelector(
  selectLogsState,
  (state: LogsState) => state.overallTotal
);

export const selectLogsSearchTotal = createSelector(
  selectLogsState,
  (state: LogsState) => state.searchTotal
);

export const selectLastSearchParams = createSelector(
  selectLogsState,
  (state: LogsState) => state.lastSearchParams
);
