import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BrainService } from './brain.service';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('brain')
@Controller('brain')
export class BrainController {
  constructor(private readonly brainService: BrainService) {}

  @Post('plan')
  @ApiOperation({ summary: 'Create execution plan from natural language task' })
  async createPlan(@Body() createTaskDto: CreateTaskDto) {
    return this.brainService.planTask(createTaskDto);
  }

  @Get('plan/:taskId')
  @ApiOperation({ summary: 'Get execution plan for a task' })
  async getPlan(@Param('taskId') taskId: string) {
    return this.brainService.getExecutionPlan(taskId);
  }
}
