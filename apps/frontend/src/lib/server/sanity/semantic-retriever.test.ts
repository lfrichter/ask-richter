import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  SemanticRetriever,
  buildSemanticGroq,
  formatSemanticResultsContext,
  SemanticRetrievalOutput
} from './semantic-retriever'
import {
  SanityServerClient,
  SanityTimeoutError,
  SanityRequestError
} from './client'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

describe('M3 Phase A — Semantic Retriever (Isolated Server-Side Module)', () => {
  function createMockClient(mockFetch: (query: string, params: Record<string, any>) => Promise<any>): SanityServerClient {
    return {
      fetch: mockFetch,
    } as unknown as SanityServerClient
  }

  // T11: SEMANTIC_BASIC
  it('T11-SEMANTIC-BASIC: Query semântica básica retorna entidades com status success', async () => {
    const mockClient = createMockClient(async (query, params) => {
      assert.ok(query.includes('text::semanticSimilarity($query)'))
      assert.strictEqual(params.query, 'Como lidar com incidentes em produção?')
      return [
        {
          _id: 'exp-plugae',
          _type: 'experience',
          _score: 7.24,
          company: 'Plugae',
          role: 'Desenvolvedor Sênior de Software',
          summary: 'Desenvolvimento do Spider com conciliação atômica de estoque.',
        },
      ]
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('Como lidar com incidentes em produção?', { mode: 'semantic' })

    assert.strictEqual(output.retrievalStatus, 'success')
    assert.strictEqual(output.matchedCount, 1)
    assert.strictEqual(output.source, 'sanity_content_lake')
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA SEMÂNTICA - SANITY CONTENT LAKE]'))
    assert.ok(output.formattedContext.includes('Plugae'))
    assert.ok(output.formattedContext.includes('Desenvolvedor Sênior'))
  })

  // T12: TOP_K_LIMIT
  it('T12-TOP-K-LIMIT: Top-K determinístico é limitado pelo parâmetro limit', async () => {
    let passedLimit: number | undefined
    const mockClient = createMockClient(async (query, params) => {
      passedLimit = params.limit
      return Array.from({ length: params.limit }, (_, i) => ({
        _id: `doc-${i}`,
        _type: 'skill',
        _score: 8.0 - i * 0.5,
        name: `Skill ${i}`,
        category: 'Engineering',
      }))
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('liderança técnica', { limit: 3 })

    assert.strictEqual(passedLimit, 3)
    assert.strictEqual(output.matchedCount, 3)
    assert.strictEqual(output.rawEntities.length, 3)
  })

  // T13: SCORE_RANKING_ORDER
  it('T13-SCORE-RANKING: _score é preservado como ranking relativo ordenado decrescentemente', async () => {
    const mockClient = createMockClient(async () => [
      { _id: 'doc-1', _type: 'skill', _score: 8.5, name: 'Arquitetura Limpa' },
      { _id: 'doc-2', _type: 'experience', _score: 7.2, company: 'Turno' },
      { _id: 'doc-3', _type: 'project', _score: 6.9, name: 'Ask Richter' },
    ])

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('arquitetura de software')

    assert.strictEqual(output.matchedCount, 3)
    assert.strictEqual(output.rawEntities[0]._score, 8.5)
    assert.strictEqual(output.rawEntities[1]._score, 7.2)
    assert.strictEqual(output.rawEntities[2]._score, 6.9)
    assert.ok(output.formattedContext.includes('[Score Relativo: 8.500]'))
  })

  // T14: ZERO_RESULTS_HANDLING
  it('T14-ZERO-RESULTS: Zero resultados retornados -> retrievalStatus: no_evidence e formattedContext vazio', async () => {
    const mockClient = createMockClient(async () => [])

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('termo inexistente no grafo')

    assert.strictEqual(output.retrievalStatus, 'no_evidence')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.rawEntities.length, 0)
    assert.strictEqual(output.formattedContext, '')
    assert.strictEqual(output.estimatedTokens, 0)
  })

  // T15: TIMEOUT_ERROR_ISOLATION
  it('T15-TIMEOUT-ERROR: Timeout no Sanity -> erro controlado sem derrubar o runtime', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityTimeoutError('Request timeout after 2500ms')
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('pergunta com timeout')

    assert.strictEqual(output.retrievalStatus, 'retrieval_error')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.formattedContext, '')
    assert.ok(output.error?.includes('timeout'))
  })

  // T16: HTTP_API_ERROR_ISOLATION
  it('T16-HTTP-ERROR: Erro de API 500 do Sanity -> erro controlado com status retrieval_error', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityRequestError('Sanity API error 500: Internal Server Error', 500)
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('pergunta com erro')

    assert.strictEqual(output.retrievalStatus, 'retrieval_error')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.formattedContext, '')
    assert.ok(output.error?.includes('500'))
  })

  // T17: TOKEN_BUDGET_ENFORCEMENT
  it('T17-TOKEN-BUDGET: Contexto formatado respeita rigorosamente CONTEXT_BUDGET_TOKENS = 2800', async () => {
    // Simula 10 documentos extensos
    const massiveEntities = Array.from({ length: 10 }, (_, i) => ({
      _id: `large-exp-${i}`,
      _type: 'experience',
      _score: 9.0 - i * 0.1,
      company: `Empresa de Grande Porte ${i}`,
      role: `Diretor de Engenharia de Software e Liderança Técnica ${i}`,
      summary: 'Resumo executivo contendo parágrafos detalhados de arquitetura e governança em escala global. '.repeat(10),
      storytelling: {
        situation: 'Situação de incidente crítico em produção com alta concorrência. '.repeat(10),
        action: 'Ação estratégica liderando squads multifuncionais com automação. '.repeat(10),
        result: 'Resultado com ganho de estabilidade de 99.99% de uptime e zero downtime. '.repeat(10),
      },
      responsibilities: [
        'Responsabilidade de engenharia de software e arquitetura distribuída. '.repeat(5),
        'Coordenação de incidentes críticos em produção com protocolo Jidoka. '.repeat(5),
      ],
      technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis', 'Next.js'],
    }))

    const formatted = formatSemanticResultsContext(massiveEntities, 'semantic', CONTEXT_BUDGET_TOKENS)
    const tokens = estimateTokens(formatted)

    assert.ok(tokens <= CONTEXT_BUDGET_TOKENS, `Tokens excederam limite: ${tokens} > ${CONTEXT_BUDGET_TOKENS}`)
    assert.ok(tokens > 500, `Contexto não foi aproveitado: ${tokens}`)
  })

  // T18: MULTILINGUAL_PARITY
  it('T18-MULTILINGUAL-PARITY: Queries em PT, EN e ES são aceitas sem erros de parsing', async () => {
    const executedQueries: string[] = []
    const mockClient = createMockClient(async (query, params) => {
      executedQueries.push(params.query)
      return [
        {
          _id: 'exp-plugae',
          _type: 'experience',
          _score: 7.0,
          company: 'Plugae',
          role: 'Senior Software Engineer',
        },
      ]
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    await retriever.search('Como lidar com incidentes em produção?')
    await retriever.search('How to handle production incidents?')
    await retriever.search('¿Cómo manejar incidentes en producción?')

    assert.strictEqual(executedQueries.length, 3)
    assert.strictEqual(executedQueries[0], 'Como lidar com incidentes em produção?')
    assert.strictEqual(executedQueries[1], 'How to handle production incidents?')
    assert.strictEqual(executedQueries[2], '¿Cómo manejar incidentes en producción?')
  })

  // T19: SCHEMA_PROJECTION_FORMATTING
  it('T19-PROJECTION-FORMATTING: Formata corretamente campos dos 6 tipos ontológicos', async () => {
    const entities = [
      { _id: 'proj-1', _type: 'project', _score: 8.0, name: 'Spider Hub', category: 'ecommerce', summary: 'Hub multi-marketplace' },
      { _id: 'exp-1', _type: 'experience', _score: 7.9, company: 'Turno', role: 'Engenheiro Líder', summary: 'Liderança técnica' },
      { _id: 'skill-1', _type: 'skill', _score: 7.8, name: 'TypeScript', level: 'Expert', description: 'Tipagem estática' },
      { _id: 'edu-1', _type: 'education', _score: 7.7, degree: 'Engenharia de Software', institution: 'FIAP' },
      { _id: 'ach-1', _type: 'achievement', _score: 7.6, title: 'Zero Overselling', category: 'performance', context: 'Sincronização atômica' },
      { _id: 'adr-1', _type: 'architectureDecision', _score: 7.5, title: 'ADR-0001 Jidoka', decision: 'Parada imediata', rationale: 'Qualidade na origem' },
    ]

    const formatted = formatSemanticResultsContext(entities, 'semantic')

    assert.ok(formatted.includes('PROJECT'))
    assert.ok(formatted.includes('EXPERIENCE'))
    assert.ok(formatted.includes('SKILL'))
    assert.ok(formatted.includes('EDUCATION'))
    assert.ok(formatted.includes('ACHIEVEMENT'))
    assert.ok(formatted.includes('ARCHITECTUREDECISION'))
    assert.ok(formatted.includes('Spider Hub'))
    assert.ok(formatted.includes('Turno'))
    assert.ok(formatted.includes('TypeScript'))
    assert.ok(formatted.includes('FIAP'))
    assert.ok(formatted.includes('Zero Overselling'))
    assert.ok(formatted.includes('ADR-0001 Jidoka'))
  })

  // T20: ZERO_MUTATION_SIDE_EFFECTS
  it('T20-ZERO-SIDE-EFFECTS: O retriever é estritamente somente-leitura (read-only) e livre de efeitos colaterais', async () => {
    let executedMethod = ''
    const mockClient = createMockClient(async (query) => {
      executedMethod = 'fetch'
      assert.ok(!query.includes('create'))
      assert.ok(!query.includes('mutate'))
      assert.ok(!query.includes('delete'))
      assert.ok(!query.includes('patch'))
      return [{ _id: 'doc-1', _type: 'skill', _score: 5.0, name: 'Read-Only Test' }]
    })

    const retriever = new SemanticRetriever({ client: mockClient })
    const output = await retriever.search('teste de não mutação')

    assert.strictEqual(executedMethod, 'fetch')
    assert.strictEqual(output.retrievalStatus, 'success')
  })
})
