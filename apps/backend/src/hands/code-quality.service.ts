import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface QualityIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

export interface QualityReport {
  score: number; // 0-100
  issues: QualityIssue[];
  metrics: {
    linesOfCode: number;
    complexity: number;
    maintainability: number;
    testCoverage?: number;
  };
  suggestions: string[];
}

@Injectable()
export class CodeQualityService {
  private readonly logger = new Logger(CodeQualityService.name);

  async analyzeCode(
    repoPath: string,
    files?: string[],
  ): Promise<QualityReport> {
    this.logger.log(`Analyzing code quality in ${repoPath}`);

    const report: QualityReport = {
      score: 100,
      issues: [],
      metrics: {
        linesOfCode: 0,
        complexity: 0,
        maintainability: 100,
      },
      suggestions: [],
    };

    try {
      // Run ESLint for JavaScript/TypeScript
      const eslintIssues = await this.runESLint(repoPath, files);
      report.issues.push(...eslintIssues);

      // Run Pylint for Python
      const pylintIssues = await this.runPylint(repoPath, files);
      report.issues.push(...pylintIssues);

      // Calculate metrics
      report.metrics = await this.calculateMetrics(repoPath, files);

      // Calculate overall score
      report.score = this.calculateScore(report);

      // Generate suggestions
      report.suggestions = this.generateSuggestions(report);

      this.logger.log(`Code quality analysis complete: Score ${report.score}/100`);

      return report;
    } catch (error) {
      this.logger.error(`Failed to analyze code quality: ${error.message}`);
      throw error;
    }
  }

  private async runESLint(
    repoPath: string,
    files?: string[],
  ): Promise<QualityIssue[]> {
    try {
      const filePattern = files ? files.join(' ') : '.';
      const { stdout } = await execAsync(
        `npx eslint ${filePattern} --format json`,
        {
          cwd: repoPath,
          timeout: 30000,
        },
      ).catch(err => ({ stdout: err.stdout })); // ESLint exits with 1 when issues found

      if (!stdout) {
        return [];
      }

      const results = JSON.parse(stdout);
      const issues: QualityIssue[] = [];

      for (const result of results) {
        for (const message of result.messages || []) {
          issues.push({
            file: path.relative(repoPath, result.filePath),
            line: message.line,
            column: message.column,
            severity: message.severity === 2 ? 'error' : 'warning',
            message: message.message,
            rule: message.ruleId || 'unknown',
          });
        }
      }

      return issues;
    } catch (error) {
      this.logger.warn(`ESLint analysis skipped: ${error.message}`);
      return [];
    }
  }

  private async runPylint(
    repoPath: string,
    files?: string[],
  ): Promise<QualityIssue[]> {
    try {
      const filePattern = files ? files.filter(f => f.endsWith('.py')).join(' ') : '**/*.py';
      const { stdout } = await execAsync(
        `pylint ${filePattern} --output-format=json`,
        {
          cwd: repoPath,
          timeout: 30000,
        },
      ).catch(err => ({ stdout: err.stdout }));

      if (!stdout) {
        return [];
      }

      const results = JSON.parse(stdout);
      const issues: QualityIssue[] = [];

      for (const result of results) {
        issues.push({
          file: path.relative(repoPath, result.path),
          line: result.line,
          column: result.column,
          severity: result.type === 'error' ? 'error' : 'warning',
          message: result.message,
          rule: result['message-id'],
        });
      }

      return issues;
    } catch (error) {
      this.logger.warn(`Pylint analysis skipped: ${error.message}`);
      return [];
    }
  }

  private async calculateMetrics(
    repoPath: string,
    files?: string[],
  ): Promise<QualityReport['metrics']> {
    let linesOfCode = 0;
    let complexity = 0;

    try {
      // Count lines of code
      const filesToAnalyze = files || await this.getSourceFiles(repoPath);

      for (const file of filesToAnalyze) {
        const fullPath = path.join(repoPath, file);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n').filter(
            line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#'),
          );
          linesOfCode += lines.length;

          // Simple cyclomatic complexity estimation
          complexity += this.estimateComplexity(content);
        } catch {}
      }

      return {
        linesOfCode,
        complexity: Math.round(complexity / filesToAnalyze.length) || 1,
        maintainability: this.calculateMaintainability(linesOfCode, complexity),
      };
    } catch (error) {
      return {
        linesOfCode: 0,
        complexity: 1,
        maintainability: 100,
      };
    }
  }

  private async getSourceFiles(repoPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go'];

    const scan = async (dir: string, relative: string = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const relativePath = path.join(relative, entry.name);

          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
              await scan(path.join(dir, entry.name), relativePath);
            }
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(relativePath);
          }
        }
      } catch {}
    };

    await scan(repoPath);
    return files;
  }

  private estimateComplexity(content: string): number {
    let complexity = 1; // Base complexity

    // Count control flow statements
    const controlFlow = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*.*:/g, // Ternary operator
    ];

    for (const pattern of controlFlow) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateMaintainability(linesOfCode: number, complexity: number): number {
    // Simplified maintainability index
    // Higher is better (0-100)
    const volume = linesOfCode * Math.log2(linesOfCode || 1);
    const mi = Math.max(0, (171 - 5.2 * Math.log(volume) - 0.23 * complexity) * 100 / 171);
    return Math.round(mi);
  }

  private calculateScore(report: QualityReport): number {
    let score = 100;

    // Deduct points for issues
    const errors = report.issues.filter(i => i.severity === 'error').length;
    const warnings = report.issues.filter(i => i.severity === 'warning').length;

    score -= errors * 5;
    score -= warnings * 2;

    // Consider maintainability
    score = (score + report.metrics.maintainability) / 2;

    // Consider complexity
    if (report.metrics.complexity > 10) {
      score -= (report.metrics.complexity - 10) * 2;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateSuggestions(report: QualityReport): string[] {
    const suggestions: string[] = [];

    if (report.issues.length > 20) {
      suggestions.push('Consider addressing code quality issues before proceeding');
    }

    if (report.metrics.complexity > 15) {
      suggestions.push('High cyclomatic complexity detected. Consider refactoring complex functions');
    }

    if (report.metrics.maintainability < 50) {
      suggestions.push('Maintainability index is low. Consider improving code structure and reducing complexity');
    }

    const errorCount = report.issues.filter(i => i.severity === 'error').length;
    if (errorCount > 0) {
      suggestions.push(`Fix ${errorCount} critical error(s) before deployment`);
    }

    if (report.metrics.linesOfCode > 10000) {
      suggestions.push('Large codebase detected. Ensure proper modularization and testing');
    }

    return suggestions;
  }

  async formatCode(repoPath: string, files?: string[]): Promise<void> {
    this.logger.log('Formatting code...');

    try {
      // Run Prettier for JS/TS
      const filePattern = files ? files.join(' ') : '.';
      await execAsync(`npx prettier --write ${filePattern}`, {
        cwd: repoPath,
        timeout: 30000,
      });

      // Run Black for Python
      await execAsync(`black ${filePattern}`, {
        cwd: repoPath,
        timeout: 30000,
      }).catch(() => {});

      this.logger.log('Code formatting complete');
    } catch (error) {
      this.logger.warn(`Code formatting failed: ${error.message}`);
    }
  }
}
