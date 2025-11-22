import { Injectable } from '@nestjs/common';
import { BrainService } from '../brain/brain.service';
import { WorkflowService } from '../workflow/workflow.service';
import { DeliveryService } from '../delivery/delivery.service';
import { GitService } from '../delivery/git.service';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateTaskRequest {
  description: string;
  repoUrl?: string;
  repoPath?: string;
  targetBranch?: string;
  autoDeliver?: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    private brain: BrainService,
    private workflow: WorkflowService,
    private delivery: DeliveryService,
    private git: GitService,
    private prisma: PrismaService,
  ) {}

  async createAndExecuteTask(request: CreateTaskRequest) {
    // STEP 1: Brain - Create execution plan
    const { taskId, executionPlan } = await this.brain.planTask({
      description: request.description,
      repoUrl: request.repoUrl,
      repoPath: request.repoPath,
      targetBranch: request.targetBranch || 'main',
    });

    // Clone repository if URL provided
    let repoPath = request.repoPath;
    if (request.repoUrl && !repoPath) {
      const tempDir = `/tmp/devin-${taskId}`;
      await this.git.cloneRepository(
        request.repoUrl,
        tempDir,
        request.targetBranch,
      );
      repoPath = tempDir;

      // Update task with repo path
      await this.prisma.task.update({
        where: { id: taskId },
        data: { repoPath },
      });
    }

    if (!repoPath) {
      throw new Error('Either repoUrl or repoPath must be provided');
    }

    // STEP 2-4: Workflow - Execute tasks (uses Hands, Legs, and Workflow Engine)
    await this.workflow.startWorkflow(taskId, repoPath);

    // STEP 5: Delivery - Auto-deliver if requested
    if (request.autoDeliver && request.repoUrl) {
      // This will be triggered automatically when workflow completes
      // For now, return the task ID
    }

    const metadata = executionPlan.metadata as any;
    return {
      taskId,
      status: 'started',
      message: 'Task execution started',
      executionPlan: {
        subtaskCount: executionPlan.subtasks.length,
        estimatedDuration: metadata?.estimatedDuration,
        complexity: metadata?.complexity,
      },
    };
  }

  async getTaskDetails(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        executionPlan: {
          include: {
            subtasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const workflowStatus = await this.workflow.getWorkflowStatus(taskId);

    return {
      task,
      workflowStatus,
    };
  }

  async getAllTasks(limit: number = 20) {
    const tasks = await this.prisma.task.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        executionPlan: {
          include: {
            subtasks: {
              select: {
                id: true,
                description: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return tasks;
  }

  async deliverTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.repoUrl || !task.repoPath) {
      throw new Error('Task must have repository URL and path for delivery');
    }

    const result = await this.delivery.deliverChanges({
      taskId,
      repoPath: task.repoPath,
      repoUrl: task.repoUrl,
      baseBranch: task.targetBranch || 'main',
      taskDescription: task.description,
    });

    return result;
  }
}
