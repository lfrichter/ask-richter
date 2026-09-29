import { SanityServerClient } from './client'
import { StructuredIntent } from './queries'
import {
  SanityStructuredRetriever,
  StructuredRetrievalOutput,
  RetrievalStatus,
  CONTEXT_BUDGET_TOKENS,
  estimateTokens,
} from './structured-retriever'

export interface LegacyFallbackAdapter {
  search: (intent: string, params: Record<string, any>) => Promise<Array<{ pageContent: string; metadata?: Record<string, any> }>>
}

export interface OrchestrationOptions {
  client?: SanityServerClient
  retriever?: SanityStructuredRetriever
  fallbackAdapter?: LegacyFallbackAdapter
}

export class RetrievalOrchestrator {
  private readonly retriever: SanityStructuredRetriever
  private readonly fallbackAdapter?: LegacyFallbackAdapter

  constructor(options: OrchestrationOptions = {}) {
    this.retriever = options.retriever || new SanityStructuredRetriever(options.client || new SanityServerClient())
    this.fallbackAdapter = options.fallbackAdapter
  }

  public async orchestrate(
    intent: StructuredIntent,
    params: Record<string, any> = {}
  ): Promise<StructuredRetrievalOutput> {
    let sanityOutput: StructuredRetrievalOutput | null = null
    let sanityError: Error | null = null

    try {
      sanityOutput = await this.retriever.retrieve(intent, params)
    } catch (err: any) {
      sanityError = err
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
          // Formata contexto do fallback
          let formattedFallback = `[EVIDÊNCIA RECUPERADA - LEGACY RAG]\nINTENÇÃO: ${intent}\nTOTAL DE CHUNKS: ${fallbackDocs.length}\n\n`
          for (const doc of fallbackDocs) {
            formattedFallback += `${doc.pageContent.trim()}\n\n`
          }
          formattedFallback = formattedFallback.trim()

          // Respeita estritamente o orçamento de 2800 tokens
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
        // Erro no fallback
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

    // 3. Se ambos retornaram 0 resultados sem erro de rede -> no_evidence explícito
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
}
