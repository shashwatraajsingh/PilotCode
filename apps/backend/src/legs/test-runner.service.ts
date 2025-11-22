import { Injectable, Logger } from '@nestjs/common';
import { CommandExecutorService, ExecutionResult } from './command-executor.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestResult {
  framework: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failures: Array<{
    test: string;
    message: string;
    stack?: string;
  }>;
}

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);

  constructor(private commandExecutor: CommandExecutorService) {}

  async runTests(
    taskId: string,
    repoPath: string,
    specificTests?: string[],
  ): Promise<TestResult> {
    this.logger.log(`Running tests in ${repoPath}`);

    try {
      // Detect test framework
      const framework = await this.detectTestFramework(repoPath);
      this.logger.log(`Detected test framework: ${framework}`);

      // Run tests based on framework
      let result: ExecutionResult;
      
      switch (framework) {
        case 'jest':
          result = await this.runJestTests(taskId, repoPath, specificTests);
          break;
        case 'mocha':
          result = await this.runMochaTests(taskId, repoPath, specificTests);
          break;
        case 'pytest':
          result = await this.runPytestTests(taskId, repoPath, specificTests);
          break;
        case 'go-test':
          result = await this.runGoTests(taskId, repoPath, specificTests);
          break;
        default:
          throw new Error(`Unsupported test framework: ${framework}`);
      }

      // Parse test results
      return this.parseTestResults(result, framework);
    } catch (error) {
      this.logger.error(`Test execution failed: ${error.message}`);
      throw error;
    }
  }

  private async detectTestFramework(repoPath: string): Promise<string> {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(repoPath, 'package.json'), 'utf-8'),
      );

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (deps.jest || deps['@types/jest']) return 'jest';
      if (deps.mocha) return 'mocha';
    } catch {}

    try {
      await fs.access(path.join(repoPath, 'pytest.ini'));
      return 'pytest';
    } catch {}

    try {
      await fs.access(path.join(repoPath, 'go.mod'));
      return 'go-test';
    } catch {}

    return 'jest'; // Default
  }

  private async runJestTests(
    taskId: string,
    repoPath: string,
    specificTests?: string[],
  ): Promise<ExecutionResult> {
    const testPattern = specificTests ? specificTests.join('|') : '';
    const command = testPattern
      ? `npm test -- --testPathPattern="${testPattern}" --json --coverage`
      : 'npm test -- --json --coverage';

    return this.commandExecutor.executeCommand(taskId, {
      command,
      workDir: repoPath,
      timeout: 300000, // 5 minutes
    });
  }

  private async runMochaTests(
    taskId: string,
    repoPath: string,
    specificTests?: string[],
  ): Promise<ExecutionResult> {
    const testPattern = specificTests ? specificTests.join(' ') : 'test/**/*.test.js';
    const command = `npx mocha ${testPattern} --reporter json`;

    return this.commandExecutor.executeCommand(taskId, {
      command,
      workDir: repoPath,
      timeout: 300000,
    });
  }

  private async runPytestTests(
    taskId: string,
    repoPath: string,
    specificTests?: string[],
  ): Promise<ExecutionResult> {
    const testPattern = specificTests ? specificTests.join(' ') : '';
    const command = testPattern
      ? `pytest ${testPattern} --json-report --cov`
      : 'pytest --json-report --cov';

    return this.commandExecutor.executeCommand(taskId, {
      command,
      workDir: repoPath,
      timeout: 300000,
    });
  }

  private async runGoTests(
    taskId: string,
    repoPath: string,
    specificTests?: string[],
  ): Promise<ExecutionResult> {
    const testPattern = specificTests ? `-run ${specificTests.join('|')}` : '';
    const command = `go test ./... ${testPattern} -json -cover`;

    return this.commandExecutor.executeCommand(taskId, {
      command,
      workDir: repoPath,
      timeout: 300000,
    });
  }

  private parseTestResults(
    result: ExecutionResult,
    framework: string,
  ): TestResult {
    const testResult: TestResult = {
      framework,
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      failures: [],
    };

    try {
      if (framework === 'jest') {
        return this.parseJestResults(result);
      } else if (framework === 'mocha') {
        return this.parseMochaResults(result);
      } else if (framework === 'pytest') {
        return this.parsePytestResults(result);
      }
    } catch (error) {
      this.logger.warn(`Failed to parse test results: ${error.message}`);
    }

    return testResult;
  }

  private parseJestResults(result: ExecutionResult): TestResult {
    try {
      const data = JSON.parse(result.stdout);

      return {
        framework: 'jest',
        passed: data.numPassedTests || 0,
        failed: data.numFailedTests || 0,
        skipped: data.numPendingTests || 0,
        total: data.numTotalTests || 0,
        duration: data.testResults?.reduce((sum: number, r: any) => sum + (r.perfStats?.runtime || 0), 0) || 0,
        coverage: data.coverageMap ? {
          lines: data.coverageMap.total?.lines?.pct || 0,
          statements: data.coverageMap.total?.statements?.pct || 0,
          functions: data.coverageMap.total?.functions?.pct || 0,
          branches: data.coverageMap.total?.branches?.pct || 0,
        } : undefined,
        failures: data.testResults?.flatMap((suite: any) =>
          suite.assertionResults
            ?.filter((test: any) => test.status === 'failed')
            .map((test: any) => ({
              test: test.title,
              message: test.failureMessages?.join('\n') || 'Unknown error',
            }))
        ) || [],
      };
    } catch {
      return {
        framework: 'jest',
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        duration: 0,
        failures: [{ test: 'Parse Error', message: result.stderr }],
      };
    }
  }

  private parseMochaResults(result: ExecutionResult): TestResult {
    try {
      const data = JSON.parse(result.stdout);

      return {
        framework: 'mocha',
        passed: data.stats?.passes || 0,
        failed: data.stats?.failures || 0,
        skipped: data.stats?.pending || 0,
        total: data.stats?.tests || 0,
        duration: data.stats?.duration || 0,
        failures: data.failures?.map((test: any) => ({
          test: test.title,
          message: test.err?.message || 'Unknown error',
          stack: test.err?.stack,
        })) || [],
      };
    } catch {
      return {
        framework: 'mocha',
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        duration: 0,
        failures: [{ test: 'Parse Error', message: result.stderr }],
      };
    }
  }

  private parsePytestResults(result: ExecutionResult): TestResult {
    // Parse pytest JSON output
    try {
      const lines = result.stdout.split('\n');
      let passed = 0;
      let failed = 0;
      let skipped = 0;

      for (const line of lines) {
        if (line.includes('passed')) {
          const match = line.match(/(\d+) passed/);
          if (match) passed = parseInt(match[1]);
        }
        if (line.includes('failed')) {
          const match = line.match(/(\d+) failed/);
          if (match) failed = parseInt(match[1]);
        }
        if (line.includes('skipped')) {
          const match = line.match(/(\d+) skipped/);
          if (match) skipped = parseInt(match[1]);
        }
      }

      return {
        framework: 'pytest',
        passed,
        failed,
        skipped,
        total: passed + failed + skipped,
        duration: 0,
        failures: [],
      };
    } catch {
      return {
        framework: 'pytest',
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        duration: 0,
        failures: [{ test: 'Parse Error', message: result.stderr }],
      };
    }
  }

  async generateTests(
    repoPath: string,
    targetFile: string,
    aiGeneratedTests: string,
  ): Promise<void> {
    this.logger.log(`Generating tests for ${targetFile}`);

    const testFileName = this.getTestFileName(targetFile);
    const testFilePath = path.join(repoPath, testFileName);

    await fs.writeFile(testFilePath, aiGeneratedTests, 'utf-8');

    this.logger.log(`Test file created: ${testFileName}`);
  }

  private getTestFileName(sourceFile: string): string {
    const ext = path.extname(sourceFile);
    const base = path.basename(sourceFile, ext);
    const dir = path.dirname(sourceFile);

    // Different conventions for different languages
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      return path.join(dir, `${base}.test${ext}`);
    } else if (ext === '.py') {
      return path.join(dir, `test_${base}${ext}`);
    } else if (ext === '.go') {
      return path.join(dir, `${base}_test${ext}`);
    }

    return path.join(dir, `${base}.test${ext}`);
  }
}
