import { callHuggingFaceAPI } from '../../huggingface.js';
import { LLMProvider } from '../interfaces/llm-provider.js';

export class HuggingFaceLLMProvider implements LLMProvider {
  readonly name = 'huggingface';
  private model: string;

  constructor(model?: string) {
    this.model = model || process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct:novita';
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    return await callHuggingFaceAPI(this.model, fullPrompt);
  }
}
