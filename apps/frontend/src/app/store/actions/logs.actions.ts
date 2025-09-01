import { createAction, props } from '@ngrx/store';
import { LogQueryParams } from '../../core/types';

export const searchLogs = createAction(
  '[Logs] Search Logs',
  props<{ params: LogQueryParams }>()
);

export const searchLogsSuccess = createAction(
  '[Logs] Search Logs Success',
  props<{ logs: any[]; total: number; params: LogQueryParams }>()
);

export const searchLogsFailure = createAction(
  '[Logs] Search Logs Failure',
  props<{ error: string }>()
);

export const clearLogs = createAction('[Logs] Clear Logs');

export const loadTotalCount = createAction('[Logs] Load Total Count');

export const loadTotalCountSuccess = createAction(
  '[Logs] Load Total Count Success',
  props<{ total: number }>()
);

export const loadTotalCountFailure = createAction(
  '[Logs] Load Total Count Failure',
  props<{ error: string }>()
);
