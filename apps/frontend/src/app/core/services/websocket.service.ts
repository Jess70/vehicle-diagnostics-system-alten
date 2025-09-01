import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { WebSocketEvents, FileStatusUpdate } from '../types';

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private fileUpdates$ = new BehaviorSubject<FileStatusUpdate | null>(null);
  private notifications$ = new BehaviorSubject<SystemNotification | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  get connectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  get fileUpdates(): Observable<FileStatusUpdate | null> {
    return this.fileUpdates$.asObservable();
  }

  get notifications(): Observable<SystemNotification | null> {
    return this.notifications$.asObservable();
  }

  private connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.socket = io(`${environment.backendUrl}/notifications`, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on(WebSocketEvents.CONNECT, () => {
        console.log('Connected to WebSocket server');
        this.connectionStatus$.next(true);
      });

      this.socket.on(WebSocketEvents.DISCONNECT, () => {
        console.log('Disconnected from WebSocket server');
        this.connectionStatus$.next(false);
      });

      this.socket.on(WebSocketEvents.CONNECTED, (data: any) => {
        console.log('WebSocket connected with data:', data);
      });

      this.socket.on(WebSocketEvents.FILE_STATUS_UPDATE, (update: FileStatusUpdate) => {
        this.fileUpdates$.next(update);
      });

      this.socket.on('subscription-confirmed', (data: any) => {
        console.log('✅ Subscription confirmed:', data);
      });

      this.socket.on('unsubscription-confirmed', (data: any) => {
        console.log('❌ Unsubscription confirmed:', data);
      });

      this.socket.on(WebSocketEvents.NOTIFICATION, (notification: SystemNotification) => {
        console.log('System notification received:', notification);
        this.notifications$.next(notification);
      });

      this.socket.on(WebSocketEvents.CONNECT_ERROR, (error: any) => {
        console.error('WebSocket connection error:', error);
        this.connectionStatus$.next(false);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  subscribeToFile(fileId: number): void {
    if (this.socket?.connected) {
      console.log(`🔗 Attempting to subscribe to file ID: ${fileId}`);
      this.socket.emit(WebSocketEvents.SUBSCRIBE_TO_FILE, { fileId });
      console.log(`📡 Emitted subscription request for file ID: ${fileId}`);
    } else {
      console.warn(`❌ Cannot subscribe to file ${fileId} - WebSocket not connected`);
    }
  }

  unsubscribeFromFile(fileId: number): void {
    if (this.socket?.connected) {
      this.socket.emit(WebSocketEvents.UNSUBSCRIBE_FROM_FILE, { fileId });
      console.log(`Unsubscribed from file updates for file ID: ${fileId}`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(false);
    }
  }
}