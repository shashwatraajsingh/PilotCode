import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private taskSubscriptions = new Map<string, Set<string>>(); // taskId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up subscriptions
    for (const [taskId, sockets] of this.taskSubscriptions.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    }
  }

  @SubscribeMessage('subscribe:task')
  handleTaskSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const { taskId } = data;
    
    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, new Set());
    }
    
    this.taskSubscriptions.get(taskId)!.add(client.id);
    client.join(`task:${taskId}`);
    
    this.logger.log(`Client ${client.id} subscribed to task ${taskId}`);
    
    return { success: true, message: `Subscribed to task ${taskId}` };
  }

  @SubscribeMessage('unsubscribe:task')
  handleTaskUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const { taskId } = data;
    
    if (this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.get(taskId)!.delete(client.id);
    }
    
    client.leave(`task:${taskId}`);
    
    this.logger.log(`Client ${client.id} unsubscribed from task ${taskId}`);
    
    return { success: true, message: `Unsubscribed from task ${taskId}` };
  }

  // Emit task progress updates
  emitTaskProgress(taskId: string, data: {
    message: string;
    progress?: number;
    step?: string;
    timestamp: string;
  }) {
    this.server.to(`task:${taskId}`).emit('task:progress', {
      taskId,
      ...data,
    });
  }

  // Emit task status changes
  emitTaskStatusChange(taskId: string, status: string, metadata?: any) {
    this.server.to(`task:${taskId}`).emit('task:status', {
      taskId,
      status,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit file changes
  emitFileChange(taskId: string, data: {
    filePath: string;
    operation: 'create' | 'update' | 'delete';
    content?: string;
  }) {
    this.server.to(`task:${taskId}`).emit('task:file-change', {
      taskId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit command execution results
  emitCommandResult(taskId: string, data: {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
  }) {
    this.server.to(`task:${taskId}`).emit('task:command', {
      taskId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit code review feedback
  emitCodeReview(taskId: string, data: {
    file: string;
    issues: Array<{
      line: number;
      severity: 'error' | 'warning' | 'info';
      message: string;
    }>;
    suggestions: string[];
  }) {
    this.server.to(`task:${taskId}`).emit('task:review', {
      taskId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit error events
  emitError(taskId: string, error: {
    message: string;
    stack?: string;
    recoverable: boolean;
  }) {
    this.server.to(`task:${taskId}`).emit('task:error', {
      taskId,
      ...error,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
