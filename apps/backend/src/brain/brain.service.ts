import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AIProviderService } from './ai-provider.service';
import { CreateTaskDto } from './dto/create-task.dto';

interface SubTaskPlan {
  id: string;
  order: number;
  description: string;
  filesToEdit: string[];
  codeChanges: string;
  commandsToRun: string[];
  verificationSteps: string[];
  successConditions: string[];
  failureConditions: string[];
  dependencies: string[];
}

interface ExecutionPlanResponse {
  subtasks: SubTaskPlan[];
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
  risks: string[];
}

@Injectable()
export class BrainService {
  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
  ) {}

  async planTask(dto: CreateTaskDto) {
    // Create task record
    const task = await this.prisma.task.create({
      data: {
        description: dto.description,
        repoUrl: dto.repoUrl,
        repoPath: dto.repoPath,
        targetBranch: dto.targetBranch || 'main',
        status: 'PLANNED',
      },
    });

    // Generate execution plan using AI (with user-provided keys if available)
    const plan = await this.generateExecutionPlan(
      task.description, 
      dto.context,
      dto.openaiApiKey,
      dto.anthropicApiKey
    );

    // Save execution plan to database
    const executionPlan = await this.prisma.executionPlan.create({
      data: {
        taskId: task.id,
        metadata: {
          estimatedDuration: plan.estimatedDuration,
          complexity: plan.complexity,
          risks: plan.risks,
        },
        subtasks: {
          create: plan.subtasks.map((subtask) => ({
            order: subtask.order,
            description: subtask.description,
            filesToEdit: subtask.filesToEdit,
            codeChanges: subtask.codeChanges,
            commandsToRun: subtask.commandsToRun,
            verificationSteps: subtask.verificationSteps,
            successConditions: subtask.successConditions,
            failureConditions: subtask.failureConditions,
            dependencies: subtask.dependencies,
            status: 'PLANNED',
          })),
        },
      },
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      taskId: task.id,
      executionPlan,
    };
  }

  private async generateExecutionPlan(
    taskDescription: string,
    context?: Record<string, any>,
    openaiApiKey?: string,
    anthropicApiKey?: string,
  ): Promise<ExecutionPlanResponse> {
    const systemPrompt = `You are Devin, an autonomous AI software engineer. Your job is to break down software development tasks into detailed, executable subtasks.

For each subtask, you must specify:
1. **Description**: Clear description of what needs to be done
2. **Files to Edit**: List of file paths that need to be created or modified
3. **Code Changes**: High-level description of code changes needed
4. **Commands to Run**: Shell commands to execute (install deps, run tests, etc.)
5. **Verification Steps**: How to verify the subtask completed successfully
6. **Success Conditions**: Conditions that indicate success
7. **Failure Conditions**: Conditions that indicate failure
8. **Dependencies**: IDs of subtasks that must complete first

Think like a senior software engineer. Consider:
- Dependencies and execution order
- Error handling and edge cases
- Testing requirements
- Code quality and best practices
- Security considerations

Return your response as valid JSON matching this schema:
{
  "subtasks": [
    {
      "id": "unique-id",
      "order": 0,
      "description": "Install required dependencies",
      "filesToEdit": ["package.json"],
      "codeChanges": "Add jsonwebtoken and bcrypt packages",
      "commandsToRun": ["npm install jsonwebtoken bcrypt"],
      "verificationSteps": ["Check package.json for new dependencies", "Verify node_modules installed"],
      "successConditions": ["Dependencies installed successfully", "No version conflicts"],
      "failureConditions": ["npm install fails", "Dependency conflicts detected"],
      "dependencies": []
    }
  ],
  "estimatedDuration": "15-30 minutes",
  "complexity": "medium",
  "risks": ["Potential breaking changes", "May require database migration"]
}`;

    const userPrompt = `Task: ${taskDescription}

${context ? `Context:\n${JSON.stringify(context, null, 2)}` : ''}

Please create a detailed execution plan for this task. Break it down into clear, actionable subtasks that can be executed autonomously.`;

    const response = await this.aiProvider.generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        jsonMode: true,
        openaiApiKey,
        anthropicApiKey,
      }
    );

    try {
      return JSON.parse(response) as ExecutionPlanResponse;
    } catch (error) {
      throw new Error(`Failed to parse execution plan: ${error.message}`);
    }
  }

  async getExecutionPlan(taskId: string) {
    return this.prisma.executionPlan.findUnique({
      where: { taskId },
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
        task: true,
      },
    });
  }

  async updateSubtaskStatus(
    subtaskId: string,
    status: 'RUNNING' | 'SUCCESS' | 'FAILED',
    output?: string,
    error?: string,
  ) {
    return this.prisma.subTask.update({
      where: { id: subtaskId },
      data: {
        status,
        output,
        errorMessage: error,
        completedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : undefined,
      },
    });
  }

  async getNextSubtask(taskId: string) {
    const plan = await this.prisma.executionPlan.findUnique({
      where: { taskId },
      include: {
        subtasks: {
          where: { status: 'PLANNED' },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    return plan?.subtasks[0] || null;
  }
}
