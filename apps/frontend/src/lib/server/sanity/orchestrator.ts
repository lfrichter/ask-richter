import { SanityServerClient } from './client'
import { StructuredIntent } from './queries'
import {
  SanityStructuredRetriever,
  StructuredRetrievalOutput,
  RetrievalStatus,
  CONTEXT_BUDGET_TOKENS,
  estimateTokens,
} from './structured-retriever'
import {
  SemanticRetriever,
  SemanticRetrievalOutput,
  SemanticSearchOptions,
} from './semantic-retriever'
import {
  AgentPlanner,
  AgenticExecutionResult,
} from './agent-planner'

export interface LegacyFallbackAdapter {
  search: (intentOrQuery: string, params: Record<string, any>) => Promise<Array<{ pageContent: string; metadata?: Record<string, any> }>>
}

export interface OrchestrationOptions {
  client?: SanityServerClient
  structuredRetriever?: SanityStructuredRetriever
  semanticRetriever?: SemanticRetriever
  agentPlanner?: AgentPlanner
  fallbackAdapter?: LegacyFallbackAdapter
}

export class RetrievalOrchestrator {
  private readonly structuredRetriever: SanityStructuredRetriever
  private readonly semanticRetriever: SemanticRetriever
  private readonly agentPlanner: AgentPlanner
  private readonly fallbackAdapter?: LegacyFallbackAdapter

  constructor(options: OrchestrationOptions = {}) {
    const client = options.client || new SanityServerClient()
    this.structuredRetriever = options.structuredRetriever || new SanityStructuredRetriever(client)
    this.semanticRetriever = options.semanticRetriever || new SemanticRetriever({ client })
    this.agentPlanner = options.agentPlanner || new AgentPlanner({ client })
    this.fallbackAdapter = options.fallbackAdapter
  }

  /**
   * Orquestra consultas de intenção estruturada (M2 GROQ declarativo com fallback).
   */
  public async orchestrate(
    intent: StructuredIntent,
    params: Record<string, any> = {}
  ): Promise<StructuredRetrievalOutput> {
    let sanityOutput: StructuredRetrievalOutput | null = null

    try {
      sanityOutput = await this.structuredRetriever.retrieve(intent, params)
    } catch {
      sanityOutput = null
    }

    // 1. Se Sanity foi bem-sucedido e encontrou entidades (> 0)
    if (sanityOutput && sanityOutput.matchedCount > 0 && !sanityOutput.abstained) {
      return {
        ...sanityOutput,
        retrievalStatus: 'success',
      }
    }

    // 2. Se Sanity retornou 0, estourou timeout (>2.5s) ou deu erro -> aciona fallback para TSVectorStore
    if (this.fallbackAdapter) {
      try {
        const fallbackDocs = await this.fallbackAdapter.search(intent, params)
        if (fallbackDocs && fallbackDocs.length > 0) {
          let formattedFallback = `[EVIDÊNCIA RECUPERADA - LEGACY RAG]\nINTENÇÃO: ${intent}\nTOTAL DE CHUNKS: ${fallbackDocs.length}\n\n`
          for (const doc of fallbackDocs) {
            formattedFallback += `${doc.pageContent.trim()}\n\n`
          }
          formattedFallback = formattedFallback.trim()

          let estimated = estimateTokens(formattedFallback)
          if (estimated > CONTEXT_BUDGET_TOKENS) {
            formattedFallback = formattedFallback.slice(0, CONTEXT_BUDGET_TOKENS * 4).trim()
            estimated = estimateTokens(formattedFallback)
          }

          return {
            intent,
            matchedCount: fallbackDocs.length,
            rawEntities: fallbackDocs,
            formattedContext: formattedFallback,
            estimatedTokens: estimated,
            source: 'fallback_ts_vector_store',
            retrievalStatus: 'fallback_success',
            abstained: false,
          }
        }
      } catch (fallbackErr: any) {
        return {
          intent,
          matchedCount: 0,
          rawEntities: [],
          formattedContext: '',
          estimatedTokens: 0,
          source: 'fallback_ts_vector_store',
          retrievalStatus: 'retrieval_error',
          abstained: true,
          error: `Fallback error: ${fallbackErr?.message || String(fallbackErr)}`,
        }
      }
    }

    // 3. Se ambos retornaram 0 resultados -> no_evidence explícito
    return {
      intent,
      matchedCount: 0,
      rawEntities: [],
      formattedContext: '',
      estimatedTokens: 0,
      source: 'fallback_ts_vector_store',
      retrievalStatus: 'no_evidence',
      abstained: true,
    }
  }

