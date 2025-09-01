import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { map, switchMap, filter, tap } from 'rxjs/operators';
import { WebSocketService } from '../../core/services/websocket.service';
import * as FilesActions from '../actions/files.actions';

import { AppState } from '../app.state';

@Injectable()
export class WebSocketEffects {

  private webSocketService = inject(WebSocketService);

  fileStatusUpdates$ = createEffect(() =>
    this.webSocketService.fileUpdates.pipe(
      filter(update => update !== null),

      map(update => {
        return FilesActions.updateFileStatus({
          fileId: update!.fileId,
          status: update!.status,
          progressPercent: update!.progressPercent,
          message: update!.message || '',
          lastProcessedOffset: update!.processedBytes,
          lastProcessedLine: update!.processedEntries,
          totalBytes: update!.totalBytes
        });
      })
    )
  );
}
