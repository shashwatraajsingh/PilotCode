import { Module, forwardRef } from '@nestjs/common';
import { BrainService } from './brain.service';
import { BrainController } from './brain.controller';
import { AIProviderService } from './ai-provider.service';
import { ContextGathererService } from './context-gatherer.service';
import { HandsModule } from '../hands/hands.module';

@Module({
  imports: [forwardRef(() => HandsModule)],
  controllers: [BrainController],
  providers: [BrainService, AIProviderService, ContextGathererService],
  exports: [BrainService, AIProviderService, ContextGathererService],
})
export class BrainModule {}