  /**
   * Orquestra consultas livres / não estruturadas (M3 Sanity Semantic/Hybrid com fallback para Legacy RAG).
   */
  public async orchestrateFreeform(
    query: string,
    options?: SemanticSearchOptions
  ): Promise<StructuredRetrievalOutput> {
    const searchOptions: SemanticSearchOptions = {
      mode: options?.mode || 'semantic',
      limit: options?.limit || 5,
      ...options,
    }

    let semanticOutput: SemanticRetrievalOutput | null = null

    try {
      semanticOutput = await this.semanticRetriever.search(query, searchOptions)
    } catch {
      semanticOutput = null
    }

    // 1. Se Sanity Semantic retornou entidades válidas (> 0) com sucesso
    if (semanticOutput && semanticOutput.retrievalStatus === 'success' && semanticOutput.matchedCount > 0) {
      return {
        intent: 'FREE_FORM',
        matchedCount: semanticOutput.matchedCount,
        rawEntities: semanticOutput.rawEntities,
        formattedContext: semanticOutput.formattedContext,
        estimatedTokens: semanticOutput.estimatedTokens,
        source: 'sanity_content_lake',
        retrievalStatus: 'success',
        abstained: false,
      }
    }

    // 2. Se Sanity Semantic falhou, estourou timeout ou retornou 0 -> Fallback para Legacy RAG (TSVectorStore)
    if (this.fallbackAdapter) {
      try {
        const fallbackDocs = await this.fallbackAdapter.search('FREE_FORM', { query })
        if (fallbackDocs && fallbackDocs.length > 0) {
          let formattedFallback = `[EVIDÊNCIA RECUPERADA - LEGACY RAG]\nCONSULTA: ${query}\nTOTAL DE CHUNKS: ${fallbackDocs.length}\n\n`
          for (const doc of fallbackDocs) {
            formattedFallback += `${doc.pageContent.trim()}\n\n`
          }
          formattedFallback = formattedFallback.trim()

          let estimated = estimateTokens(formattedFallback)
          if (estimated > CONTEXT_BUDGET_TOKENS) {
            formattedFallback = formattedFallback.slice(0, CONTEXT_BUDGET_TOKENS * 4).trim()
            estimated = estimateTokens(formattedFallback)
          }

          return {
            intent: 'FREE_FORM',
            matchedCount: fallbackDocs.length,
            rawEntities: fallbackDocs,
            formattedContext: formattedFallback,
            estimatedTokens: estimated,
            source: 'fallback_ts_vector_store',
            retrievalStatus: 'fallback_success',
            abstained: false,
          }
        }
      } catch (fallbackErr: any) {
        return {
          intent: 'FREE_FORM',
          matchedCount: 0,
          rawEntities: [],
          formattedContext: '',
          estimatedTokens: 0,
          source: 'fallback_ts_vector_store',
          retrievalStatus: 'retrieval_error',
          abstained: true,
          error: `Fallback error: ${fallbackErr?.message || String(fallbackErr)}`,
        }
      }
    }

    // 3. Se ambos retornaram 0 resultados -> no_evidence explícito
    return {
      intent: 'FREE_FORM',
      matchedCount: 0,
      rawEntities: [],
      formattedContext: '',
      estimatedTokens: 0,
      source: 'fallback_ts_vector_store',
      retrievalStatus: 'no_evidence',
      abstained: true,
    }
  }

  /**
   * Orquestra consultas agênticas de grafo multi-hop (M4 Sanity Knowledge Graph com fallback para Legacy RAG).
   */
  public async orchestrateAgentic(
    query: string,
    options?: { signal?: AbortSignal }
  ): Promise<StructuredRetrievalOutput> {
    let agentResult: AgenticExecutionResult | null = null

    try {
      const plan = this.agentPlanner.plan(query)
      agentResult = await this.agentPlanner.executePlan(plan, options)
    } catch {
      agentResult = null
    }

    // 1. Se o Knowledge Graph encontrou nós e teve sucesso
    if (agentResult && agentResult.status === 'success' && agentResult.provenanceCount > 0) {
      return {
        intent: 'AGENTIC_MULTI_HOP',
        matchedCount: agentResult.provenanceCount,
        rawEntities: agentResult.graphResult.evidenceGraph,
        formattedContext: agentResult.formattedContext,
        estimatedTokens: agentResult.estimatedTokens,
        source: 'sanity_agentic_graph',
        retrievalStatus: 'success',
        abstained: false,
      }
    }

    // 2. Fallback para Legacy RAG (TSVectorStore)
    if (this.fallbackAdapter) {
      try {
        const fallbackDocs = await this.fallbackAdapter.search('AGENTIC_MULTI_HOP', { query })
        if (fallbackDocs && fallbackDocs.length > 0) {
          let formattedFallback = `[EVIDÊNCIA RECUPERADA - LEGACY RAG]\nCONSULTA MULTI-HOP: ${query}\nTOTAL DE CHUNKS: ${fallbackDocs.length}\n\n`
          for (const doc of fallbackDocs) {
            formattedFallback += `${doc.pageContent.trim()}\n\n`
          }
          formattedFallback = formattedFallback.trim()

          let estimated = estimateTokens(formattedFallback)
          if (estimated > CONTEXT_BUDGET_TOKENS) {
            formattedFallback = formattedFallback.slice(0, CONTEXT_BUDGET_TOKENS * 4).trim()
            estimated = estimateTokens(formattedFallback)
          }

          return {
            intent: 'AGENTIC_MULTI_HOP',
            matchedCount: fallbackDocs.length,
            rawEntities: fallbackDocs,
            formattedContext: formattedFallback,
            estimatedTokens: estimated,
            source: 'fallback_ts_vector_store',
            retrievalStatus: 'fallback_success',
            abstained: false,
          }
        }
      } catch (fallbackErr: any) {
        return {
          intent: 'AGENTIC_MULTI_HOP',
          matchedCount: 0,
          rawEntities: [],
          formattedContext: '',
          estimatedTokens: 0,
          source: 'fallback_ts_vector_store',
          retrievalStatus: 'retrieval_error',
          abstained: true,
          error: `Fallback error: ${fallbackErr?.message || String(fallbackErr)}`,
        }
      }
    }

    // 3. Zero evidência
    return {
      intent: 'AGENTIC_MULTI_HOP',
      matchedCount: 0,
      rawEntities: [],
      formattedContext: '',
      estimatedTokens: 0,
      source: 'fallback_ts_vector_store',
      retrievalStatus: 'no_evidence',
      abstained: true,
    }
  }
}

