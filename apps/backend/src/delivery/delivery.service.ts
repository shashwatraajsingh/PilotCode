import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GitService } from './git.service';
import { GitHubService } from './github.service';

export interface DeliveryConfig {
  taskId: string;
  repoPath: string;
  repoUrl: string;
  baseBranch: string;
  taskDescription: string;
}

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private git: GitService,
    private github: GitHubService,
  ) {}

  async deliverChanges(config: DeliveryConfig): Promise<{
    branchName: string;
    prNumber?: number;
    prUrl?: string;
    commits: string[];
  }> {
    const { taskId, repoPath, repoUrl, baseBranch, taskDescription } = config;

    // Parse repo URL
    const repoInfo = this.github.parseRepoUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('Invalid GitHub repository URL');
    }

    // Create delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        taskId,
        repoOwner: repoInfo.owner,
        repoName: repoInfo.repo,
        baseBranch,
        branchName: '', // Will update later
        status: 'PENDING',
        commits: [],
      },
    });

    try {
      // 1. Create branch
      const branchName = this.generateBranchName(taskDescription);
      await this.git.createBranch(repoPath, branchName, baseBranch);

      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          branchName,
          status: 'BRANCH_CREATED',
        },
      });

      // 2. Get changed files and diff
      const changedFiles = await this.git.getChangedFiles(repoPath);
      const diff = await this.git.getDiff(repoPath);

      // 3. Generate commit message
      const commitMessage = await this.github.generateCommitMessage(
        changedFiles,
        diff,
      );

      // 4. Commit changes
      const commitHash = await this.git.commitChanges(repoPath, commitMessage, {
        name: 'Devin AI',
        email: 'devin@ai.dev',
      });

      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          commits: [{ hash: commitHash, message: commitMessage }],
          status: 'COMMITTED',
        },
      });

      // 5. Push branch
      await this.git.pushBranch(repoPath, branchName);

      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'PUSHED' },
      });

      // 6. Create PR
      const prData = await this.github.generatePRDescription(
        taskDescription,
        changedFiles,
        diff,
      );

      const pr = await this.github.createPullRequest(
        repoInfo.owner,
        repoInfo.repo,
        {
          title: prData.title,
          body: prData.body,
          head: branchName,
          base: baseBranch,
        },
      );

      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          prNumber: pr.number,
          prUrl: pr.url,
          prTitle: prData.title,
          prBody: prData.body,
          status: 'PR_CREATED',
        },
      });

      return {
        branchName,
        prNumber: pr.number,
        prUrl: pr.url,
        commits: [commitHash],
      };
    } catch (error) {
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  async respondToCodeReview(
    taskId: string,
    reviewComments: string[],
  ): Promise<void> {
    const delivery = await this.prisma.delivery.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    if (!delivery || !delivery.prNumber) {
      throw new Error('No PR found for this task');
    }

    // Generate and post responses to each comment
    for (const comment of reviewComments) {
      const response = await this.github.respondToReview(
        delivery.repoOwner,
        delivery.repoName,
        delivery.prNumber,
        comment,
      );

      await this.github.addPRComment(
        delivery.repoOwner,
        delivery.repoName,
        delivery.prNumber,
        response,
      );
    }
  }

  async getDeliveryStatus(taskId: string) {
    return this.prisma.delivery.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateBranchName(taskDescription: string): string {
    // Convert task description to branch name
    // e.g., "Add JWT authentication" -> "feat/add-jwt-authentication"
    
    const sanitized = taskDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

    const type = this.detectBranchType(taskDescription);
    const timestamp = Date.now().toString().slice(-6);

    return `${type}/${sanitized}-${timestamp}`;
  }

  private detectBranchType(description: string): string {
    const lower = description.toLowerCase();

    if (lower.includes('fix') || lower.includes('bug')) {
      return 'fix';
    } else if (
      lower.includes('test') ||
      lower.includes('spec') ||
      lower.includes('coverage')
    ) {
      return 'test';
    } else if (
      lower.includes('refactor') ||
      lower.includes('cleanup') ||
      lower.includes('improve')
    ) {
      return 'refactor';
    } else if (lower.includes('doc')) {
      return 'docs';
    } else if (
      lower.includes('add') ||
      lower.includes('implement') ||
      lower.includes('create')
    ) {
      return 'feat';
    }

    return 'chore';
  }
}
