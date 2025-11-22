import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import { BrainModule } from './brain/brain.module';
import { HandsModule } from './hands/hands.module';
import { LegsModule } from './legs/legs.module';
import { WorkflowModule } from './workflow/workflow.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // Infrastructure
    PrismaModule,
    RedisModule,
    KafkaModule,

    // Production Features
    AuthModule,        // Authentication & Authorization
    WebsocketModule,   // Real-time updates

    // Core Modules (5 Steps)
    BrainModule,     // Step 1: Planning
    HandsModule,     // Step 2: Code Editing
    LegsModule,      // Step 3: Execution
    WorkflowModule,  // Step 4: Orchestration
    DeliveryModule,  // Step 5: GitHub Integration

    // Unified API
    TasksModule,     // Main entry point
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
