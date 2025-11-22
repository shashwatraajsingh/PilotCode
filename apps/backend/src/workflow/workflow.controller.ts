import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';

@ApiTags('workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Execute a task workflow' })
  async executeWorkflow(@Body() body: { taskId: string; repoPath: string }) {
    return this.workflowService.startWorkflow(body.taskId, body.repoPath);
  }

  @Get('status/:taskId')
  @ApiOperation({ summary: 'Get workflow status' })
  async getStatus(@Param('taskId') taskId: string) {
    return this.workflowService.getWorkflowStatus(taskId);
  }

  @Post('retry/:taskId')
  @ApiOperation({ summary: 'Retry failed workflow' })
  async retryWorkflow(@Param('taskId') taskId: string) {
    return this.workflowService.retryWorkflow(taskId);
  }
}
