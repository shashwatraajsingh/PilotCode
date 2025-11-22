import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProviderService } from '../brain/ai-provider.service';
import { HandsService } from '../hands/hands.service';
import { CommandExecutorService } from './command-executor.service';
import { ExecutionResult } from './docker-sandbox.service';

export interface DebugSession {
  taskId: string;
  command: string;
  workDir: string;
  maxRetries: number;
  context?: string;
}

export interface DebugResult {
  success: boolean;
  attempts: number;
  finalOutput: ExecutionResult;
  fixes: Array<{
    attempt: number;
    error: string;
    diagnosis: string;
    fix: string;
    filesModified: string[];
  }>;
}

@Injectable()
export class DebugLoopService {
  private maxRetries: number;

  constructor(
    private configService: ConfigService,
    private aiProvider: AIProviderService,
    private hands: HandsService,
    private executor: CommandExecutorService,
  ) {
    this.maxRetries = parseInt(this.configService.get('MAX_RETRIES') || '3');
  }

  async executeWithDebugLoop(session: DebugSession): Promise<DebugResult> {
    const maxRetries = session.maxRetries || this.maxRetries;
    const fixes: DebugResult['fixes'] = [];
    let lastResult: ExecutionResult;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Execute command
      lastResult = await this.executor.executeCommand(session.taskId, {
        command: session.command,
        workDir: session.workDir,
      });

      // Success!
      if (lastResult.exitCode === 0) {
        return {
          success: true,
          attempts: attempt + 1,
          finalOutput: lastResult,
          fixes,
        };
      }

      // Failed, analyze error and attempt fix
      console.log(`❌ Attempt ${attempt + 1} failed. Analyzing error...`);

      const errorAnalysis = await this.analyzeError(
        lastResult.stderr || lastResult.stdout,
        session.command,
        session.context,
      );

      console.log(`🔍 Diagnosis: ${errorAnalysis.diagnosis}`);
      console.log(`🔧 Attempting fix: ${errorAnalysis.suggestedFix}`);

      // Apply fixes
      const modifiedFiles = await this.applyFixes(
        errorAnalysis.filesToModify,
        session.workDir,
      );

      fixes.push({
        attempt: attempt + 1,
        error: lastResult.stderr || lastResult.stdout,
        diagnosis: errorAnalysis.diagnosis,
        fix: errorAnalysis.suggestedFix,
        filesModified: modifiedFiles,
      });

      // Run additional commands if suggested
      if (errorAnalysis.commandsToRun?.length > 0) {
        for (const cmd of errorAnalysis.commandsToRun) {
          await this.executor.executeCommand(session.taskId, {
            command: cmd,
            workDir: session.workDir,
          });
        }
      }
    }

    // Max retries exhausted
    return {
      success: false,
      attempts: maxRetries,
      finalOutput: lastResult!,
      fixes,
    };
  }

  private async analyzeError(
    errorOutput: string,
    command: string,
    context?: string,
  ): Promise<{
    diagnosis: string;
    suggestedFix: string;
    filesToModify: Array<{ path: string; changes: string }>;
    commandsToRun: string[];
  }> {
    const systemPrompt = `You are an expert debugging AI. Your job is to analyze error messages and suggest precise fixes.

When analyzing errors:
1. Identify the root cause, not just symptoms
2. Suggest minimal, targeted fixes
3. Consider common pitfalls and edge cases
4. Provide specific file changes and commands

Return your analysis as JSON with this structure:
{
  "diagnosis": "Clear explanation of the root cause",
  "suggestedFix": "High-level description of the fix",
  "filesToModify": [
    {
      "path": "src/file.ts",
      "changes": "Detailed description of changes needed"
    }
  ],
  "commandsToRun": ["npm install missing-package"]
}`;

    const userPrompt = `Command that failed:
${command}

Error output:
${errorOutput}

${context ? `Additional context:\n${context}` : ''}

Analyze this error and suggest fixes.`;

    const analysis = await this.aiProvider.generateStructuredOutput<any>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'ErrorAnalysis',
    );

    return analysis;
  }

  private async applyFixes(
    filesToModify: Array<{ path: string; changes: string }>,
    workDir: string,
  ): Promise<string[]> {
    const operations = filesToModify.map((file) => ({
      type: 'update' as const,
      filePath: `${workDir}/${file.path}`,
      description: file.changes,
    }));

    const results = await this.hands.executeFileOperations(operations);

    return results
      .filter((r) => r.success)
      .map((r) => r.filePath);
  }

  async runTestsWithFixes(
    taskId: string,
    testCommand: string,
    workDir: string,
    context?: string,
  ): Promise<DebugResult> {
    return this.executeWithDebugLoop({
      taskId,
      command: testCommand,
      workDir,
      maxRetries: this.maxRetries,
      context: `Running tests: ${testCommand}\n${context || ''}`,
    });
  }
}
