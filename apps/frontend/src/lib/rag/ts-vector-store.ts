import path from 'path';
import fs from 'fs';

export interface DocumentMetadata {
  source?: string;
  section_header?: string;
  project_name?: string | null;
  technologies?: string[];
  [key: string]: any;
}

export interface Document {
  id?: string;
  pageContent: string;
  metadata: DocumentMetadata;
}

export class TSVectorStore {
  private docsMap: Map<string, Document> = new Map();
  private vectorsMap: Map<string, number[]> = new Map();
  private isInitialized = false;

  constructor() {}

  /**
   * Calcula a similaridade de cosseno entre dois vetores de mesma dimensão.
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i]!;
      const b = vecB[i]!;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Inicializa o Vector Store em TS carregando o docstore e os vetores.
   */
  public async initialize(customDocstorePath?: string, customVectorsPath?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Determina caminhos dos arquivos JSON
      const baseDirs = [
        path.join(process.cwd(), 'apps/backend/src/faiss_index'),
        path.join(process.cwd(), 'src/faiss_index'),
        path.join(process.cwd(), 'faiss_index'),
        path.join(process.cwd(), 'apps/frontend/src/faiss_index')
      ];

      let docstoreFile = customDocstorePath;
      let vectorsFile = customVectorsPath;

      if (!docstoreFile) {
        for (const dir of baseDirs) {
          const candidate = path.join(dir, 'docstore.json');
          if (fs.existsSync(candidate)) {
            docstoreFile = candidate;
            break;
          }
        }
      }

      if (!vectorsFile) {
        for (const dir of baseDirs) {
          const candidate = path.join(dir, 'vectors.json');
          if (fs.existsSync(candidate)) {
            vectorsFile = candidate;
            break;
          }
        }
      }

      if (docstoreFile && fs.existsSync(docstoreFile)) {
        const rawContent = fs.readFileSync(docstoreFile, 'utf-8');
        const rawDocstore = JSON.parse(rawContent);
        const items = (Array.isArray(rawDocstore[0]) && Array.isArray(rawDocstore[0][0])) ? rawDocstore[0] : rawDocstore;

        for (const item of items) {
          if (Array.isArray(item) && item.length >= 2 && item[0] && item[1]) {
            const id = String(item[0]);
            const docObj = item[1];
            this.docsMap.set(id, {
              id,
              pageContent: docObj.pageContent || '',
              metadata: docObj.metadata || {}
            });
          }
        }
        console.log(`[TSVectorStore] ✓ ${this.docsMap.size} documentos carregados de: ${docstoreFile}`);
      }

      if (vectorsFile && fs.existsSync(vectorsFile)) {
        const rawContent = fs.readFileSync(vectorsFile, 'utf-8');
        const rawVectors = JSON.parse(rawContent);
        for (const [id, vec] of Object.entries(rawVectors)) {
          if (Array.isArray(vec)) {
            this.vectorsMap.set(id, vec as number[]);
          }
        }
        console.log(`[TSVectorStore] ✓ ${this.vectorsMap.size} vetores carregados de: ${vectorsFile}`);
      }

      this.isInitialized = true;
    } catch (err: any) {
      console.error('[TSVectorStore] Erro na inicialização:', err?.message || err);
      throw err;
    }
  }

  /**
   * Alimenta os vetores manualmente se forem passados como parâmetro.
   */
  public loadData(documents: Document[], vectors: Record<string, number[]>): void {
    for (const doc of documents) {
      if (doc.id) {
        this.docsMap.set(doc.id, doc);
      }
    }
    for (const [id, vec] of Object.entries(vectors)) {
      this.vectorsMap.set(id, vec);
    }
    this.isInitialized = true;
  }

  /**
   * Busca por similaridade vetorial por cosseno.
   */
  public similaritySearch(
    queryEmbedding: number[],
    topK = 5,
    filterFn?: (doc: Document) => boolean
  ): [Document, number][] {
    const scored: [Document, number][] = [];

    for (const [id, doc] of this.docsMap.entries()) {
      if (filterFn && !filterFn(doc)) {
        continue;
      }
      const docVector = this.vectorsMap.get(id);
      if (!docVector) {
        continue;
      }

      const score = TSVectorStore.cosineSimilarity(queryEmbedding, docVector);
      scored.push([doc, score]);
    }

    // Ordena do maior score para o menor
    scored.sort((a, b) => b[1] - a[1]);

    return scored.slice(0, topK);
  }

  public getDocuments(): Document[] {
    return Array.from(this.docsMap.values());
  }

  public findSyntheticProjectListDoc(): Document | null {
    for (const doc of this.docsMap.values()) {
      if (doc.metadata?.source === 'synthetic_project_list') {
        return doc;
      }
    }
    return null;
  }
}
