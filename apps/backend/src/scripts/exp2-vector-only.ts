import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ProviderFactory } from '../core/factory/provider-factory.js';
import { TSVectorStore } from '../../../frontend/src/lib/rag/ts-vector-store.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runExp2() {
  console.log('=== EXPERIMENTO 2: COMPARAÇÃO ISOLADA FAISS FLAT-IP VS TS COSINE (SEM BUSCA LÉXICA) ===\n');

  const legacyFaissPath = path.resolve(__dirname, '../faiss_index');
  const embeddingProvider = ProviderFactory.getEmbeddingProvider();
  const legacyStore = await FaissStore.load(legacyFaissPath, embeddingProvider.getLangChainEmbeddings());

  const tsStore = new TSVectorStore();
  await tsStore.initialize(
    path.join(legacyFaissPath, 'docstore.json'),
    path.join(legacyFaissPath, 'vectors.json')
  );

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

    // 1. FAISS Vector-Only Search
    const legacyFaissResults = await legacyStore.similaritySearchWithScore(query, 5);

    // 2. TS Cosine Vector-Only Search
    const queryEmbed = await embeddingProvider.getLangChainEmbeddings().embedQuery(query);
    const tsResults = tsStore.similaritySearch(queryEmbed, 5);

    const faissHeaders = legacyFaissResults.map(([doc]) => (doc.metadata?.section_header || doc.pageContent.slice(0, 35).replace(/\n/g, ' ')));
    const tsHeaders = tsResults.map(([doc]) => (doc.metadata?.section_header || doc.pageContent.slice(0, 35).replace(/\n/g, ' ')));

    console.log(`[FAISS FlatIP]  Top-1: "${faissHeaders[0]}"`);
    console.log(`[TS Cosine]    Top-1: "${tsHeaders[0]}"`);

    const overlap1 = faissHeaders[0] === tsHeaders[0] ? 1 : 0;
    const overlap3 = faissHeaders.slice(0, 3).filter(h => tsHeaders.slice(0, 3).includes(h)).length;
    const overlap5 = faissHeaders.slice(0, 5).filter(h => tsHeaders.slice(0, 5).includes(h)).length;

    totalOverlapTop1 += overlap1;
    totalOverlapTop3 += overlap3;
    totalOverlapTop5 += overlap5;

    const rankInTs = tsHeaders.indexOf(faissHeaders[0] || '');
    const mrr = rankInTs !== -1 ? 1 / (rankInTs + 1) : 0;
    mrrSum += mrr;

    console.log(`[METRICAS VETORIAIS] Overlap Top-1: ${overlap1}/1 | Top-3: ${overlap3}/3 | Top-5: ${overlap5}/5 | RR: ${mrr.toFixed(2)}\n`);
  }

  const numQueries = testQueries.length;
  console.log(`==================================================`);
  console.log(`RESULTADO FINAL EXPERIMENTO 2 (FAISS vs TS COSINE APENAS VETORIAL):`);
  console.log(`- Overlap Top-1 Médio: ${(totalOverlapTop1 / numQueries * 100).toFixed(1)}%`);
  console.log(`- Overlap Top-3 Médio: ${(totalOverlapTop3 / (numQueries * 3) * 100).toFixed(1)}% (${(totalOverlapTop3 / numQueries).toFixed(1)}/3)`);
  console.log(`- Overlap Top-5 Médio: ${(totalOverlapTop5 / (numQueries * 5) * 100).toFixed(1)}% (${(totalOverlapTop5 / numQueries).toFixed(1)}/5)`);
  console.log(`- MRR Médio: ${(mrrSum / numQueries).toFixed(3)}`);
  console.log(`==================================================\n`);
}

runExp2().catch(console.error);
