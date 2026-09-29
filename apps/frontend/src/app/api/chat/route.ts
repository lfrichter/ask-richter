import { NextRequest, NextResponse } from 'next/server';
import { TSVectorStore, Document } from '@/lib/rag/ts-vector-store';
import {
  ServerlessHybridRetriever,
  decomposeQuery,
  classifyIntent,
  expandQuery,
  applyDiversityFilter,
  pruneChunksToTokenBudget,
  assembleStructuredContext,
  QueryPlan
} from '@/lib/rag/hybrid-retriever';
import { GeminiEmbeddingService, GeminiLLMProvider } from '@/lib/ai/llm-provider';
import { detectStructuredIntent } from '@/lib/server/sanity/queries';
import { RetrievalOrchestrator, LegacyFallbackAdapter } from '@/lib/server/sanity/orchestrator';

let vectorStoreInstance: TSVectorStore | null = null;
let retrieverInstance: ServerlessHybridRetriever | null = null;

async function getRAGInstances() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new TSVectorStore();
    await vectorStoreInstance.initialize();
  }
  if (!retrieverInstance) {
    retrieverInstance = new ServerlessHybridRetriever(vectorStoreInstance);
    retrieverInstance.initialize();
  }
  return { vectorStore: vectorStoreInstance, retriever: retrieverInstance };
}

