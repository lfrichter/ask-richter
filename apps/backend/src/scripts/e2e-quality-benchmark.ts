import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ProviderFactory } from '../core/factory/provider-factory.js';
import { HybridRetriever as LegacyHybridRetriever } from '../core/hybrid-retriever.js';
import { TSVectorStore } from '../../../frontend/src/lib/rag/ts-vector-store.js';
import {
  ServerlessHybridRetriever,
  decomposeQuery,
  applyDiversityFilter,
  pruneChunksToTokenBudget,
  assembleStructuredContext
} from '../../../frontend/src/lib/rag/hybrid-retriever.js';
import { GeminiLLMProvider, GeminiEmbeddingService } from '../../../frontend/src/lib/ai/llm-provider.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runE2EQualityBenchmark() {
  console.log('================================================================================');
  console.log('   BENCHMARK DE QUALIDADE END-TO-END (3 CAMADAS): LEGADO (RENDER) VS NOVO (VERCEL)   ');
  console.log('================================================================================\n');

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

  const llmProvider = new GeminiLLMProvider();

  const testQueries = [
    'Quais os projetos em Python?',
    'Qual a experiência com Laravel e PHP?',
    'Quais projetos envolvem Inteligência Artificial e LLMs?',
    'Quais são todos os projetos disponíveis no portfólio?',
    'Experiência com React, Vue.js e Frontend',
    'Quais projetos usam Docker e Kubernetes?',
    'Qual o histórico profissional e cargos de Luis Richter?',
    'Quais bancos de dados (MySQL, PostgreSQL, Supabase) foram utilizados?'
  ];

  const systemPrompt = `Você é um assistente especialista na carreira de Luis Fernando Richter e atua de forma direta, profissional e precisa.

REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
1. IDIOMA: Responda SEMPRE em Português do Brasil.
2. FONTE DA VERDADE: Use APENAS o contexto fornecido pelo usuário. NUNCA invente.
3. DESAMBIGUAÇÃO CRÍTICA: Quando questionado sobre "projetos", refira-se ESTRITAMENTE a "Projetos de Software".
4. AUSÊNCIA DE DADOS: Se a resposta não estiver no contexto exato, diga: "Com base nas informações que recuperei no momento, não tenho os detalhes para responder a essa pergunta."
5. FORMATAÇÃO: Ao listar projetos, SEMPRE use o formato: "* Projeto: [Nome] - [Descrição/Tecnologias]".`;

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i]!;
    console.log(`\n================================================================================`);
    console.log(`CASO DE TESTE #${i + 1}: "${query}"`);
    console.log(`================================================================================`);

    // --- RAG LEGADO ---
    const t0 = Date.now();
    const legacyRawChunks = await legacyRetriever.search(query, 10);
    const legacyPruned = pruneChunksToTokenBudget(applyDiversityFilter(legacyRawChunks, 6, 2), 2800);
    const legacyContext = assembleStructuredContext(legacyPruned);
    const legacyUserMsg = `CONTEXTO RECUPERADO DO BANCO DE DADOS:\n${legacyContext}\n\nPERGUNTA: ${query}`;
    const legacyAnswer = await llmProvider.generate(systemPrompt, legacyUserMsg);
    const legacyTime = Date.now() - t0;

    // --- RAG NOVO (SERVERLESS) ---
    const t1 = Date.now();
    const queryEmbed = await embeddingProvider.getLangChainEmbeddings().embedQuery(query);
    const queryPlan = decomposeQuery(query);

    let tsRawChunks: [any, number][];
    if (queryPlan.type === 'LIST_PROJECTS') {
      const doc = tsStore.findSyntheticProjectListDoc();
      tsRawChunks = doc ? [[doc, 1.0]] : tsRetriever.search(queryEmbed, query, 10);
    } else if (queryPlan.type === 'PROJECT_TECHNOLOGY_SEARCH') {
      const targetTechs = queryPlan.payload.technologies || [];
      const filterFn = (doc: any) => {
        const docTechs = doc.metadata?.technologies;
        if (!docTechs || !Array.isArray(docTechs)) return false;
        return targetTechs.some((t: string) => docTechs.some((dt: string) => dt.toLowerCase() === t.toLowerCase()));
      };
      const filtered = tsStore.similaritySearch(queryEmbed, 30, filterFn);
      tsRawChunks = filtered.length > 0 ? filtered : tsRetriever.search(queryEmbed, query, 20);
    } else {
      tsRawChunks = tsRetriever.search(queryEmbed, query, 5);
    }

    const tsPruned = pruneChunksToTokenBudget(applyDiversityFilter(tsRawChunks, 6, 2), 2800);
    const tsContext = assembleStructuredContext(tsPruned);
    const tsUserMsg = `CONTEXTO RECUPERADO DO BANCO DE DADOS:\n${tsContext}\n\nPERGUNTA: ${query}`;
    const tsAnswer = await llmProvider.generate(systemPrompt, tsUserMsg);
    const tsTime = Date.now() - t1;

    // --- IMPRESSÃO DAS TRÊS CAMADAS ---
    console.log(`\n--- CAMADA 1 & 2: RETRIEVAL & CONTEXTO ---`);
    console.log(`[LEGADO] Chunks Finais: ${legacyPruned.length} | Latência Total: ${legacyTime}ms`);
    console.log(`[NOVO]   Chunks Finais: ${tsPruned.length}     | Latência Total: ${tsTime}ms`);

    console.log(`\n--- CAMADA 3: RESPOSTA LLM (LEGADO) ---`);
    console.log(legacyAnswer.trim());

    console.log(`\n--- CAMADA 3: RESPOSTA LLM (NOVO SERVERLESS) ---`);
    console.log(tsAnswer.trim());
  }

  console.log(`\n================================================================================`);
  console.log(`BENCHMARK DE QUALIDADE END-TO-END CONCLUÍDO COM SUCESSO.`);
  console.log(`================================================================================\n`);
}

runE2EQualityBenchmark().catch(console.error);
