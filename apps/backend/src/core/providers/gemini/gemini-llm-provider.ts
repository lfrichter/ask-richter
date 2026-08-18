import { GoogleGenAI } from '@google/genai';
import { LLMProvider } from '../interfaces/llm-provider.js';

export class GeminiLLMProvider implements LLMProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model?: string, aiClient?: any) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key && !aiClient) {
      throw new Error('[GeminiLLMProvider] A variável de ambiente GEMINI_API_KEY não está definida.');
    }
    this.ai = aiClient || new GoogleGenAI({ apiKey: key || 'dummy' });
    this.model = model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    const maxRetries = 3;
    const isTest = process.env.NODE_ENV === 'test';
    const defaultDelays = isTest ? [10, 20, 30] : [2000, 4000, 8000];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            topP: 0.3,
          },
        });

        return response.text || 'Gemini não retornou uma resposta válida.';
      } catch (error: any) {
        const status = error?.status || error?.statusCode;
        const message = error?.message || String(error);

        const is429 = status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded');
        const is502 = status === 502 || message.includes('502');
        const is503 = status === 503 || message.includes('503') || message.includes('UNAVAILABLE') || message.includes('high demand');
        const is504 = status === 504 || message.includes('504');
        const isNetwork = message.includes('ECONNRESET') || message.includes('ETIMEDOUT') || message.includes('fetch failed');

        const isTransient = is429 || is502 || is503 || is504 || isNetwork;

        if (!isTransient || attempt === maxRetries) {
          if (isTransient && attempt === maxRetries) {
            console.warn('[AI] Gemini unavailable after retries.');
          }
          const errStatus = status || (isTransient ? 503 : 500);
          const err = new Error(`Erro na API do Gemini: ${message}`);
          (err as any).status = errStatus;
          (err as any).code = isTransient ? 'UPSTREAM_TEMPORARILY_UNAVAILABLE' : 'GEMINI_API_ERROR';
          throw err;
        }

        let delay = defaultDelays[attempt - 1] || (isTest ? 10 : 8000);
        if (!isTest && error?.retryDelay && typeof error.retryDelay === 'number') {
          delay = error.retryDelay;
        }

        console.warn(`[AI] Gemini attempt ${attempt}/${maxRetries} failed with ${status || 503}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const err = new Error('[GeminiLLMProvider] Retentativas esgotadas.');
    (err as any).status = 503;
    throw err;
  }
}
