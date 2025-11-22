import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Add JWT authentication to the Express.js API' })
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  repoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  repoPath?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetBranch?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiProperty({ required: false, description: 'User-provided OpenAI API key' })
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @ApiProperty({ required: false, description: 'User-provided Anthropic API key' })
  @IsOptional()
  @IsString()
  anthropicApiKey?: string;

  @ApiProperty({ required: false, description: 'User-provided GitHub token' })
  @IsOptional()
  @IsString()
  githubToken?: string;
}
