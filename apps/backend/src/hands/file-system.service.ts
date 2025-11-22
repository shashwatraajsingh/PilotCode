import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FileSystemService {
  constructor(private prisma: PrismaService) {}

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  async createFile(filePath: string, content: string): Promise<void> {
    const exists = await this.fileExists(filePath);
    if (exists) {
      throw new Error(`File ${filePath} already exists`);
    }

    await this.writeFile(filePath, content);

    // Log file creation
    await this.prisma.fileModification.create({
      data: {
        filePath,
        operation: 'CREATE',
        newContent: content,
        successful: true,
      },
    });
  }

  async updateFile(filePath: string, newContent: string, diff?: string): Promise<void> {
    const originalContent = await this.readFile(filePath);
    await this.writeFile(filePath, newContent);

    // Log file modification
    await this.prisma.fileModification.create({
      data: {
        filePath,
        operation: 'UPDATE',
        originalContent,
        newContent,
        diff: diff || this.generateDiff(originalContent, newContent),
        successful: true,
      },
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const originalContent = await this.readFile(filePath);
      await fs.unlink(filePath);

      // Log file deletion
      await this.prisma.fileModification.create({
        data: {
          filePath,
          operation: 'DELETE',
          originalContent,
          successful: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      })) as any;
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  async getDirectoryTree(dirPath: string, maxDepth: number = 3): Promise<any> {
    const tree = await this.buildTree(dirPath, 0, maxDepth);
    return tree;
  }

  private async buildTree(dirPath: string, currentDepth: number, maxDepth: number): Promise<any> {
    if (currentDepth >= maxDepth) return null;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree: any = {};

    for (const entry of entries) {
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        tree[entry.name] = await this.buildTree(fullPath, currentDepth + 1, maxDepth);
      } else {
        tree[entry.name] = 'file';
      }
    }

    return tree;
  }

  private generateDiff(original: string, modified: string): string {
    const Diff = require('diff');
    const diff = Diff.createPatch('file', original, modified, '', '');
    return diff;
  }
}
