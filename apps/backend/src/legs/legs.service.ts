import { Injectable } from '@nestjs/common';
import { CommandExecutorService } from './command-executor.service';
import { DebugLoopService } from './debug-loop.service';
import { DockerSandboxService } from './docker-sandbox.service';

@Injectable()
export class LegsService {
  constructor(
    private executor: CommandExecutorService,
    private debugLoop: DebugLoopService,
    private sandbox: DockerSandboxService,
  ) {}

  async executeCommand(taskId: string, command: string, workDir: string) {
    return this.executor.executeCommand(taskId, { command, workDir });
  }

  async executeWithAutoDebug(
    taskId: string,
    command: string,
    workDir: string,
    context?: string,
  ) {
    return this.debugLoop.executeWithDebugLoop({
      taskId,
      command,
      workDir,
      maxRetries: 3,
      context,
    });
  }

  async runTests(taskId: string, testCommand: string, workDir: string) {
    return this.debugLoop.runTestsWithFixes(taskId, testCommand, workDir);
  }

  async getExecutionHistory(taskId: string) {
    return this.executor.getExecutionHistory(taskId);
  }
}
