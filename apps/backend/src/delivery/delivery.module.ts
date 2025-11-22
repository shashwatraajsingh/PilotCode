import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { GitHubService } from './github.service';
import { GitService } from './git.service';
import { BrainModule } from '../brain/brain.module';

@Module({
  imports: [BrainModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, GitHubService, GitService],
  exports: [DeliveryService, GitService],
})
export class DeliveryModule {}
