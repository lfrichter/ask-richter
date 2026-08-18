import { callOllamaAPI } from '../../ollama.js';
import { LLMProvider } from '../interfaces/llm-provider.js';

export class OllamaLLMProvider implements LLMProvider {
  readonly name = 'ollama';
  private model: string;

  constructor(model?: string) {
    this.model = model || process.env.OLLAMA_MODEL || 'mistral:7b';
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    return await callOllamaAPI(this.model, systemPrompt, userMessage);
  }
}
