import { Module, forwardRef } from '@nestjs/common';
import { HandsService } from './hands.service';
import { FileSystemService } from './file-system.service';
import { CodeEditorService } from './code-editor.service';
import { ASTParserService } from './ast-parser.service';
import { CodeQualityService } from './code-quality.service';
import { BrainModule } from '../brain/brain.module';

@Module({
  imports: [forwardRef(() => BrainModule)],
  providers: [HandsService, FileSystemService, CodeEditorService, ASTParserService, CodeQualityService],
  exports: [HandsService, CodeQualityService, FileSystemService, ASTParserService],
})
export class HandsModule {}
