import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AIProviderService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private provider: 'openai' | 'anthropic';

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.provider = 'openai';
    } else if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey }) as any;
      this.provider = 'anthropic';
    } else {
      throw new Error('No AI provider API key configured');
    }
  }

  async generateCompletion(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
      openaiApiKey?: string;
      anthropicApiKey?: string;
    },
  ): Promise<string> {
    const temperature = options?.temperature ?? 0.2;
    const maxTokens = options?.maxTokens ?? 4096;

    // Use user-provided key or fallback to configured key
    const openaiKey = options?.openaiApiKey || this.configService.get('OPENAI_API_KEY');
    const anthropicKey = options?.anthropicApiKey || this.configService.get('ANTHROPIC_API_KEY');

    // Determine which provider to use
    const useOpenAI = openaiKey && (this.provider === 'openai' || !anthropicKey);

    if (useOpenAI) {
      const client = options?.openaiApiKey 
        ? new OpenAI({ apiKey: options.openaiApiKey })
        : this.openai;

      const response = await client.chat.completions.create({
        model: this.configService.get('AI_MODEL') || 'gpt-4-turbo-preview',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: maxTokens,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      });

      return response.choices[0]?.message?.content || '';
    } else if (anthropicKey) {
      const client: any = options?.anthropicApiKey
        ? new Anthropic({ apiKey: options.anthropicApiKey })
        : this.anthropic;

      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const response = await client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        })),
      });

      const firstContent = response.content[0];
      return firstContent && 'text' in firstContent ? firstContent.text : '';
    } else {
      throw new Error('No AI provider API key available. Please provide an API key.');
    }
  }

  async generateStructuredOutput<T>(
    messages: AIMessage[],
    schema: string,
  ): Promise<T> {
    const response = await this.generateCompletion(messages, { jsonMode: true });
    try {
      return JSON.parse(response) as T;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
}
