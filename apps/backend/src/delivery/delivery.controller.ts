import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('create-pr')
  @ApiOperation({ summary: 'Create pull request for task' })
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
  async getStatus(@Param('taskId') taskId: string) {
    return this.deliveryService.getDeliveryStatus(taskId);
  }

  @Post('respond-to-review')
  @ApiOperation({ summary: 'Respond to code review comments' })
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
