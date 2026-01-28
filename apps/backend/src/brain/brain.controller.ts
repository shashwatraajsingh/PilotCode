import { Controller, Post, Body, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BrainService } from './brain.service';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('brain')
@Controller('brain')
@ApiBearerAuth()
export class BrainController {
  constructor(private readonly brainService: BrainService) { }

  @Post('plan')
  @ApiOperation({ summary: 'Create execution plan from natural language task' })
  @ApiResponse({ status: 201, description: 'Execution plan created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPlan(@Body() createTaskDto: CreateTaskDto) {
    return this.brainService.planTask(createTaskDto);
  }

  @Get('plan/:taskId')
  @ApiOperation({ summary: 'Get execution plan for a task' })
  @ApiResponse({ status: 200, description: 'Execution plan returned' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPlan(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.brainService.getExecutionPlan(taskId);
  }
}

