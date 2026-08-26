import { GoogleGenAI } from '@google/genai';

export interface LLMProvider {
  name: string;
  generate(systemPrompt: string, userMessage: string): Promise<string>;
}

export class GeminiLLMProvider implements LLMProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('[GeminiLLMProvider] A variável GEMINI_API_KEY não está definida.');
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    const maxRetries = 3;
    const defaultDelays = [1500, 3000, 6000];

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
        const isTransient = is429 || status === 502 || status === 503 || message.includes('503') || message.includes('UNAVAILABLE');

        if (!isTransient || attempt === maxRetries) {
          const err = new Error(`Erro na API do Gemini: ${message}`);
          (err as any).status = status || (isTransient ? 503 : 500);
          throw err;
        }

        const delay = defaultDelays[attempt - 1] || 3000;
        console.warn(`[GeminiLLM] Tentativa ${attempt}/${maxRetries} falhou (${status || 503}). Tentando novamente em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('[GeminiLLMProvider] Retentativas esgotadas.');
  }
}

export class GeminiEmbeddingService {
  private ai: GoogleGenAI;
  private modelName: string;
  private dimension: number;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('[GeminiEmbeddingService] GEMINI_API_KEY ausente.');
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    this.modelName = process.env.EMBEDDING_MODEL || 'gemini-embedding-2';
    this.dimension = parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: this.modelName,
      contents: text,
      config: {
        outputDimensionality: this.dimension,
      },
    });

    const vector = response.embeddings?.[0]?.values || (response as any).embedding?.values;
    if (!vector || vector.length !== this.dimension) {
      throw new Error(`[GeminiEmbeddingService] Falha ao gerar embedding de dimensão ${this.dimension}`);
    }
    return vector;
  }
}
