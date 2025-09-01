import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, timer, from } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, filter, delay } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { LOG_REFRESH_DELAY } from '../../core/constants';
import * as FilesActions from '../actions/files.actions';
import * as LogsActions from '../actions/logs.actions';
import { selectLastSearchParams } from '../selectors/logs.selectors';

@Injectable()
export class FilesEffects {

  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private store = inject(Store);

  loadFiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.loadFiles),
      switchMap(() =>
        from(this.apiService.getFiles()).pipe(
          map(files => {

            return FilesActions.loadFilesSuccess({ files })
          }),
          catchError(error => 
            of(FilesActions.loadFilesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  deleteFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.deleteFile),
      switchMap(({ fileId }) =>
        from(this.apiService.deleteFile(fileId)).pipe(
          map(() => {

            return FilesActions.deleteFileSuccess({ fileId })
          }),
          catchError(error => 
            of(FilesActions.deleteFileFailure({ error: error.message }))
          )
        )
      )
    )
  );

  deleteFileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.deleteFileSuccess),
      switchMap(() => 
        timer(LOG_REFRESH_DELAY).pipe(
          map(() => {
            return LogsActions.loadTotalCount();
          })
        )
      )
    )
  );

  // Refresh logs and total count when file processing completes
  refreshLogsOnFileComplete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FilesActions.updateFileStatus),
      filter(({ status }) => status === 'COMPLETED'),
      delay(1000),
      switchMap(() => [
        LogsActions.loadTotalCount(), 
      ])
    )
  );
}
