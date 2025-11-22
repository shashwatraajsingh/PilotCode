import { Injectable } from '@nestjs/common';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export interface CodeLocation {
  type: string;
  name: string;
  start: number;
  end: number;
}

@Injectable()
export class ASTParserService {
  parseTypeScript(code: string): any {
    try {
      return parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
      });
    } catch (error) {
      throw new Error(`Failed to parse TypeScript: ${error.message}`);
    }
  }

  parseJavaScript(code: string): any {
    try {
      return parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
      });
    } catch (error) {
      throw new Error(`Failed to parse JavaScript: ${error.message}`);
    }
  }

  generateCode(ast: any): string {
    const output = generate(ast, {
      retainLines: false,
      compact: false,
    });
    return output.code;
  }

  findFunctions(ast: any): CodeLocation[] {
    const functions: CodeLocation[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          type: 'function',
          name: path.node.id?.name || 'anonymous',
          start: path.node.start ?? 0,
          end: path.node.end ?? 0,
        });
      },
      ArrowFunctionExpression(path) {
        const parent = path.parent;
        let name = 'anonymous';
        
        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
          name = parent.id.name;
        }

        functions.push({
          type: 'arrow-function',
          name,
          start: path.node.start ?? 0,
          end: path.node.end ?? 0,
        });
      },
    });

    return functions;
  }

  findClasses(ast: any): CodeLocation[] {
    const classes: CodeLocation[] = [];

    traverse(ast, {
      ClassDeclaration(path) {
        classes.push({
          type: 'class',
          name: path.node.id?.name || 'anonymous',
          start: path.node.start ?? 0,
          end: path.node.end ?? 0,
        });
      },
    });

    return classes;
  }

  findImports(ast: any): string[] {
    const imports: string[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      },
    });

    return imports;
  }

  addImport(ast: any, importPath: string, imports: string[]): any {
    const importDeclaration = t.importDeclaration(
      imports.map((imp) =>
        t.importSpecifier(t.identifier(imp), t.identifier(imp)),
      ),
      t.stringLiteral(importPath),
    );

    ast.program.body.unshift(importDeclaration);
    return ast;
  }

  addFunction(
    ast: any,
    functionName: string,
    params: string[],
    body: string,
  ): any {
    // Parse the function body
    const bodyAst = this.parseJavaScript(`function temp() { ${body} }`);
    
    traverse(bodyAst, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === 'temp') {
          const newFunction = t.functionDeclaration(
            t.identifier(functionName),
            params.map((p) => t.identifier(p)),
            path.node.body,
          );
          
          ast.program.body.push(newFunction);
          path.stop();
        }
      },
    });

    return ast;
  }

  modifyFunction(
    ast: any,
    functionName: string,
    newBody: string,
  ): any {
    const bodyAst = this.parseJavaScript(`function temp() { ${newBody} }`);
    let newFunctionBody;

    traverse(bodyAst, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === 'temp') {
          newFunctionBody = path.node.body;
          path.stop();
        }
      },
    });

    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === functionName) {
          path.node.body = newFunctionBody;
          path.stop();
        }
      },
    });

    return ast;
  }

  addClassMethod(
    ast: any,
    className: string,
    methodName: string,
    params: string[],
    body: string,
  ): any {
    const bodyAst = this.parseJavaScript(`function temp() { ${body} }`);
    let methodBody;

    traverse(bodyAst, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === 'temp') {
          methodBody = path.node.body;
          path.stop();
        }
      },
    });

    traverse(ast, {
      ClassDeclaration(path) {
        if (path.node.id?.name === className) {
          const method = t.classMethod(
            'method',
            t.identifier(methodName),
            params.map((p) => t.identifier(p)),
            methodBody,
          );

          path.node.body.body.push(method);
          path.stop();
        }
      },
    });

    return ast;
  }

  removeImport(ast: any, importPath: string): any {
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === importPath) {
          path.remove();
        }
      },
    });

    return ast;
  }

  getCodeStructure(code: string, language: 'typescript' | 'javascript'): any {
    const ast = language === 'typescript' 
      ? this.parseTypeScript(code) 
      : this.parseJavaScript(code);

    return {
      functions: this.findFunctions(ast),
      classes: this.findClasses(ast),
      imports: this.findImports(ast),
    };
  }
}
