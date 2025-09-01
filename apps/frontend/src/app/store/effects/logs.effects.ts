import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import * as LogsActions from '../actions/logs.actions';

@Injectable()
export class LogsEffects {
  
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  searchLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.searchLogs),
      switchMap(({ params }) =>
        from(this.apiService.getLogs(params)).pipe(
          map(result => 
            LogsActions.searchLogsSuccess({ 
              logs: result.data, 
              total: result.total, 
              params 
            })
          ),
          catchError(error =>
            of(LogsActions.searchLogsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loadTotalCount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.loadTotalCount),
      switchMap(() =>
        from(this.apiService.getTotalLogsCount()).pipe(
          map(result => 
            LogsActions.loadTotalCountSuccess({ total: result.total })
          ),
          catchError(error =>
            of(LogsActions.loadTotalCountFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
