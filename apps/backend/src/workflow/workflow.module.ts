import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowGateway } from './workflow.gateway';
import { StateMachineService } from './state-machine.service';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { BrainModule } from '../brain/brain.module';
import { HandsModule } from '../hands/hands.module';
import { LegsModule } from '../legs/legs.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [BrainModule, HandsModule, LegsModule, WebsocketModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowGateway,
    StateMachineService,
    TaskOrchestratorService,
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