async function smartSearch(
  queryPlan: QueryPlan,
  queryEmbedding: number[],
  vectorStore: TSVectorStore,
  retriever: ServerlessHybridRetriever
): Promise<[Document, number][]> {
  const originalQuery = queryPlan.payload.originalQuery || '';

  switch (queryPlan.type) {
    case 'LIST_PROJECTS': {
      const syntheticDoc = vectorStore.findSyntheticProjectListDoc();
      if (syntheticDoc) {
        return [[syntheticDoc, 1.0]];
      }
      return retriever.search(queryEmbedding, originalQuery, 10);
    }

    case 'PROJECT_TECHNOLOGY_SEARCH': {
      const targetTechnologies: string[] = queryPlan.payload.technologies ||
        (queryPlan.payload.technology ? [queryPlan.payload.technology] : []);

      const filterFunction = (doc: Document) => {
        const docTechs = doc.metadata?.technologies;
        if (!docTechs || !Array.isArray(docTechs)) return false;
        return targetTechnologies.some(target =>
          docTechs.some((t: string) => typeof t === 'string' && t.toLowerCase() === target.toLowerCase())
        );
      };

      const results = vectorStore.similaritySearch(queryEmbedding, 30, filterFunction);
      if (results.length > 0) {
        return results;
      }
      return retriever.search(queryEmbedding, originalQuery || `projetos ${targetTechnologies.join(' ')}`, 20);
    }

    case 'SIMPLE_SEARCH':
    default: {
      const intent = classifyIntent(originalQuery);
      if (intent === 'TECH_QUESTION') {
        const expanded = expandQuery(originalQuery);
        return retriever.search(queryEmbedding, expanded, 5);
      }
      return retriever.search(queryEmbedding, originalQuery, 5);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, message, question: bodyQuestion } = body;
    let question: string | undefined;

    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      question = typeof last === 'string' ? last : (last?.content || last?.message);
    } else if (typeof message === 'string') {
      question = message;
    } else if (typeof bodyQuestion === 'string') {
      question = bodyQuestion;
    }

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'A pergunta está vazia.' }, { status: 400 });
    }

    console.log(`[VERCEL SERVERLESS RAG] Pergunta recebida: "${question}"`);

    const { vectorStore, retriever } = await getRAGInstances();
    const embeddingService = new GeminiEmbeddingService();

    // 1. Gera embedding da pergunta para compatibilidade e fallback
    const queryEmbedding = await embeddingService.embedQuery(question);

    // 2. Classifica a pergunta
    const queryPlan = decomposeQuery(question);
    const structuredMatch = detectStructuredIntent(question, queryPlan);

    let structuredContext = '';

    if (structuredMatch) {
      // Caminho M2: Structured Retrieval com Fallback Determinístico
      console.log(`[M2 STRUCTURED RETRIEVAL] Intent detectada: ${structuredMatch.intent}`);
      const fallbackAdapter: LegacyFallbackAdapter = {
        search: async () => {
          const searchResults = await smartSearch(queryPlan, queryEmbedding, vectorStore, retriever);
          let topResults: [Document, number][];
          if (queryPlan.type === 'LIST_PROJECTS') {
            topResults = searchResults.slice(0, 1);
          } else if (queryPlan.type === 'PROJECT_TECHNOLOGY_SEARCH') {
            const sorted = searchResults.sort((a, b) => b[1] - a[1]);
            topResults = applyDiversityFilter(sorted, 6, 1);
          } else {
            topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 5);
          }
          topResults = pruneChunksToTokenBudget(topResults, 2800);
          return topResults.map(([doc]) => ({ pageContent: doc.pageContent, metadata: doc.metadata }));
        },
      };

      const orchestrator = new RetrievalOrchestrator({ fallbackAdapter });
      const retrievalOutput = await orchestrator.orchestrate(structuredMatch.intent, structuredMatch.params);

      if (retrievalOutput.abstained || !retrievalOutput.formattedContext) {
        structuredContext = '[STATUS: NENHUMA EVIDÊNCIA FACTUAL ENCONTRADA NA BASE DE DADOS]';
      } else {
        structuredContext = retrievalOutput.formattedContext;
      }
    } else {
      // Caminho M3: Free-form com Sanity Semantic/Hybrid Retrieval + Fallback para Legacy RAG
      console.log('[M3 SEMANTIC RETRIEVAL] Pergunta livre, executando busca semântica no Sanity...');
      const fallbackAdapter: LegacyFallbackAdapter = {
        search: async () => {
          const searchResults = await smartSearch(queryPlan, queryEmbedding, vectorStore, retriever);
          let topResults: [Document, number][];

          if (queryPlan.type === 'LIST_PROJECTS') {
            topResults = searchResults.slice(0, 1);
          } else if (queryPlan.type === 'PROJECT_TECHNOLOGY_SEARCH') {
            const sorted = searchResults.sort((a, b) => b[1] - a[1]);
            topResults = applyDiversityFilter(sorted, 6, 1);
          } else {
            topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 5);
          }

          topResults = pruneChunksToTokenBudget(topResults, 2800);
          return topResults.map(([doc]) => ({ pageContent: doc.pageContent, metadata: doc.metadata }));
        },
      };

      const orchestrator = new RetrievalOrchestrator({ fallbackAdapter });
      const semanticOutput = await orchestrator.orchestrateFreeform(question);

      if (semanticOutput.abstained || !semanticOutput.formattedContext) {
        structuredContext = '[STATUS: NENHUMA EVIDÊNCIA FACTUAL ENCONTRADA NA BASE DE DADOS]';
      } else {
        structuredContext = semanticOutput.formattedContext;
      }
    }

    const systemPrompt = `Você é um assistente especialista na carreira de Luis Fernando Richter e atua de forma direta, profissional e precisa.

REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
1. IDIOMA / LANGUAGE ALIGNMENT: Responda SEMPRE no mesmo idioma da pergunta do usuário (Answer ALWAYS in the exact same language as the user's message). Se a pergunta for em Inglês, responda em Inglês. Se for em Português, responda em Português. Se for em Espanhol, responda em Espanhol. O idioma da mensagem do usuário tem prioridade absoluta sobre o idioma do contexto recuperado. O contexto recuperado serve exclusivamente como fonte de evidência factual.
2. FONTE DA VERDADE: Use APENAS o contexto fornecido pelo usuário. NUNCA use seu conhecimento prévio. NUNCA faça inferências ou suposições.
3. DESAMBIGUAÇÃO CRÍTICA: Quando questionado sobre "projetos", refira-se ESTRITAMENTE a "Projetos de Software" (sistemas, aplicações desenvolvidas). Cursos, Treinamentos e Certificações NÃO SÃO projetos de software e NUNCA devem ser listados.
4. AUSÊNCIA DE DADOS: Se a resposta não estiver no contexto exato ou o contexto indicar ausência de evidência, informe no mesmo idioma da pergunta do usuário que não possui os detalhes no momento (ex em PT: "Com base nas informações que recuperei no momento, não tenho os detalhes para responder a essa pergunta." | em EN: "Based on the retrieved information, I do not have the details to answer this question."). NÃO invente.
5. FORMATAÇÃO: Ao listar projetos, SEMPRE use o formato: "* Projeto: [Nome] - [Descrição/Tecnologias]".
6. LIMITE DE CARGA COGNITIVA (PAGINAÇÃO): Se o contexto retornar uma lista longa (mais de 7 projetos), NUNCA liste todos de uma vez. Escolha e liste apenas os 7 mais relevantes. Ao final da lista, adicione OBRIGATORIAMENTE uma frase no idioma da pergunta convidando o usuário a explorar o restante.`;

    const userMessage = `CONTEXTO RECUPERADO DO BANCO DE DADOS:
    ${structuredContext}

    PERGUNTA DO USUÁRIO:
    ${question}

    RESPOSTA (seguindo rigorosamente as regras do sistema):`;

    const llmProvider = new GeminiLLMProvider();
    const responseText = await llmProvider.generate(systemPrompt, userMessage);

    return NextResponse.json({ answer: responseText });

  } catch (error: any) {
    console.error('[VERCEL SERVERLESS RAG ERROR]', error?.message || error);
    const status = error?.status || 500;
    return NextResponse.json(
      { error: error?.message || 'Ocorreu um erro interno no servidor.' },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
