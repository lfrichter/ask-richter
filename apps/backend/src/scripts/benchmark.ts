import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ProviderFactory } from '../core/factory/provider-factory.js';
import { HybridRetriever as LegacyHybridRetriever } from '../core/hybrid-retriever.js';
import { TSVectorStore } from '../../../frontend/src/lib/rag/ts-vector-store.js';
import { ServerlessHybridRetriever } from '../../../frontend/src/lib/rag/hybrid-retriever.js';
import { GeminiEmbeddingService } from '../../../frontend/src/lib/ai/llm-provider.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runBenchmark() {
  console.log('=== AUDITORIA DE PARIDADE RAG: FAISS (LEGADO) VS TS COSINE (NOVO) ===\n');

  const legacyFaissPath = path.resolve(__dirname, '../faiss_index');
  const embeddingProvider = ProviderFactory.getEmbeddingProvider();
  const legacyStore = await FaissStore.load(legacyFaissPath, embeddingProvider.getLangChainEmbeddings());

  const rawDocstore = JSON.parse(fs.readFileSync(path.join(legacyFaissPath, 'docstore.json'), 'utf-8'));
  const items = Array.isArray(rawDocstore[0]) && Array.isArray(rawDocstore[0][0]) ? rawDocstore[0] : rawDocstore;
  const legacyDocs = items.map((item: any) => ({ pageContent: item[1].pageContent, metadata: item[1].metadata }));

  const legacyRetriever = new LegacyHybridRetriever(legacyStore, legacyDocs as any);

  const tsStore = new TSVectorStore();
  await tsStore.initialize(
    path.join(legacyFaissPath, 'docstore.json'),
    path.join(legacyFaissPath, 'vectors.json')
  );
  const tsRetriever = new ServerlessHybridRetriever(tsStore);
  tsRetriever.initialize();
  const geminiEmbeddings = new GeminiEmbeddingService();

  const testQueries = [
    'Quais os projetos em Python?',
    'Qual a experiência com Laravel e PHP?',
    'Quais projetos envolvem Inteligência Artificial?',
    'Quais são todos os projetos disponíveis?',
    'Experiência com React e Vue.js'
  ];

  let totalOverlapTop1 = 0;
  let totalOverlapTop3 = 0;
  let totalOverlapTop5 = 0;
  let mrrSum = 0;

  for (const query of testQueries) {
    console.log(`--------------------------------------------------`);
    console.log(`QUERY: "${query}"`);
    console.log(`--------------------------------------------------`);

    const t0 = Date.now();
    const legacyResults = await legacyRetriever.search(query, 5);
    const legacyTime = Date.now() - t0;

    const t1 = Date.now();
    const queryEmbed = await embeddingProvider.getLangChainEmbeddings().embedQuery(query);
    const tsResults = tsRetriever.search(queryEmbed, query, 5);
    const tsTime = Date.now() - t1;

    const legacyIds = legacyResults.map(([doc]) => (doc.metadata?.section_header || doc.pageContent.slice(0, 30)));
    const tsIds = tsResults.map(([doc]) => (doc.metadata?.section_header || doc.pageContent.slice(0, 30)));

    console.log(`[LEGACY FAISS]  Latência: ${legacyTime}ms | Top-1: "${legacyIds[0]}"`);
    console.log(`[NEW TS COSINE] Latência: ${tsTime}ms | Top-1: "${tsIds[0]}"`);

    const overlap1 = legacyIds[0] === tsIds[0] ? 1 : 0;
    const overlap3 = legacyIds.slice(0, 3).filter(id => tsIds.slice(0, 3).includes(id)).length;
    const overlap5 = legacyIds.slice(0, 5).filter(id => tsIds.slice(0, 5).includes(id)).length;

    totalOverlapTop1 += overlap1;
    totalOverlapTop3 += overlap3;
    totalOverlapTop5 += overlap5;

    const rankInTs = tsIds.indexOf(legacyIds[0] || '');
    const mrr = rankInTs !== -1 ? 1 / (rankInTs + 1) : 0;
    mrrSum += mrr;

    console.log(`Overlap Top-1: ${overlap1}/1 | Top-3: ${overlap3}/3 | Top-5: ${overlap5}/5 | Reciprocal Rank: ${mrr.toFixed(2)}\n`);
  }

  const numQueries = testQueries.length;
  console.log(`==================================================`);
  console.log(`METRICAS CONSOLIDADAS DO BENCHMARK DE PARIDADE:`);
  console.log(`- Overlap Top-1 Médio: ${(totalOverlapTop1 / numQueries * 100).toFixed(1)}%`);
  console.log(`- Overlap Top-3 Médio: ${(totalOverlapTop3 / (numQueries * 3) * 100).toFixed(1)}% (${(totalOverlapTop3 / numQueries).toFixed(1)}/3 chunks)`);
  console.log(`- Overlap Top-5 Médio: ${(totalOverlapTop5 / (numQueries * 5) * 100).toFixed(1)}% (${(totalOverlapTop5 / numQueries).toFixed(1)}/5 chunks)`);
  console.log(`- MRR (Mean Reciprocal Rank): ${(mrrSum / numQueries).toFixed(3)}`);
  console.log(`==================================================\n`);
}

runBenchmark().catch(console.error);
