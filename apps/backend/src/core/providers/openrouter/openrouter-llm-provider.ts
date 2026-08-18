import { callOpenRouterAPI } from '../../openrouter.js';
import { LLMProvider } from '../interfaces/llm-provider.js';

export class OpenRouterLLMProvider implements LLMProvider {
  readonly name = 'openrouter';
  private model: string;

  constructor(model?: string) {
    this.model = model || process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    return await callOpenRouterAPI(this.model, systemPrompt, userMessage);
  }
}
