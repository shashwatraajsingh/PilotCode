import { Injectable, Logger } from '@nestjs/common';
import { FileSystemService } from '../hands/file-system.service';
import { ASTParserService } from '../hands/ast-parser.service';
import * as path from 'path';
import * as fs from 'fs/promises';

interface CodeContext {
  projectStructure: string[];
  dependencies: Record<string, string>;
  frameworks: string[];
  imports: Array<{
    file: string;
    imports: string[];
  }>;
  functions: Array<{
    file: string;
    name: string;
    parameters: string[];
    returnType?: string;
  }>;
  classes: Array<{
    file: string;
    name: string;
    methods: string[];
  }>;
  apis: Array<{
    file: string;
    method: string;
    path: string;
  }>;
  tests: string[];
  configs: string[];
  documentation: string[];
}

@Injectable()
export class ContextGathererService {
  private readonly logger = new Logger(ContextGathererService.name);

  constructor(
    private fileSystem: FileSystemService,
    private astParser: ASTParserService,
  ) {}

  async gatherProjectContext(repoPath: string): Promise<CodeContext> {
    this.logger.log(`Gathering context for project: ${repoPath}`);

    const context: CodeContext = {
      projectStructure: [],
      dependencies: {},
      frameworks: [],
      imports: [],
      functions: [],
      classes: [],
      apis: [],
      tests: [],
      configs: [],
      documentation: [],
    };

    try {
      // 1. Get project structure
      context.projectStructure = await this.getProjectStructure(repoPath);

      // 2. Parse package.json for dependencies
      context.dependencies = await this.parseDependencies(repoPath);

      // 3. Detect frameworks
      context.frameworks = this.detectFrameworks(context.dependencies);

      // 4. Analyze source files
      const sourceFiles = context.projectStructure.filter((file) =>
        /\.(js|ts|jsx|tsx|py|java|go|rb)$/.test(file),
      );

      for (const file of sourceFiles.slice(0, 50)) { // Limit to 50 files for performance
        const fullPath = path.join(repoPath, file);
        try {
          const analysis = await this.analyzeFile(fullPath, file);
          
          if (analysis.imports.length > 0) {
            context.imports.push({ file, imports: analysis.imports });
          }
          
          context.functions.push(...analysis.functions.map(f => ({ ...f, file })));
          context.classes.push(...analysis.classes.map(c => ({ ...c, file })));
          context.apis.push(...analysis.apis.map(a => ({ ...a, file })));
        } catch (error) {
          this.logger.warn(`Failed to analyze file ${file}: ${error.message}`);
        }
      }

      // 5. Find test files
      context.tests = context.projectStructure.filter((file) =>
        /\.(test|spec)\.(js|ts|jsx|tsx|py)$/.test(file),
      );

      // 6. Find config files
      context.configs = context.projectStructure.filter((file) =>
        /\.(json|yaml|yml|toml|ini|conf|config)$/.test(file) ||
        /^(\.env|\.gitignore|Dockerfile|docker-compose)/.test(path.basename(file)),
      );

      // 7. Find documentation
      context.documentation = context.projectStructure.filter((file) =>
        /\.(md|txt|rst)$/.test(file),
      );

      this.logger.log(`Context gathered: ${sourceFiles.length} source files analyzed`);

      return context;
    } catch (error) {
      this.logger.error(`Failed to gather context: ${error.message}`);
      throw error;
    }
  }

  private async getProjectStructure(repoPath: string): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv', '.next'];

