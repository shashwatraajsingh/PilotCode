import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DockerSandboxService, ExecutionResult } from './docker-sandbox.service';

// Re-export for convenience
export { ExecutionResult };

export interface CommandExecution {
  command: string;
  workDir: string;
  env?: Record<string, string>;
  timeout?: number;
  sandboxed?: boolean;
}

@Injectable()
export class CommandExecutorService {
  constructor(
    private prisma: PrismaService,
    private dockerSandbox: DockerSandboxService,
  ) {}

  async executeCommand(
    taskId: string,
    execution: CommandExecution,
  ): Promise<ExecutionResult> {
    // Create execution record
    const record = await this.prisma.execution.create({
      data: {
        taskId,
        type: this.detectExecutionType(execution.command),
        command: execution.command,
        workingDir: execution.workDir,
        status: 'RUNNING',
        sandboxed: execution.sandboxed !== false,
      },
    });

    try {
      const result = await this.dockerSandbox.executeInSandbox(
        execution.command,
        {
          image: 'node:18-alpine',
          workDir: execution.workDir,
          env: execution.env,
          timeout: execution.timeout,
        },
      );

      // Update execution record
      await this.prisma.execution.update({
        where: { id: record.id },
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          duration: result.duration,
          containerId: result.containerId,
          status: result.exitCode === 0 ? 'SUCCESS' : 'FAILED',
          completedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      await this.prisma.execution.update({
        where: { id: record.id },
        data: {
          stderr: error.message,
          exitCode: 1,
          status: 'FAILED',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async executeMultipleCommands(
    taskId: string,
    commands: string[],
    workDir: string,
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const command of commands) {
      const result = await this.executeCommand(taskId, {
        command,
        workDir,
      });

      results.push(result);

      // Stop if a command fails
      if (result.exitCode !== 0) {
        break;
      }
    }

    return results;
  }

  private detectExecutionType(command: string): 'COMMAND' | 'TEST' | 'BUILD' | 'INSTALL' | 'SCRIPT' {
    if (command.includes('test') || command.includes('jest') || command.includes('mocha')) {
      return 'TEST';
    } else if (command.includes('build') || command.includes('compile')) {
      return 'BUILD';
    } else if (command.includes('install') || command.includes('npm i') || command.includes('yarn add')) {
      return 'INSTALL';
    } else if (command.includes('npm run') || command.includes('yarn')) {
      return 'SCRIPT';
    }
    return 'COMMAND';
  }

  async getExecutionHistory(taskId: string) {
    return this.prisma.execution.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
