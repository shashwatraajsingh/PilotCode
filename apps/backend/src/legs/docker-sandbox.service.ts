import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Docker from 'dockerode';

export interface SandboxConfig {
  image: string;
  workDir: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  containerId: string;
}

@Injectable()
export class DockerSandboxService implements OnModuleInit {
  private docker: Docker;
  private useSandbox: boolean;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    this.useSandbox = this.configService.get('USE_DOCKER_SANDBOX') === 'true';

    if (this.useSandbox) {
      this.docker = new Docker();
      await this.ensureSandboxImage();
      console.log('✅ Docker sandbox ready');
    }
  }

  private async ensureSandboxImage() {
    const imageName = this.configService.get('DOCKER_SANDBOX_IMAGE') || 'devin-sandbox:latest';

    try {
      await this.docker.getImage(imageName).inspect();
    } catch (error) {
      console.log('Building sandbox image...');
      // Image doesn't exist, would need to build it
      // For now, we'll use a base image
    }
  }

  async executeInSandbox(
    command: string,
    config: SandboxConfig,
  ): Promise<ExecutionResult> {
    if (!this.useSandbox) {
      return this.executeLocally(command, config.workDir);
    }

    const startTime = Date.now();

    try {
      // Create container
      const container = await this.docker.createContainer({
        Image: config.image || 'node:18-alpine',
        Cmd: ['/bin/sh', '-c', command],
        WorkingDir: config.workDir || '/workspace',
        Env: config.env ? Object.entries(config.env).map(([k, v]) => `${k}=${v}`) : [],
        HostConfig: {
          AutoRemove: true,
          Memory: 512 * 1024 * 1024, // 512MB
          MemorySwap: 512 * 1024 * 1024,
          CpuQuota: 50000, // 50% CPU
          NetworkMode: 'none', // Isolated network
        },
        AttachStdout: true,
        AttachStderr: true,
      });

      // Start container
      await container.start();

      // Wait for execution with timeout
      const timeout = config.timeout || 300000; // 5 minutes default
      const result = await Promise.race([
        this.waitForContainer(container),
        this.timeoutPromise(timeout),
      ]);

      const duration = Date.now() - startTime;

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        duration,
        containerId: container.id,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        duration,
        containerId: 'error',
      };
    }
  }

  private async waitForContainer(container: Docker.Container): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    let stdout = '';
    let stderr = '';

    stream.on('data', (chunk) => {
      const str = chunk.toString();
      // Docker multiplexes stdout/stderr, first 8 bytes are header
      const header = chunk[0];
      const data = chunk.slice(8).toString();

      if (header === 1) {
        stdout += data;
      } else if (header === 2) {
        stderr += data;
      }
    });

    const info = await container.wait();

    return {
      stdout,
      stderr,
      exitCode: info.StatusCode,
    };
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), ms);
    });
  }

  private async executeLocally(
    command: string,
    workDir: string,
  ): Promise<ExecutionResult> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: workDir });
      const duration = Date.now() - startTime;

      return {
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        duration,
        containerId: 'local',
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        duration,
        containerId: 'local',
      };
    }
  }

  async cleanup(containerId: string) {
    if (!this.useSandbox || containerId === 'local' || containerId === 'error') {
      return;
    }

    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
    } catch (error) {
      // Container might already be removed (AutoRemove)
      console.warn(`Failed to cleanup container ${containerId}:`, error.message);
    }
  }
}
