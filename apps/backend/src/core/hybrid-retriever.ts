import { Document } from '@langchain/core/documents';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import natural from 'natural';

export class HybridRetriever {
  private vectorStore: FaissStore;
  private bm25: natural.BayesClassifier;
  private documents: Document[];

  constructor(vectorStore: FaissStore, documents: Document[]) {
    this.vectorStore = vectorStore;
    this.documents = documents;
    this.bm25 = new natural.BayesClassifier();
    documents.forEach((doc, i) => {
      this.bm25.addDocument(doc.pageContent, i.toString());
    });
    this.bm25.train();
  }

  public async search(query: string, k: number = 5): Promise<[Document, number][]> {
    // Vector search
    const vectorResults = await this.vectorStore.similaritySearchWithScore(query, k);

    // BM25 search
    const bm25Results = this.bm25.getClassifications(query)
      .slice(0, k)
      .map(classification => {
        const docIndex = parseInt(classification.label, 10);
        return [this.documents[docIndex], classification.value] as [Document, number];
      });

    // Combine and re-rank (simple approach: add scores)
    const combinedResults: { [key: string]: { doc: Document, score: number } } = {};

    vectorResults.forEach(([doc, score]) => {
      const key = doc.pageContent;
      if (!combinedResults[key]) {
        combinedResults[key] = { doc, score: 0 };
      }
      combinedResults[key].score += score;
    });

    bm25Results.forEach(([doc, score]) => {
      const key = doc.pageContent;
      if (!combinedResults[key]) {
        combinedResults[key] = { doc, score: 0 };
      }
      combinedResults[key].score += score;
    });

    const sortedResults = Object.values(combinedResults)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return sortedResults.map(result => [result.doc, result.score]);
  }
}
