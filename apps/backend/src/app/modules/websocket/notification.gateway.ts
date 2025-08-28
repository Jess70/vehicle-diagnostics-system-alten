import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FileStatus } from '../../entities/file.entity';

interface FileStatusUpdate {
  status: FileStatus;
  progressPercent: number;
  processedBytes?: number;
  totalBytes?: number;
  processedEntries?: number;
  message: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200'],
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    client.emit('connected', {
      message: 'Connected to notification server',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe-to-file')
  handleSubscribeToFile(
    @MessageBody() data: { fileId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const { fileId } = data;
    const roomName = `file-${fileId}`;
    
    client.join(roomName);
    this.logger.log(`Client ${client.id} subscribed to file ${fileId}`);
    
    client.emit('subscription-confirmed', {
      fileId,
      message: `Subscribed to updates for file ${fileId}`,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('unsubscribe-from-file')
  handleUnsubscribeFromFile(
    @MessageBody() data: { fileId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const { fileId } = data;
    const roomName = `file-${fileId}`;
    
    client.leave(roomName);
    this.logger.log(`Client ${client.id} unsubscribed from file ${fileId}`);
    
    client.emit('unsubscription-confirmed', {
      fileId,
      message: `Unsubscribed from updates for file ${fileId}`,
      timestamp: new Date().toISOString(),
    });
  }

  emitFileStatusUpdate(fileId: number, update: FileStatusUpdate): void {
    const roomName = `file-${fileId}`;
    const payload = {
      fileId,
      ...update,
      timestamp: new Date().toISOString(),
    };

    this.server.to(roomName).emit('file-status-update', payload);
    this.logger.debug(`Emitted status update for file ${fileId}: ${update.status}`);
  }

  emitNotification(type: 'info' | 'warning' | 'error' | 'success', message: string, data?: Record<string, unknown>): void {
    const payload = {
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('notification', payload);
    this.logger.debug(`Emitted ${type} notification: ${message}`);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  emitSystemStatus(status: {
    totalFiles?: number;
    processingFiles?: number;
    queueLength?: number;
  }): void {
    const payload = {
      ...status,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('system-status', payload);
    this.logger.debug('Emitted system status update');
  }
}

