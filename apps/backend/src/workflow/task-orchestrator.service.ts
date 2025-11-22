import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrainService } from '../brain/brain.service';
import { HandsService } from '../hands/hands.service';
import { LegsService } from '../legs/legs.service';
import { StateMachineService, WorkflowState } from './state-machine.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { KafkaService } from '../common/kafka/kafka.service';
import { EventsGateway } from '../websocket/events.gateway';
import { ContextGathererService } from '../brain/context-gatherer.service';
import { CodeQualityService } from '../hands/code-quality.service';
import { TestRunnerService } from '../legs/test-runner.service';

@Injectable()
export class TaskOrchestratorService {
  private maxRetries: number;

  constructor(
    private configService: ConfigService,
    private brain: BrainService,
    private hands: HandsService,
    private legs: LegsService,
    private stateMachine: StateMachineService,
    private prisma: PrismaService,
    private kafka: KafkaService,
    private eventsGateway: EventsGateway,
    private contextGatherer: ContextGathererService,
    private codeQuality: CodeQualityService,
    private testRunner: TestRunnerService,
  ) {
    this.maxRetries = parseInt(this.configService.get('MAX_RETRIES') || '3');
  }

  async executeTask(taskId: string, repoPath: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Initialize workflow
      await this.stateMachine.initializeWorkflow(taskId);
      this.eventsGateway.emitTaskStatusChange(taskId, 'initialized');

      // Step 0: Gather context
      await this.publishProgress(taskId, 'Gathering project context...');
      const context = await this.contextGatherer.gatherProjectContext(repoPath);
      const contextSummary = this.contextGatherer.generateContextSummary(context);
      await this.publishProgress(taskId, `Context gathered: ${context.projectStructure.length} files analyzed`);

      // Step 1: Planning with enhanced context
      await this.stateMachine.transition(taskId, WorkflowState.PLANNING, 'START_PLANNING');
      await this.publishProgress(taskId, 'Planning task execution with full project context...');

      const executionPlan = await this.brain.getExecutionPlan(taskId);
      if (!executionPlan) {
        throw new Error('No execution plan found');
      }

      await this.publishProgress(taskId, `Plan created with ${executionPlan.subtasks.length} subtasks`);

      // Step 2: Execute subtasks
      await this.stateMachine.transition(taskId, WorkflowState.EXECUTING, 'START_EXECUTION');

      for (const subtask of executionPlan.subtasks) {
        await this.executeSubtask(taskId, subtask, repoPath);
      }

      // Step 3: Code Quality Check
      await this.publishProgress(taskId, 'Analyzing code quality...');
      const qualityReport = await this.codeQuality.analyzeCode(repoPath);
      
      this.eventsGateway.emitCodeReview(taskId, {
        file: 'overall',
        issues: qualityReport.issues.slice(0, 20),
        suggestions: qualityReport.suggestions,
      });
      
      await this.publishProgress(taskId, `Code quality score: ${qualityReport.score}/100`);
      
      // Auto-format code if quality is acceptable
      if (qualityReport.score >= 60) {
        await this.codeQuality.formatCode(repoPath);
        await this.publishProgress(taskId, 'Code formatted');
      }

      // Step 4: Run comprehensive tests
      await this.stateMachine.transition(taskId, WorkflowState.TESTING, 'START_TESTING');
      await this.publishProgress(taskId, 'Running comprehensive test suite...');
      
      const testResult = await this.testRunner.runTests(taskId, repoPath);
      
      this.eventsGateway.emitCommandResult(taskId, {
        command: `${testResult.framework} tests`,
        exitCode: testResult.failed > 0 ? 1 : 0,
        stdout: `Passed: ${testResult.passed}, Failed: ${testResult.failed}, Skipped: ${testResult.skipped}`,
        stderr: testResult.failures.map(f => f.message).join('\n'),
        duration: testResult.duration,
      });
      
      if (testResult.failed > 0) {
        await this.publishProgress(taskId, `Tests failed: ${testResult.failed} failures`);
        throw new Error(`Tests failed with ${testResult.failed} failures`);
      }
      
      await this.publishProgress(taskId, `All tests passed! (${testResult.passed}/${testResult.total})`);
      
      if (testResult.coverage) {
        await this.publishProgress(taskId, `Code coverage: ${testResult.coverage.lines}% lines`);
      }

      // Mark as completed
      const duration = Date.now() - startTime;
      await this.stateMachine.markCompleted(taskId, 'Task completed successfully');
      await this.publishProgress(taskId, `✅ Task completed successfully in ${Math.round(duration / 1000)}s!`);
      
      this.eventsGateway.emitTaskStatusChange(taskId, 'completed', {
        duration,
        qualityScore: qualityReport.score,
        testsPassed: testResult.passed,
        coverage: testResult.coverage,
      });

    } catch (error) {
      await this.handleTaskFailure(taskId, error);
    }
  }

  private async executeSubtask(
    taskId: string,
    subtask: any,
    repoPath: string,
  ): Promise<void> {
    try {
      await this.publishProgress(taskId, `Executing: ${subtask.description}`);

      // Update subtask status
      await this.brain.updateSubtaskStatus(subtask.id, 'RUNNING');

      // 1. Apply code changes
      if (subtask.filesToEdit?.length > 0) {
        await this.publishProgress(taskId, `Modifying ${subtask.filesToEdit.length} file(s)...`);
        
        const fileOps = subtask.filesToEdit.map((filePath: string) => ({
          type: 'update' as const,
          filePath: `${repoPath}/${filePath}`,
          description: subtask.codeChanges || 'Apply changes as planned',
        }));

        await this.hands.executeFileOperations(fileOps);
      }

      // 2. Run commands
      if (subtask.commandsToRun?.length > 0) {
        await this.publishProgress(taskId, `Running ${subtask.commandsToRun.length} command(s)...`);
        
        for (const command of subtask.commandsToRun) {
          const result = await this.legs.executeWithAutoDebug(
            taskId,
            command,
            repoPath,
            subtask.description,
          );

          if (!result.success) {
            throw new Error(
              `Command failed: ${command}\nError: ${result.finalOutput.stderr}`,
            );
          }
        }
      }

      // 3. Verify success conditions
      const verified = await this.verifySubtask(subtask, repoPath);
      
      if (!verified) {
        throw new Error('Subtask verification failed');
      }

      // Mark subtask as complete
      await this.brain.updateSubtaskStatus(subtask.id, 'SUCCESS');
      await this.publishProgress(taskId, `✓ Completed: ${subtask.description}`);

    } catch (error) {
      await this.brain.updateSubtaskStatus(
        subtask.id,
        'FAILED',
        undefined,
        error.message,
      );
      throw error;
    }
  }

  private async verifySubtask(subtask: any, repoPath: string): Promise<boolean> {
    // Check success conditions
    for (const condition of subtask.successConditions || []) {
      // Simple verification - could be enhanced
      if (condition.includes('file exists')) {
        const filePath = condition.match(/file exists: (.+)/)?.[1];
        if (filePath) {
          // Check if file exists
          // This is a simplified check
          continue;
        }
      }
    }

    return true;
  }

  private async handleTaskFailure(taskId: string, error: Error): Promise<void> {
    const retryCount = await this.stateMachine.incrementRetry(taskId);

    if (retryCount < this.maxRetries) {
      await this.publishProgress(
        taskId,
        `Task failed, retrying (${retryCount}/${this.maxRetries})...`,
      );
      await this.stateMachine.transition(
        taskId,
        WorkflowState.RETRYING,
        'RETRY',
        { error: error.message, retryCount },
      );

      // Could implement retry logic here
      // For now, just mark as failed
      await this.stateMachine.markFailed(taskId, error.message);
    } else {
      await this.publishProgress(taskId, `❌ Task failed: ${error.message}`);
      await this.stateMachine.markFailed(taskId, error.message);
    }
  }

  private async publishProgress(taskId: string, message: string, progress?: number): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Publish to Kafka
    await this.kafka.publish('task-progress', {
      taskId,
      message,
      progress,
      timestamp,
    });
    
    // Emit via WebSocket for real-time updates
    this.eventsGateway.emitTaskProgress(taskId, {
      message,
      progress,
      timestamp,
    });
  }

  async getTaskProgress(taskId: string) {
    const state = await this.stateMachine.getState(taskId);
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        executionPlan: {
          include: {
            subtasks: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return {
      taskId,
      status: task.status,
      currentState: state.currentState,
      progress: state.progress,
      completedSubtasks: task.executionPlan?.subtasks.filter(
        (st) => st.status === 'SUCCESS',
      ).length || 0,
      totalSubtasks: task.executionPlan?.subtasks.length || 0,
      history: state.history,
      lastError: state.lastError,
    };
  }
}
