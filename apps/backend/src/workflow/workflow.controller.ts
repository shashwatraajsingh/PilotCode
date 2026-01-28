import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';

@ApiTags('workflow')
@Controller('workflow')
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) { }

  @Post('execute')
  @ApiOperation({ summary: 'Execute a task workflow' })
  @ApiResponse({ status: 200, description: 'Workflow started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async executeWorkflow(@Body() body: { taskId: string; repoPath: string }) {
    return this.workflowService.startWorkflow(body.taskId, body.repoPath);
  }

  @Get('status/:taskId')
  @ApiOperation({ summary: 'Get workflow status' })
  @ApiResponse({ status: 200, description: 'Workflow status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.workflowService.getWorkflowStatus(taskId);
  }

  @Post('retry/:taskId')
  @ApiOperation({ summary: 'Retry failed workflow' })
  @ApiResponse({ status: 200, description: 'Workflow retried' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async retryWorkflow(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.workflowService.retryWorkflow(taskId);
  }
}

