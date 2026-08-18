import { Embeddings } from '@langchain/core/embeddings';

export interface EmbeddingProvider {
  readonly name: string;
  readonly modelName: string;
  readonly dimension: number;
  getLangChainEmbeddings(): Embeddings;
  embedDocuments(documents: string[]): Promise<number[][]>;
  embedQuery(query: string): Promise<number[]>;
}
