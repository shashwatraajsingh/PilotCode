import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { KafkaService } from '../common/kafka/kafka.service';

export enum WorkflowState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  TESTING = 'TESTING',
  DEBUGGING = 'DEBUGGING',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export interface StateTransition {
  from: WorkflowState;
  to: WorkflowState;
  event: string;
  metadata?: any;
}

export interface WorkflowStateData {
  taskId: string;
  currentState: WorkflowState;
  currentSubtaskId?: string;
  progress: number;
  history: StateTransition[];
  retryCount: number;
  lastError?: string;
  metadata: any;
}

@Injectable()
export class StateMachineService {
  private readonly STATE_KEY_PREFIX = 'workflow:state:';
  private readonly KAFKA_TOPIC = 'workflow-events';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private kafka: KafkaService,
  ) {}

  async initializeWorkflow(taskId: string): Promise<WorkflowStateData> {
    const stateData: WorkflowStateData = {
      taskId,
      currentState: WorkflowState.IDLE,
      progress: 0,
      history: [],
      retryCount: 0,
      metadata: {},
    };

    await this.saveState(stateData);
    await this.persistState(taskId, stateData);

    return stateData;
  }

  async transition(
    taskId: string,
    toState: WorkflowState,
    event: string,
    metadata?: any,
  ): Promise<WorkflowStateData> {
    const currentState = await this.getState(taskId);

    if (!this.isValidTransition(currentState.currentState, toState)) {
      throw new Error(
        `Invalid transition from ${currentState.currentState} to ${toState}`,
      );
    }

    const transition: StateTransition = {
      from: currentState.currentState,
      to: toState,
      event,
      metadata,
    };

    currentState.history.push(transition);
    currentState.currentState = toState;

    if (metadata) {
      currentState.metadata = { ...currentState.metadata, ...metadata };
    }

    // Update progress based on state
    currentState.progress = this.calculateProgress(currentState);

    // Save to cache and database
    await this.saveState(currentState);
    await this.persistState(taskId, currentState);

    // Publish event to Kafka
    await this.kafka.publish(this.KAFKA_TOPIC, {
      type: 'STATE_TRANSITION',
      taskId,
      transition,
      timestamp: new Date().toISOString(),
    });

    return currentState;
  }

  async getState(taskId: string): Promise<WorkflowStateData> {
    // Try cache first
    const cached = await this.redis.get(this.STATE_KEY_PREFIX + taskId);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const dbState = await this.prisma.workflowState.findUnique({
      where: { taskId },
    });

    if (!dbState) {
      throw new Error(`Workflow state not found for task ${taskId}`);
    }

    const stateData: WorkflowStateData = {
      taskId,
      currentState: dbState.currentStep as WorkflowState,
      progress: dbState.progress,
      history: (dbState.history as any) as StateTransition[],
      retryCount: dbState.retryCount,
      lastError: dbState.lastError ?? undefined,
      metadata: dbState.state as any,
    };

    // Populate cache
    await this.saveState(stateData);

    return stateData;
  }

  private async saveState(state: WorkflowStateData): Promise<void> {
    await this.redis.set(
      this.STATE_KEY_PREFIX + state.taskId,
      JSON.stringify(state),
      3600, // 1 hour TTL
    );
  }

  private async persistState(
    taskId: string,
    state: WorkflowStateData,
  ): Promise<void> {
    await this.prisma.workflowState.upsert({
      where: { taskId },
      create: {
        taskId,
        currentStep: state.currentState,
        progress: state.progress,
        state: state.metadata,
        history: state.history as any,
        retryCount: state.retryCount,
        lastError: state.lastError,
      },
      update: {
        currentStep: state.currentState,
        progress: state.progress,
        state: state.metadata,
        history: state.history as any,
        retryCount: state.retryCount,
        lastError: state.lastError,
      },
    });
  }

  private isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
    const validTransitions: Record<WorkflowState, WorkflowState[]> = {
      [WorkflowState.IDLE]: [WorkflowState.PLANNING],
      [WorkflowState.PLANNING]: [WorkflowState.EXECUTING, WorkflowState.FAILED],
      [WorkflowState.EXECUTING]: [
        WorkflowState.TESTING,
        WorkflowState.DELIVERING,
        WorkflowState.DEBUGGING,
        WorkflowState.FAILED,
      ],
      [WorkflowState.TESTING]: [
        WorkflowState.DEBUGGING,
        WorkflowState.DELIVERING,
        WorkflowState.FAILED,
      ],
      [WorkflowState.DEBUGGING]: [
        WorkflowState.EXECUTING,
        WorkflowState.RETRYING,
        WorkflowState.FAILED,
      ],
      [WorkflowState.RETRYING]: [
        WorkflowState.EXECUTING,
        WorkflowState.FAILED,
      ],
      [WorkflowState.DELIVERING]: [WorkflowState.COMPLETED, WorkflowState.FAILED],
      [WorkflowState.COMPLETED]: [],
      [WorkflowState.FAILED]: [WorkflowState.RETRYING],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  private calculateProgress(state: WorkflowStateData): number {
    const stateProgress: Record<WorkflowState, number> = {
      [WorkflowState.IDLE]: 0,
      [WorkflowState.PLANNING]: 10,
      [WorkflowState.EXECUTING]: 40,
      [WorkflowState.TESTING]: 60,
      [WorkflowState.DEBUGGING]: 50,
      [WorkflowState.RETRYING]: 45,
      [WorkflowState.DELIVERING]: 85,
      [WorkflowState.COMPLETED]: 100,
      [WorkflowState.FAILED]: state.progress, // Keep current progress
    };

    return stateProgress[state.currentState] ?? state.progress;
  }

  async markFailed(taskId: string, error: string): Promise<void> {
    const state = await this.getState(taskId);
    state.lastError = error;
    
    await this.transition(taskId, WorkflowState.FAILED, 'ERROR', { error });
    
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
    });
  }

  async markCompleted(taskId: string, result?: string): Promise<void> {
    await this.transition(taskId, WorkflowState.COMPLETED, 'COMPLETE', { result });
    
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
      },
    });
  }

  async incrementRetry(taskId: string): Promise<number> {
    const state = await this.getState(taskId);
    state.retryCount++;
    await this.saveState(state);
    await this.persistState(taskId, state);
    return state.retryCount;
  }
}
