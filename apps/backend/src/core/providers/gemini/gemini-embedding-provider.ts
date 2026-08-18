import { GoogleGenAI } from '@google/genai';
import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { EmbeddingProvider } from '../interfaces/embedding-provider.js';

/**
 * Utilitário para retentativa exponencial em erros transitórios (ex: 429 RESOURCE_EXHAUSTED ou 503).
 * Não realiza retentativas em erros definitivos (400, 401, 403).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelayMs: number = 2000
): Promise<T> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const message = error?.message || String(error);
      const isTransient =
        status === 429 ||
        status === 503 ||
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('Quota exceeded') ||
        message.includes('503');

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      console.warn(`[EMBEDDING] Erro transitório (429/503). Tentativa ${attempt}/${maxRetries}. Aguardando ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('[GeminiEmbeddingProvider] Máximo de tentativas excedido.');
}

export class GeminiLangChainEmbeddings extends Embeddings {
  readonly modelName: string;
  readonly dimension: number;
  private ai: GoogleGenAI;

  constructor(fields?: EmbeddingsParams & { apiKey?: string; modelName?: string; dimension?: number }) {
    super(fields ?? {});
    const apiKey = fields?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[GeminiEmbeddingProvider] A variável de ambiente GEMINI_API_KEY não está definida.');
    }
    this.modelName = fields?.modelName || process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    this.dimension = fields?.dimension || (process.env.GEMINI_EMBEDDING_DIMENSION ? parseInt(process.env.GEMINI_EMBEDDING_DIMENSION, 10) : 768);
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    if (documents.length === 0) return [];

    const batchSize = process.env.GEMINI_EMBEDDING_BATCH_SIZE
      ? parseInt(process.env.GEMINI_EMBEDDING_BATCH_SIZE, 10)
      : 15;

    const totalBatches = Math.ceil(documents.length / batchSize);
    console.log(`[INDEXING] Gemini embeddings | Model: ${this.modelName} | Dimension: ${this.dimension} | Documents: ${documents.length} | Batch size: ${batchSize}`);

    const results: number[][] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batchIndex = Math.floor(i / batchSize) + 1;
      const batch = documents.slice(i, i + batchSize);

      console.log(`[EMBEDDING] Processando lote ${batchIndex}/${totalBatches} (${batch.length} documentos)...`);

      const batchVectors = await retryWithBackoff(async () => {
        try {
          const response = await this.ai.models.embedContent({
            model: this.modelName,
            contents: batch as any,
            config: {
              outputDimensionality: this.dimension,
            },
          });
          if (response.embeddings && response.embeddings.length === batch.length) {
            return response.embeddings.map((e) => {
              if (!e.values || e.values.length !== this.dimension) {
                throw new Error(`[GeminiEmbeddingProvider] Vetor retornado tem dimensão diferente de ${this.dimension}`);
              }
              return e.values;
            });
          }
        } catch (batchErr: any) {
          const status = batchErr?.status || batchErr?.statusCode;
          const message = batchErr?.message || String(batchErr);
          const isTransient = status === 429 || status === 503 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('503');
          if (isTransient) {
            throw batchErr;
          }
        }

        const itemVectors: number[][] = [];
        for (let idx = 0; idx < batch.length; idx++) {
          const doc = batch[idx]!;
          const response = await this.ai.models.embedContent({
            model: this.modelName,
            contents: doc,
            config: {
              outputDimensionality: this.dimension,
            },
          });
          const vector = response.embeddings?.[0]?.values || (response as any).embedding?.values;
          if (!vector || vector.length !== this.dimension) {
            throw new Error(`[GeminiLangChainEmbeddings] Não foi possível gerar embedding de dimensão ${this.dimension}`);
          }
          itemVectors.push(vector);

          if (idx + 1 < batch.length) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
        return itemVectors;
      });

      results.push(...batchVectors);

      if (i + batchSize < documents.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`[EMBEDDING] Concluído ${results.length}/${documents.length} documentos.`);
    return results;
  }

  async embedQuery(document: string): Promise<number[]> {
    return await retryWithBackoff(async () => {
      const response = await this.ai.models.embedContent({
        model: this.modelName,
        contents: document,
        config: {
          outputDimensionality: this.dimension,
        },
      });
      const vector = response.embeddings?.[0]?.values || (response as any).embedding?.values;
      if (!vector || vector.length !== this.dimension) {
        throw new Error(`[GeminiLangChainEmbeddings] Não foi possível gerar embedding de dimensão ${this.dimension} para a consulta.`);
      }
      return vector;
    });
  }
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'gemini';
  readonly modelName: string;
  readonly dimension: number;
  private embeddings: GeminiLangChainEmbeddings;

  constructor(apiKey?: string, modelName?: string, dimension?: number) {
    this.modelName = modelName || process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    this.dimension = dimension || (process.env.GEMINI_EMBEDDING_DIMENSION ? parseInt(process.env.GEMINI_EMBEDDING_DIMENSION, 10) : 768);
    this.embeddings = new GeminiLangChainEmbeddings({ apiKey, modelName: this.modelName, dimension: this.dimension });
  }

  getLangChainEmbeddings(): Embeddings {
    return this.embeddings;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(documents);
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.embeddings.embedQuery(query);
  }
}
