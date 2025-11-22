import { Module } from '@nestjs/common';
import { LegsService } from './legs.service';
import { DockerSandboxService } from './docker-sandbox.service';
import { CommandExecutorService } from './command-executor.service';
import { DebugLoopService } from './debug-loop.service';
import { TestRunnerService } from './test-runner.service';
import { BrainModule } from '../brain/brain.module';
import { HandsModule } from '../hands/hands.module';

@Module({
  imports: [BrainModule, HandsModule],
  providers: [
    LegsService,
    DockerSandboxService,
    CommandExecutorService,
    DebugLoopService,
    TestRunnerService,
  ],
  exports: [LegsService, TestRunnerService],
})
export class LegsModule {}
