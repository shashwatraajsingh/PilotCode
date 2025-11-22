import { Injectable } from '@nestjs/common';
import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';

@Injectable()
export class GitService {
  async initRepository(repoPath: string): Promise<SimpleGit> {
    return simpleGit(repoPath);
  }

  async cloneRepository(
    repoUrl: string,
    targetPath: string,
    branch?: string,
  ): Promise<SimpleGit> {
    const git = simpleGit();
    
    const cloneOptions = branch ? ['--branch', branch] : [];
    await git.clone(repoUrl, targetPath, cloneOptions);
    
    return simpleGit(targetPath);
  }

  async createBranch(
    repoPath: string,
    branchName: string,
    baseBranch: string = 'main',
  ): Promise<void> {
    const git = simpleGit(repoPath);
    
    // Ensure we're on base branch
    await git.checkout(baseBranch);
    
    // Create and checkout new branch
    await git.checkoutLocalBranch(branchName);
  }

  async commitChanges(
    repoPath: string,
    message: string,
    author?: { name: string; email: string },
  ): Promise<string> {
    const git = simpleGit(repoPath);
    
    // Add all changes
    await git.add('.');
    
    // Commit
    const commitOptions = author
      ? [`--author="${author.name} <${author.email}>"`]
      : [];
    
    const result = await git.commit(message, undefined, commitOptions as any);
    
    return result.commit;
  }

  async pushBranch(
    repoPath: string,
    branchName: string,
    remote: string = 'origin',
  ): Promise<void> {
    const git = simpleGit(repoPath);
    await git.push(remote, branchName, ['--set-upstream']);
  }

  async getChangedFiles(repoPath: string): Promise<string[]> {
    const git = simpleGit(repoPath);
    const status = await git.status();
    
    return [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map((r) => r.to),
    ];
  }

  async getDiff(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath);
    const diff = await git.diff();
    return diff;
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath);
    const branch = await git.branchLocal();
    return branch.current;
  }

  async getCommitHistory(
    repoPath: string,
    maxCount: number = 10,
  ): Promise<any[]> {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount });
    return [...log.all];
  }

  async cherryPickCommits(
    repoPath: string,
    commitHashes: string[],
  ): Promise<void> {
    const git = simpleGit(repoPath);
    
    for (const hash of commitHashes) {
      await git.raw(['cherry-pick', hash]);
    }
  }

  async revertToCommit(repoPath: string, commitHash: string): Promise<void> {
    const git = simpleGit(repoPath);
    await git.reset(['--hard', commitHash]);
  }
}
