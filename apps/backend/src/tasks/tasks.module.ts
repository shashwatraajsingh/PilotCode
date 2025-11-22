import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { BrainModule } from '../brain/brain.module';
import { HandsModule } from '../hands/hands.module';
import { LegsModule } from '../legs/legs.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    BrainModule,
    HandsModule,
    LegsModule,
    WorkflowModule,
    DeliveryModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
