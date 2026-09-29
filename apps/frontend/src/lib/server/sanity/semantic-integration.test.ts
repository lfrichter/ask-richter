import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  RetrievalOrchestrator,
  LegacyFallbackAdapter
} from './orchestrator'
import {
  SanityServerClient,
  SanityTimeoutError,
  SanityRequestError
} from './client'
import { SemanticRetriever } from './semantic-retriever'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

describe('M3 Phase B — Semantic Integration & Free-form Orchestration Suite', () => {
  function createMockClient(mockFetch: (query: string, params: Record<string, any>) => Promise<any>): SanityServerClient {
    return {
      fetch: mockFetch,
    } as unknown as SanityServerClient
  }

  function createMockFallback(results: Array<{ pageContent: string; metadata?: any }> = []): LegacyFallbackAdapter {
    return {
      search: async () => results,
    }
  }

  // B11: STRUCTURED_PRESERVATION
  it('B11-STRUCTURED_PRESERVATION: Intenções estruturadas continuam executando M2 sem desvio', async () => {
    let executedQuery = ''
    const mockClient = createMockClient(async (query) => {
      executedQuery = query
      return [{ _id: 'proj-1', name: 'Ask Richter', status: 'completed' }]
    })

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    assert.strictEqual(output.intent, 'LIST_PROJECTS')
    assert.strictEqual(output.source, 'sanity_content_lake')
    assert.ok(executedQuery.includes('_type == "project"'))
    assert.ok(!executedQuery.includes('text::semanticSimilarity'))
  })

  // B12: FREEFORM_SEMANTIC_ROUTING
  it('B12-FREEFORM_ROUTING: Consultas livres são roteadas para M3 Semantic/Hybrid Search', async () => {
    let semanticCalled = false
    const mockClient = createMockClient(async (query, params) => {
      semanticCalled = true
      assert.ok(query.includes('text::semanticSimilarity($query)'))
      assert.strictEqual(params.query, 'Como lidar com problemas de concorrência?')
      return [
        {
          _id: 'ach-1',
          _type: 'achievement',
          _score: 8.2,
          title: 'Conciliação Atômica de Estoque',
          context: 'Eliminação de overselling na Plugae',
        },
      ]
    })

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrateFreeform('Como lidar com problemas de concorrência?')

    assert.ok(semanticCalled)
    assert.strictEqual(output.retrievalStatus, 'success')
    assert.strictEqual(output.source, 'sanity_content_lake')
    assert.strictEqual(output.matchedCount, 1)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA SEMÂNTICA - SANITY CONTENT LAKE]'))
    assert.ok(output.formattedContext.includes('Conciliação Atômica'))
  })

  // B13: NO_CROSS_INTERFERENCE
  it('B13-NO_CROSS_INTERFERENCE: SemanticRetriever não executa quando chamado via orchestrate estruturado', async () => {
    const mockClient = createMockClient(async (query) => {
      assert.ok(!query.includes('text::semanticSimilarity'))
      return [{ _id: 'exp-1', company: 'Turno' }]
    })

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrate('CAREER_TIMELINE', { company: 'Turno' })

    assert.strictEqual(output.intent, 'CAREER_TIMELINE')
    assert.strictEqual(output.source, 'sanity_content_lake')
  })

  // B14: SEMANTIC_TIMEOUT_FALLBACK
  it('B14-TIMEOUT_FALLBACK: Timeout de 2.5s no Sanity Semantic -> fallback transparente para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityTimeoutError('Request timeout after 2500ms')
    })

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Experiência em liderança técnica e resiliência na Turno.', metadata: { source: 'CV' } },
    ])

    const orchestrator = new RetrievalOrchestrator({ client: mockClient, fallbackAdapter })
    const output = await orchestrator.orchestrateFreeform('liderança técnica em produção')

    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA RECUPERADA - LEGACY RAG]'))
    assert.ok(output.formattedContext.includes('liderança técnica e resiliência'))
  })

  // B15: SEMANTIC_EMPTY_FALLBACK
  it('B15-EMPTY_FALLBACK: Sanity Semantic retorna 0 resultados -> fallback transparente para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => [])

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Documento recuperado do índice vetorial legado.', metadata: { source: 'docstore' } },
    ])

    const orchestrator = new RetrievalOrchestrator({ client: mockClient, fallbackAdapter })
    const output = await orchestrator.orchestrateFreeform('termo específico')

    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
    assert.ok(output.formattedContext.includes('Documento recuperado do índice vetorial legado'))
  })

  // B16: DOUBLE_EMPTY_ABSTENTION
  it('B16-DOUBLE_EMPTY: Sanity Semantic + TSVectorStore ambos vazios -> retrievalStatus: no_evidence e abstained: true', async () => {
    const mockClient = createMockClient(async () => [])
    const fallbackAdapter = createMockFallback([])

    const orchestrator = new RetrievalOrchestrator({ client: mockClient, fallbackAdapter })
    const output = await orchestrator.orchestrateFreeform('consulta completamente desconhecida')

    assert.strictEqual(output.retrievalStatus, 'no_evidence')
    assert.strictEqual(output.abstained, true)
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.formattedContext, '')
    assert.strictEqual(output.estimatedTokens, 0)
  })

  // B17: TOKEN_BUDGET
  it('B17-TOKEN_BUDGET: Contexto formatado do free-form respeita limite de 2800 tokens', async () => {
    const hugeResults = Array.from({ length: 8 }, (_, i) => ({
      _id: `huge-${i}`,
      _type: 'experience',
      _score: 8.0 - i * 0.1,
      company: `Grande Corporação ${i}`,
      role: 'Engenheiro Principal',
      summary: 'Parágrafo extenso descrevendo projetos complexos. '.repeat(15),
      storytelling: {
        situation: 'Situação de incidente. '.repeat(10),
        action: 'Ação resolutiva. '.repeat(10),
        result: 'Resultado mensurável. '.repeat(10),
      },
    }))

    const mockClient = createMockClient(async () => hugeResults)
    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrateFreeform('conteúdo volumoso')

    assert.ok(output.estimatedTokens <= CONTEXT_BUDGET_TOKENS)
    assert.ok(estimateTokens(output.formattedContext) <= CONTEXT_BUDGET_TOKENS)
  })

  // B18: PROVENANCE_SEPARATION
  it('B18-PROVENANCE: Cabeçalhos distinguem Sanity Content Lake de Legacy RAG explicitamente', async () => {
    const mockSuccessClient = createMockClient(async () => [
      { _id: 'skill-1', _type: 'skill', _score: 7.5, name: 'TypeScript' },
    ])
    const orchestrator1 = new RetrievalOrchestrator({ client: mockSuccessClient })
    const output1 = await orchestrator1.orchestrateFreeform('TypeScript')

    assert.ok(output1.formattedContext.includes('[EVIDÊNCIA SEMÂNTICA - SANITY CONTENT LAKE]'))
    assert.ok(!output1.formattedContext.includes('[EVIDÊNCIA RECUPERADA - LEGACY RAG]'))

    const mockEmptyClient = createMockClient(async () => [])
    const fallbackAdapter = createMockFallback([{ pageContent: 'Texto legado', metadata: {} }])
    const orchestrator2 = new RetrievalOrchestrator({ client: mockEmptyClient, fallbackAdapter })
    const output2 = await orchestrator2.orchestrateFreeform('TypeScript')

    assert.ok(output2.formattedContext.includes('[EVIDÊNCIA RECUPERADA - LEGACY RAG]'))
    assert.ok(!output2.formattedContext.includes('[EVIDÊNCIA SEMÂNTICA - SANITY CONTENT LAKE]'))
  })

  // B19: MULTILINGUAL_ORCHESTRATION
  it('B19-MULTILINGUAL: Consultas em PT, EN e ES orquestram normalmente', async () => {
    const queries = [
      'Como lidar com incidentes?',
      'How to manage production issues?',
      '¿Cómo resolver incidentes?'
    ]

    for (const q of queries) {
      const mockClient = createMockClient(async (query, params) => {
        assert.strictEqual(params.query, q)
        return [{ _id: 'doc-1', _type: 'experience', _score: 7.0, company: 'Plugae' }]
      })

      const orchestrator = new RetrievalOrchestrator({ client: mockClient })
      const output = await orchestrator.orchestrateFreeform(q)
      assert.strictEqual(output.retrievalStatus, 'success')
      assert.strictEqual(output.matchedCount, 1)
    }
  })

  // B20: ERROR_ISOLATION
  it('B20-ERROR_ISOLATION: Erro de API 500 no Sanity Semantic cai para o fallback sem quebrar a requisição', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityRequestError('500 Internal Server Error', 500)
    })

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Recuperado com segurança via fallback após falha 500 no Sanity.', metadata: {} },
    ])

    const orchestrator = new RetrievalOrchestrator({ client: mockClient, fallbackAdapter })
    const output = await orchestrator.orchestrateFreeform('teste com erro 500')

    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.ok(output.formattedContext.includes('Recuperado com segurança'))
  })
})