    const scan = async (dir: string, relative: string = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const relativePath = path.join(relative, entry.name);

          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
              await scan(path.join(dir, entry.name), relativePath);
            }
          } else {
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scan(repoPath);
    return files;
  }

  private async parseDependencies(repoPath: string): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {};

    // Try package.json (Node.js)
    try {
      const packageJson = await fs.readFile(
        path.join(repoPath, 'package.json'),
        'utf-8',
      );
      const parsed = JSON.parse(packageJson);
      Object.assign(dependencies, parsed.dependencies || {});
      Object.assign(dependencies, parsed.devDependencies || {});
    } catch {}

    // Try requirements.txt (Python)
    try {
      const requirements = await fs.readFile(
        path.join(repoPath, 'requirements.txt'),
        'utf-8',
      );
      requirements.split('\n').forEach((line) => {
        const match = line.match(/^([^=<>~!]+)/);
        if (match) {
          dependencies[match[1].trim()] = 'latest';
        }
      });
    } catch {}

    // Try go.mod (Go)
    try {
      const goMod = await fs.readFile(path.join(repoPath, 'go.mod'), 'utf-8');
      const matches = goMod.matchAll(/require\s+([^\s]+)\s+([^\s]+)/g);
      for (const match of matches) {
        dependencies[match[1]] = match[2];
      }
    } catch {}

    return dependencies;
  }

  private detectFrameworks(dependencies: Record<string, string>): string[] {
    const frameworks: string[] = [];

    const frameworkMap = {
      react: 'React',
      vue: 'Vue.js',
      angular: 'Angular',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js',
      express: 'Express',
      nestjs: 'NestJS',
      fastapi: 'FastAPI',
      django: 'Django',
      flask: 'Flask',
      'spring-boot': 'Spring Boot',
      rails: 'Ruby on Rails',
    };

    for (const [dep, framework] of Object.entries(frameworkMap)) {
      if (dependencies[dep] || dependencies[`@${dep}/core`]) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  private async analyzeFile(fullPath: string, relativePath: string): Promise<{
    imports: string[];
    functions: Array<{ name: string; parameters: string[]; returnType?: string }>;
    classes: Array<{ name: string; methods: string[] }>;
    apis: Array<{ method: string; path: string }>;
  }> {
    const content = await fs.readFile(fullPath, 'utf-8');
    const ext = path.extname(fullPath);

    const result: {
      imports: string[];
      functions: Array<{ name: string; parameters: string[]; returnType?: string }>;
      classes: Array<{ name: string; methods: string[] }>;
      apis: Array<{ method: string; path: string }>;
    } = {
      imports: [],
      functions: [],
      classes: [],
      apis: [],
    };

    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      result.imports = this.extractImports(content);
      result.functions = this.extractFunctions(content);
      result.classes = this.extractClasses(content);
      result.apis = this.extractAPIRoutes(content);
    } else if (ext === '.py') {
      result.imports = this.extractPythonImports(content);
      result.functions = this.extractPythonFunctions(content);
      result.classes = this.extractPythonClasses(content);
    }

    return result;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractFunctions(content: string): Array<{ name: string; parameters: string[] }> {
    const functions: Array<{ name: string; parameters: string[] }> = [];
    const functionRegex = /(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*=?\s*(?:async\s*)?\([^)]*\)/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        parameters: [], // Simplified - could parse parameters
      });
    }

    return functions;
  }

  private extractClasses(content: string): Array<{ name: string; methods: string[] }> {
    const classes: Array<{ name: string; methods: string[] }> = [];
    const classRegex = /class\s+(\w+)/g;

    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        methods: [], // Simplified - could parse methods
      });
    }

    return classes;
  }

  private extractAPIRoutes(content: string): Array<{ method: string; path: string }> {
    const routes: Array<{ method: string; path: string }> = [];
    const routeRegex = /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]+)['"]\)/g;
    const expressRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;

    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push({ method: match[1].toUpperCase(), path: match[2] });
    }
    while ((match = expressRegex.exec(content)) !== null) {
      routes.push({ method: match[1].toUpperCase(), path: match[2] });
    }

    return routes;
  }

  private extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
      imports.push(...match[2].split(',').map(i => i.trim()));
    }

    return imports;
  }

  private extractPythonFunctions(content: string): Array<{ name: string; parameters: string[] }> {
    const functions: Array<{ name: string; parameters: string[] }> = [];
    const functionRegex = /def\s+(\w+)\s*\([^)]*\)/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        parameters: [],
      });
    }

    return functions;
  }

  private extractPythonClasses(content: string): Array<{ name: string; methods: string[] }> {
    const classes: Array<{ name: string; methods: string[] }> = [];
    const classRegex = /class\s+(\w+)/g;

    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        methods: [],
      });
    }

    return classes;
  }

  // Generate a context summary for the AI
  generateContextSummary(context: CodeContext): string {
    const summary: string[] = [];

    summary.push('# Project Context\n');

    if (context.frameworks.length > 0) {
      summary.push(`## Frameworks: ${context.frameworks.join(', ')}\n`);
    }

    summary.push(`## Project Structure`);
    summary.push(`- Total files: ${context.projectStructure.length}`);
    summary.push(`- Test files: ${context.tests.length}`);
    summary.push(`- Config files: ${context.configs.length}`);
    summary.push(`- Documentation: ${context.documentation.length}\n`);

    if (Object.keys(context.dependencies).length > 0) {
      summary.push(`## Key Dependencies`);
      const topDeps = Object.entries(context.dependencies).slice(0, 10);
      topDeps.forEach(([name, version]) => {
        summary.push(`- ${name}: ${version}`);
      });
      summary.push('');
    }

    if (context.functions.length > 0) {
      summary.push(`## Functions (${context.functions.length} total)`);
      context.functions.slice(0, 10).forEach(func => {
        summary.push(`- ${func.name} in ${func.file}`);
      });
      summary.push('');
    }

    if (context.classes.length > 0) {
      summary.push(`## Classes (${context.classes.length} total)`);
      context.classes.slice(0, 10).forEach(cls => {
        summary.push(`- ${cls.name} in ${cls.file}`);
      });
      summary.push('');
    }

    if (context.apis.length > 0) {
      summary.push(`## API Routes (${context.apis.length} total)`);
      context.apis.slice(0, 10).forEach(api => {
        summary.push(`- ${api.method} ${api.path} in ${api.file}`);
      });
    }

    return summary.join('\n');
  }
}
