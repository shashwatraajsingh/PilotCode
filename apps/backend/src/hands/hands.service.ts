import { Injectable } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { CodeEditorService } from './code-editor.service';

@Injectable()
export class HandsService {
  constructor(
    private fileSystem: FileSystemService,
    private codeEditor: CodeEditorService,
  ) {}

  async executeFileOperations(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      filePath: string;
      description: string;
      context?: string;
    }>,
  ): Promise<Array<{ filePath: string; success: boolean; newContent?: string; error?: string }>> {
    const results: Array<{ filePath: string; success: boolean; newContent?: string; error?: string }> = [];

    for (const op of operations) {
      try {
        if (op.type === 'delete') {
          await this.fileSystem.deleteFile(op.filePath);
          results.push({ filePath: op.filePath, success: true });
        } else {
          const result = await this.codeEditor.applyCodeChanges(
            op.filePath,
            op.description,
            op.context,
          );
          results.push({ filePath: op.filePath, ...result });
        }
      } catch (error) {
        results.push({
          filePath: op.filePath,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getProjectStructure(rootPath: string) {
    return this.fileSystem.getDirectoryTree(rootPath);
  }

  async readProjectFiles(filePaths: string[]) {
    const files = await Promise.all(
      filePaths.map(async (filePath) => ({
        path: filePath,
        content: await this.fileSystem.readFile(filePath),
      })),
    );
    return files;
  }
}
