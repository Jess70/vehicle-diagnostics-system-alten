import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface FileStatusUpdate {
  fileId: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  processedBytes?: number;
  totalBytes?: number;
  processedEntries?: number;
  message: string;
  timestamp: string;
}

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private fileUpdates$ = new BehaviorSubject<FileStatusUpdate | null>(null);
  private notifications$ = new BehaviorSubject<SystemNotification | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  get fileUpdates(): Observable<FileStatusUpdate | null> {
    return this.fileUpdates$.asObservable();
  }

  get notifications(): Observable<SystemNotification | null> {
    return this.notifications$.asObservable();
  }

  private connect(): void {
    try {
      this.socket = io(`${environment.backendUrl}/notifications`, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.connected$.next(true);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.connected$.next(false);
      });

      this.socket.on('connected', (data) => {
        console.log('Server connection confirmed:', data);
      });

      this.socket.on('file-status-update', (update: FileStatusUpdate) => {
        console.log('File status update received:', update);
        this.fileUpdates$.next(update);
      });

      this.socket.on('notification', (notification: SystemNotification) => {
        console.log('System notification received:', notification);
        this.notifications$.next(notification);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connected$.next(false);
      });

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  subscribeToFile(fileId: number): void {
    if (this.socket && this.connected$.value) {
      console.log(`Subscribing to file updates for file ${fileId}`);
      this.socket.emit('subscribe-to-file', { fileId });
    }
  }

  unsubscribeFromFile(fileId: number): void {
    if (this.socket && this.connected$.value) {
      console.log(`Unsubscribing from file updates for file ${fileId}`);
      this.socket.emit('unsubscribe-from-file', { fileId });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}
