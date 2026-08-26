import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ProviderFactory } from '../core/factory/provider-factory.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function exportVectors() {
  const faissDirPath = path.resolve(__dirname, '../faiss_index');
  const embeddingProvider = ProviderFactory.getEmbeddingProvider();
  console.log('[EXPORT] Carregando FAISS de:', faissDirPath);
  const store = await FaissStore.load(faissDirPath, embeddingProvider.getLangChainEmbeddings());

  const docstore = (store as any).docstore;
  const docMap = docstore._docs || docstore.docs;
  console.log('[EXPORT] Total de documentos em docstore:', Object.keys(docMap).length);

  const index = (store as any)._index;
  console.log('[EXPORT] Total de vetores em FAISS index:', index.ntotal());
  console.log('[EXPORT] Dimensão dos vetores:', index.getDimension());

  const mapping = (store as any).mapping;
  const vectorsMap: Record<string, number[]> = {};

  console.log('[EXPORT] Métodos no proto do index:', Object.getOwnPropertyNames(Object.getPrototypeOf(index)));

  // Tenta reconstruct, getVector ou fallback via embedDocuments
  let extracted = false;
  if (typeof index.reconstruct === 'function') {
    for (let i = 0; i < index.ntotal(); i++) {
      const vector = index.reconstruct(i);
      const docId = mapping[i];
      if (docId) vectorsMap[docId] = Array.from(vector);
    }
    extracted = true;
  }

  if (!extracted) {
    console.log('[EXPORT] Reconstrução nativa do FAISS não disponível. Gerando 401 embeddings via Gemini API...');
    const docstorePath = path.join(faissDirPath, 'docstore.json');
    const rawDocstore = JSON.parse(fs.readFileSync(docstorePath, 'utf-8'));
    const items = (Array.isArray(rawDocstore[0]) && Array.isArray(rawDocstore[0][0])) ? rawDocstore[0] : rawDocstore;
    console.log('[EXPORT] Tamanho bruto de items:', items.length);

    const docs: { id: string; pageContent: string }[] = [];
    for (const item of items) {
      if (Array.isArray(item) && item.length >= 2 && item[0] && item[1]?.pageContent) {
        docs.push({
          id: String(item[0]),
          pageContent: String(item[1].pageContent).trim()
        });
      }
    }

    console.log('[EXPORT] Total de documentos extraídos do docstore:', docs.length);

    const embeddings = embeddingProvider.getLangChainEmbeddings();
    
    // Batch de 20 documentos por vez
    const batchSize = 20;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batchDocs = docs.slice(i, i + batchSize);
      const batchContents = batchDocs.map(d => d.pageContent);
      console.log(`[EXPORT] Gerando embeddings lote ${Math.floor(i / batchSize) + 1} / ${Math.ceil(docs.length / batchSize)} (${batchDocs.length} docs)...`);
      const vectors = await embeddings.embedDocuments(batchContents);
      for (let j = 0; j < vectors.length; j++) {
        const doc = batchDocs[j];
        const vec = vectors[j];
        if (doc && vec) {
          vectorsMap[doc.id] = vec;
        }
      }
    }
  }

  const extractedCount = Object.keys(vectorsMap).length;
  console.log(`[EXPORT] ✓ Extraídos ${extractedCount} vetores de dimensão ${index.getDimension()}.`);

  const outputPath = path.join(faissDirPath, 'vectors.json');
  fs.writeFileSync(outputPath, JSON.stringify(vectorsMap));
  console.log(`[EXPORT] ✓ vectors.json salvo com sucesso em: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Copiar também para a raiz do repositório se faiss_index existir lá
  const rootFaissPath = path.join(process.cwd(), 'faiss_index/vectors.json');
  if (fs.existsSync(path.dirname(rootFaissPath))) {
    fs.writeFileSync(rootFaissPath, JSON.stringify(vectorsMap));
    console.log(`[EXPORT] ✓ Sincronizado com root: ${rootFaissPath}`);
  }
}

exportVectors().catch(console.error);
