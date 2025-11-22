import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { AIProviderService } from '../brain/ai-provider.service';

export interface PullRequestData {
  title: string;
  body: string;
  head: string;
  base: string;
}

@Injectable()
export class GitHubService {
  private octokit: Octokit;

  constructor(
    private configService: ConfigService,
    private aiProvider: AIProviderService,
  ) {
    const token = this.configService.get('GITHUB_TOKEN');
    if (!token) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    this.octokit = new Octokit({ auth: token });
  }

  async createPullRequest(
    owner: string,
    repo: string,
    data: PullRequestData,
  ): Promise<{ number: number; url: string }> {
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title: data.title,
      body: data.body,
      head: data.head,
      base: data.base,
    });

    return {
      number: response.data.number,
      url: response.data.html_url,
    };
  }

  async generatePRDescription(
    taskDescription: string,
    changedFiles: string[],
    diff: string,
  ): Promise<{ title: string; body: string }> {
    const systemPrompt = `You are an expert at writing clear, comprehensive pull request descriptions.

A good PR description includes:
1. Clear, concise title (max 72 chars)
2. Summary of changes
3. Motivation and context
4. List of changes made
5. Testing done
6. Screenshots (if UI changes)
7. Checklist of tasks completed

Format the body in Markdown.`;

    const userPrompt = `Task: ${taskDescription}

Files changed:
${changedFiles.map((f) => `- ${f}`).join('\n')}

Diff summary:
${diff.slice(0, 2000)}${diff.length > 2000 ? '...' : ''}

Generate a professional PR title and description.`;

    const response = await this.aiProvider.generateStructuredOutput<{
      title: string;
      body: string;
    }>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'PRDescription',
    );

    return response;
  }

  async generateCommitMessage(
    changes: string[],
    diff: string,
  ): Promise<string> {
    const systemPrompt = `You are an expert at writing conventional commit messages.

Format: <type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Subject: imperative mood, no period, max 72 chars

Examples:
- feat(auth): add JWT authentication middleware
- fix(api): resolve memory leak in user service
- refactor(database): migrate to Prisma ORM`;

    const userPrompt = `Files changed:
${changes.map((f) => `- ${f}`).join('\n')}

Diff:
${diff.slice(0, 1000)}

Generate a conventional commit message.`;

    const message = await this.aiProvider.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return message.trim();
  }

  async addPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ): Promise<void> {
    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    });
  }

  async getPRReviews(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<any[]> {
    const response = await this.octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    return response.data;
  }

  async respondToReview(
    owner: string,
    repo: string,
    prNumber: number,
    reviewComment: string,
  ): Promise<string> {
    // Use AI to generate appropriate response
    const systemPrompt = `You are responding to a code review comment. Be professional, constructive, and helpful.

If the review suggests changes:
- Acknowledge the feedback
- Explain your approach or agree to make changes
- Be specific about what you'll do

If the review is positive:
- Thank the reviewer
- Provide any additional context if helpful`;

    const userPrompt = `Review comment:
${reviewComment}

Generate an appropriate response.`;

    const response = await this.aiProvider.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return response.trim();
  }

  async getRepository(owner: string, repo: string): Promise<any> {
    const response = await this.octokit.repos.get({
      owner,
      repo,
    });

    return response.data;
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const response = await this.octokit.repos.listBranches({
      owner,
      repo,
    });

    return response.data.map((branch) => branch.name);
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash',
  ): Promise<void> {
    await this.octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: mergeMethod,
    });
  }

  parseRepoUrl(
    repoUrl: string,
  ): { owner: string; repo: string } | null {
    // Parse GitHub URL: https://github.com/owner/repo or git@github.com:owner/repo.git
    const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = repoUrl.match(/github\.com:([^/]+)\/(.+?)(\.git)?$/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    return null;
  }
}
