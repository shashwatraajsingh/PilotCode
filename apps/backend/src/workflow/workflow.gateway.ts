import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KafkaService } from '../common/kafka/kafka.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class WorkflowGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private taskSubscriptions: Map<string, Set<string>> = new Map();

  constructor(private kafka: KafkaService) {}

  async onModuleInit() {
    // Subscribe to Kafka events and broadcast to WebSocket clients
    await this.kafka.subscribe(
      'task-progress',
      'workflow-gateway',
      async ({ message }) => {
        if (message.value) {
          const data = JSON.parse(message.value.toString());
          this.broadcastToTask(data.taskId, 'progress', data);
        }
      },
    );

    await this.kafka.subscribe(
      'workflow-events',
      'workflow-gateway',
      async ({ message }) => {
        if (message.value) {
          const data = JSON.parse(message.value.toString());
          this.broadcastToTask(data.taskId, 'state-change', data);
        }
      },
    );
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Clean up subscriptions
    this.taskSubscriptions.forEach((clients, taskId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    });
  }

  @SubscribeMessage('subscribe-task')
  handleSubscribeTask(client: Socket, taskId: string) {
    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, new Set());
    }
    this.taskSubscriptions.get(taskId)!.add(client.id);
    
    client.emit('subscribed', { taskId });
  }

  @SubscribeMessage('unsubscribe-task')
  handleUnsubscribeTask(client: Socket, taskId: string) {
    const clients = this.taskSubscriptions.get(taskId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    }
    
    client.emit('unsubscribed', { taskId });
  }

  private broadcastToTask(taskId: string, event: string, data: any) {
    const clients = this.taskSubscriptions.get(taskId);
    if (clients) {
      clients.forEach((clientId) => {
        this.server.to(clientId).emit(event, data);
      });
    }
  }

  // Method to send updates from services
  sendTaskUpdate(taskId: string, event: string, data: any) {
    this.broadcastToTask(taskId, event, data);
  }
}
