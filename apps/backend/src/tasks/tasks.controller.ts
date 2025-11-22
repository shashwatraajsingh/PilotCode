import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService, CreateTaskRequest } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create and execute a new task' })
  @ApiResponse({ status: 201, description: 'Task created and execution started' })
  async createTask(@Body() request: CreateTaskRequest) {
    return this.tasksService.createAndExecuteTask(request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  async getAllTasks(@Query('limit') limit?: string) {
    return this.tasksService.getAllTasks(limit ? parseInt(limit) : 20);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task details' })
  async getTask(@Param('taskId') taskId: string) {
    return this.tasksService.getTaskDetails(taskId);
  }

  @Post(':taskId/deliver')
  @ApiOperation({ summary: 'Deliver task changes via GitHub PR' })
  async deliverTask(@Param('taskId') taskId: string) {
    return this.tasksService.deliverTask(taskId);
  }
}
