import { Controller, Post, Get, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService, CreateTaskRequest } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth() // SECURITY: Indicate that all routes require auth
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @ApiOperation({ summary: 'Create and execute a new task' })
  @ApiResponse({ status: 201, description: 'Task created and execution started' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTask(@Body() request: CreateTaskRequest) {
    return this.tasksService.createAndExecuteTask(request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllTasks(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // SECURITY: Enforce maximum limit to prevent DoS
    const safeLimit = Math.min(Math.max(1, limit), 100);
    return this.tasksService.getAllTasks(safeLimit);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task details' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTask(
    // SECURITY: Validate UUID format to prevent SQL injection
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.getTaskDetails(taskId);
  }

  @Post(':taskId/deliver')
  @ApiOperation({ summary: 'Deliver task changes via GitHub PR' })
  @ApiResponse({ status: 200, description: 'Task delivered successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deliverTask(
    // SECURITY: Validate UUID format
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.deliverTask(taskId);
  }
}
