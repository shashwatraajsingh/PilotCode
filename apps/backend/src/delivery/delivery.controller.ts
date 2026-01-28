import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';

@ApiTags('delivery')
@Controller('delivery')
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  @Post('create-pr')
  @ApiOperation({ summary: 'Create pull request for task' })
  @ApiResponse({ status: 201, description: 'Pull request created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPR(
    @Body()
    body: {
      taskId: string;
      repoPath: string;
      repoUrl: string;
      baseBranch: string;
      taskDescription: string;
    },
  ) {
    return this.deliveryService.deliverChanges(body);
  }

  @Get('status/:taskId')
  @ApiOperation({ summary: 'Get delivery status for task' })
  @ApiResponse({ status: 200, description: 'Delivery status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.deliveryService.getDeliveryStatus(taskId);
  }

  @Post('respond-to-review')
  @ApiOperation({ summary: 'Respond to code review comments' })
  @ApiResponse({ status: 200, description: 'Response posted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async respondToReview(
    @Body() body: { taskId: string; reviewComments: string[] },
  ) {
    await this.deliveryService.respondToCodeReview(
      body.taskId,
      body.reviewComments,
    );
    return { message: 'Responses posted successfully' };
  }
}

