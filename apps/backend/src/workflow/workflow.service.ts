import { Injectable } from '@nestjs/common';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { StateMachineService } from './state-machine.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WorkflowService {
  constructor(
    private orchestrator: TaskOrchestratorService,
    private stateMachine: StateMachineService,
    private prisma: PrismaService,
  ) {}

  async startWorkflow(taskId: string, repoPath: string) {
    // Execute in background
    setImmediate(() => {
      this.orchestrator.executeTask(taskId, repoPath).catch((error) => {
        console.error('Workflow execution failed:', error);
      });
    });

    return {
      taskId,
      status: 'started',
      message: 'Workflow execution started',
    };
  }

  async getWorkflowStatus(taskId: string) {
    return this.orchestrator.getTaskProgress(taskId);
  }

  async retryWorkflow(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'FAILED') {
      throw new Error('Only failed tasks can be retried');
    }

    // Reset retry count
    await this.prisma.workflowState.update({
      where: { taskId },
      data: { retryCount: 0 },
    });

    if (!task.repoPath) {
      throw new Error(`Task ${taskId} has no repository path`);
    }
    return this.startWorkflow(taskId, task.repoPath);
  }
}
