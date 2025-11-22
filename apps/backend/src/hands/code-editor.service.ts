import { Injectable } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { ASTParserService } from './ast-parser.service';
import { AIProviderService } from '../brain/ai-provider.service';
import * as path from 'path';

export interface CodeEdit {
  filePath: string;
  operation: 'create' | 'update' | 'delete';
  description: string;
}

@Injectable()
export class CodeEditorService {
  constructor(
    private fileSystem: FileSystemService,
    private astParser: ASTParserService,
    private aiProvider: AIProviderService,
  ) {}

  async applyCodeChanges(
    filePath: string,
    changeDescription: string,
    context?: string,
  ): Promise<{ success: boolean; newContent?: string; error?: string }> {
    try {
      const exists = await this.fileSystem.fileExists(filePath);
      const language = this.detectLanguage(filePath);

      if (!exists) {
        // Create new file with AI-generated content
        const content = await this.generateFileContent(
          filePath,
          changeDescription,
          language,
        );
        await this.fileSystem.createFile(filePath, content);
        return { success: true, newContent: content };
      }

      // Update existing file
      const originalContent = await this.fileSystem.readFile(filePath);
      const newContent = await this.modifyFileContent(
        originalContent,
        changeDescription,
        language,
        context,
      );

      await this.fileSystem.updateFile(filePath, newContent);
      return { success: true, newContent };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async generateFileContent(
    filePath: string,
    description: string,
    language: string,
  ): Promise<string> {
    const fileName = path.basename(filePath);
    const systemPrompt = `You are an expert ${language} developer. Generate clean, production-ready code following best practices.

Rules:
- Write clean, readable, well-documented code
- Follow ${language} conventions and style guides
- Include proper imports and exports
- Add TypeScript types where applicable
- Include error handling
- Add JSDoc comments for public APIs
- Follow SOLID principles`;

    const userPrompt = `Create a new file: ${fileName}

Requirements:
${description}

Generate only the code content, no explanations.`;

    const content = await this.aiProvider.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Clean up markdown code blocks if AI returns them
    return this.cleanCodeResponse(content, language);
  }

  private async modifyFileContent(
    originalContent: string,
    changeDescription: string,
    language: string,
    context?: string,
  ): Promise<string> {
    // Try AST-based modification for supported languages
    if (language === 'typescript' || language === 'javascript') {
      try {
        return await this.astBasedModification(
          originalContent,
          changeDescription,
          language,
        );
      } catch (error) {
        console.warn('AST modification failed, falling back to AI:', error.message);
      }
    }

    // Fall back to AI-based modification
    return await this.aiBasedModification(
      originalContent,
      changeDescription,
      language,
      context,
    );
  }

  private async astBasedModification(
    content: string,
    description: string,
    language: 'typescript' | 'javascript',
  ): Promise<string> {
    const ast = language === 'typescript'
      ? this.astParser.parseTypeScript(content)
      : this.astParser.parseJavaScript(content);

    // Use AI to determine what AST modifications to make
    const systemPrompt = `You are a code analysis expert. Analyze the code change request and determine the specific AST operations needed.

Available operations:
- addImport(path, imports[])
- addFunction(name, params[], body)
- modifyFunction(name, newBody)
- addClassMethod(className, methodName, params[], body)
- removeImport(path)

Return a JSON array of operations to perform.`;

    const userPrompt = `Current code structure:
${JSON.stringify(this.astParser.getCodeStructure(content, language), null, 2)}

Change requested:
${description}

What AST operations should be performed? Return as JSON array.`;

    const operations = await this.aiProvider.generateStructuredOutput<any[]>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'array',
    );

    // Apply AST operations
    let modifiedAst = ast;
    for (const op of operations) {
      switch (op.type) {
        case 'addImport':
          modifiedAst = this.astParser.addImport(modifiedAst, op.path, op.imports);
          break;
        case 'addFunction':
          modifiedAst = this.astParser.addFunction(
            modifiedAst,
            op.name,
            op.params,
            op.body,
          );
          break;
        case 'modifyFunction':
          modifiedAst = this.astParser.modifyFunction(modifiedAst, op.name, op.body);
          break;
        case 'addClassMethod':
          modifiedAst = this.astParser.addClassMethod(
            modifiedAst,
            op.className,
            op.methodName,
            op.params,
            op.body,
          );
          break;
        case 'removeImport':
          modifiedAst = this.astParser.removeImport(modifiedAst, op.path);
          break;
      }
    }

    return this.astParser.generateCode(modifiedAst);
  }

  private async aiBasedModification(
    originalContent: string,
    changeDescription: string,
    language: string,
    context?: string,
  ): Promise<string> {
    const systemPrompt = `You are an expert code editor. Your job is to modify existing code based on change requests.

Rules:
- Preserve existing code style and formatting
- Only modify what's necessary
- Maintain backward compatibility where possible
- Keep imports and dependencies updated
- Follow ${language} best practices
- Preserve comments unless they're outdated`;

    const userPrompt = `Current code:
\`\`\`${language}
${originalContent}
\`\`\`

Change request:
${changeDescription}

${context ? `Additional context:\n${context}` : ''}

Return the complete modified code. Only output the code, no explanations.`;

    const newContent = await this.aiProvider.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return this.cleanCodeResponse(newContent, language);
  }

  private cleanCodeResponse(response: string, language: string): string {
    // Remove markdown code blocks
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'g');
    const match = codeBlockRegex.exec(response);
    
    if (match) {
      return match[1].trim();
    }

    // Remove generic code blocks
    const genericBlockRegex = /```\s*\n([\s\S]*?)\n```/g;
    const genericMatch = genericBlockRegex.exec(response);
    
    if (genericMatch) {
      return genericMatch[1].trim();
    }

    return response.trim();
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };

    return languageMap[ext] || 'plaintext';
  }
}
