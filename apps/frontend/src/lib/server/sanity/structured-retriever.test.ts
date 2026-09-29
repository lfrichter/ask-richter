import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  SanityServerClient,
  SanityTimeoutError,
  SanityRequestError,
} from './client'
import {
  STRUCTURED_QUERIES,
  StructuredIntent,
  GROQ_LIST_PROJECTS,
  GROQ_SKILLS_MATRIX,
  GROQ_PROJECT_BY_TECH,
  GROQ_CAREER_TIMELINE,
  GROQ_EDUCATION_CERTS,
  GROQ_PROVEN_IMPACT,
  GROQ_ADR_GOVERNANCE,
} from './queries'
import {
  SanityStructuredRetriever,
  CONTEXT_BUDGET_TOKENS,
  estimateTokens,
  pruneEntitiesToBudget,
} from './structured-retriever'
import { RetrievalOrchestrator, LegacyFallbackAdapter } from './orchestrator'

describe('M2 — Structured Retrieval (Isolated Server-Side Module)', () => {
  // Helper to create mock Sanity client
  function createMockClient(mockFetch: (query: string, params: Record<string, any>) => Promise<any>): SanityServerClient {
    return {
      fetch: mockFetch,
    } as unknown as SanityServerClient
  }

  // Helper to create mock Fallback adapter
  function createMockFallback(results: Array<{ pageContent: string; metadata?: any }> = []): LegacyFallbackAdapter {
    return {
      search: async () => results,
    }
  }

  // ---------------------------------------------------------------------------
  // T1: GROQ Dispatcher
  // ---------------------------------------------------------------------------
  it('T1-GROQ-DISPATCH: As 7 intents possuem query declarada e executável pelo dispatcher', async () => {
    const intents: StructuredIntent[] = [
      'LIST_PROJECTS',
      'SKILLS_MATRIX',
      'PROJECT_BY_TECH',
      'CAREER_TIMELINE',
      'EDUCATION_CERTS',
      'PROVEN_IMPACT',
      'ADR_GOVERNANCE',
    ]

    assert.strictEqual(Object.keys(STRUCTURED_QUERIES).length, 7)

    for (const intent of intents) {
      assert.ok(STRUCTURED_QUERIES[intent], `Intent ${intent} deve estar registrada`)
      assert.strictEqual(typeof STRUCTURED_QUERIES[intent].groq, 'string')
      assert.ok(STRUCTURED_QUERIES[intent].groq.length > 20)

      const mockClient = createMockClient(async (query, params) => {
        assert.strictEqual(query, STRUCTURED_QUERIES[intent].groq)
        return [{ _id: 'test-id', name: 'Mock Entity' }]
      })

      const retriever = new SanityStructuredRetriever(mockClient)
      const output = await retriever.retrieve(intent)

      assert.strictEqual(output.intent, intent)
      assert.strictEqual(output.matchedCount, 1)
      assert.strictEqual(output.source, 'sanity_content_lake')
      assert.strictEqual(output.abstained, false)
    }
  })

  // ---------------------------------------------------------------------------
  // T2: No String Interpolation
  // ---------------------------------------------------------------------------
  it('T2-NO-INTERPOLATION: Nenhum input do usuário é interpolado dentro das strings GROQ', () => {
    const groqs = [
      GROQ_LIST_PROJECTS,
      GROQ_SKILLS_MATRIX,
      GROQ_PROJECT_BY_TECH,
      GROQ_CAREER_TIMELINE,
      GROQ_EDUCATION_CERTS,
      GROQ_PROVEN_IMPACT,
      GROQ_ADR_GOVERNANCE,
    ]

    for (const groq of groqs) {
      // Proíbe templates `${...}` nas strings estáticas
      assert.ok(!groq.includes('${'), 'A string GROQ não pode conter interpolação JS')
      assert.ok(!groq.includes('" +'), 'A string GROQ não pode conter concatenação dinâmica')
      assert.ok(!groq.includes("'+"), 'A string GROQ não pode conter concatenação dinâmica')
    }

    // Valida que filtros usam variáveis parametrizadas ($category, $techSlugs, $company, $adrNumber)
    assert.ok(GROQ_SKILLS_MATRIX.includes('$category'))
    assert.ok(GROQ_PROJECT_BY_TECH.includes('$techSlugs'))
    assert.ok(GROQ_CAREER_TIMELINE.includes('$company'))
    assert.ok(GROQ_PROVEN_IMPACT.includes('$category'))
    assert.ok(GROQ_ADR_GOVERNANCE.includes('$adrNumber'))
  })

  // ---------------------------------------------------------------------------
  // T3: Timeout Fallback
  // ---------------------------------------------------------------------------
  it('T3-TIMEOUT-FALLBACK: Sanity excede 2.500 ms -> fallback determinístico para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityTimeoutError('Sanity query timed out after 2500ms')
    })

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Fallback project chunk content from TSVectorStore' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter,
    })

    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
    assert.strictEqual(output.abstained, false)
    assert.ok(output.formattedContext.includes('Fallback project chunk content'))
  })

  // ---------------------------------------------------------------------------
  // T4: Error Fallback
  // ---------------------------------------------------------------------------
  it('T4-ERROR-FALLBACK: Erro de rede/HTTP no Sanity -> fallback para TSVectorStore sem lançar exceção', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityRequestError('Sanity API error (503): Service Unavailable', 503)
    })

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Fallback career timeline from TSVectorStore' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter,
    })

    const output = await orchestrator.orchestrate('CAREER_TIMELINE')

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
    assert.strictEqual(output.abstained, false)
  })

  // ---------------------------------------------------------------------------
  // T5: Empty Sanity Fallback
  // ---------------------------------------------------------------------------
  it('T5-EMPTY-FALLBACK: Sanity retorna zero registros -> fallback para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => {
      return [] // Nenhum resultado no Sanity
    })

    const fallbackAdapter = createMockFallback([
      { pageContent: 'Fallback knowledge base evidence' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter,
    })

    const output = await orchestrator.orchestrate('PROJECT_BY_TECH', { technology: 'python' })

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
    assert.strictEqual(output.abstained, false)
  })

  // ---------------------------------------------------------------------------
  // T6: Double Empty Abstain
  // ---------------------------------------------------------------------------
  it('T6-DOUBLE-EMPTY-ABSTAIN: Sanity e TSVectorStore retornam zero -> estado de abstenção explícito (abstained: true)', async () => {
    const mockClient = createMockClient(async () => {
      return [] // Sanity 0
    })

    const fallbackAdapter = createMockFallback([]) // TSVectorStore 0

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter,
    })

    const output = await orchestrator.orchestrate('ADR_GOVERNANCE', { adrNumber: 999 })

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.abstained, true)
    assert.strictEqual(output.formattedContext, '')
    assert.strictEqual(output.estimatedTokens, 0)
  })

  // ---------------------------------------------------------------------------
  // T7: Token Budget (<= 2800)
  // ---------------------------------------------------------------------------
  it('T7-TOKEN-BUDGET: Contexto formatado respeita estritamente CONTEXT_BUDGET_TOKENS = 2800', () => {
    assert.strictEqual(CONTEXT_BUDGET_TOKENS, 2800)

    // Cria um conjunto massivo de 100 projetos artificiais
    const massiveEntities = Array.from({ length: 100 }, (_, i) => ({
      _id: `proj-${i}`,
      name: `Large Scale Enterprise Project #${i}`,
      category: 'production_saas',
      status: 'completed',
      summary: 'Extensive summary with architectural decisions, cloud infrastructure, and database optimizations.'.repeat(5),
      architecture: 'Microservices with Kubernetes, Redis, Docker Swarm, and Event-Driven Architecture.'.repeat(3),
      challenges: [
        { challenge: 'High concurrency issue', solution: 'Distributed lock with Redis', result: 'Zero downtime' },
      ],
      technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Redis'],
    }))

    const { prunedEntities, formattedContext, estimatedTokens } = pruneEntitiesToBudget(
      'LIST_PROJECTS',
      massiveEntities,
      CONTEXT_BUDGET_TOKENS
    )

    assert.ok(estimatedTokens <= 2800, `Tokens (${estimatedTokens}) devem ser <= 2800`)
    assert.ok(prunedEntities.length > 0, 'Deve conter projetos podados')
    assert.ok(prunedEntities.length < massiveEntities.length, 'Deve ter podado o excedente')
    assert.strictEqual(estimatedTokens, estimateTokens(formattedContext))
  })

  // ---------------------------------------------------------------------------
  // T8: PROJECT_BY_TECH AND Semantics
  // ---------------------------------------------------------------------------
  it('T8-PROJECT-BY-TECH-ALL: PROJECT_BY_TECH preserva semântica estrita de conjunção (AND)', () => {
    const queryDef = STRUCTURED_QUERIES.PROJECT_BY_TECH

    // Valida o template GROQ
    assert.ok(queryDef.groq.includes('count((technologies[]->slug.current)[@ in $techSlugs]) == count($techSlugs)'))
    assert.ok(queryDef.groq.includes('length($techSlugs) > 0'))

    // Simula filtragem em memória equivalente à semântica GROQ
    const dataset = [
      { name: 'Proj Laravel + Redis', techSlugs: ['laravel', 'redis'] },
      { name: 'Proj Somente Laravel', techSlugs: ['laravel'] },
      { name: 'Proj Somente Redis', techSlugs: ['redis'] },
      { name: 'Proj React + Laravel', techSlugs: ['react', 'laravel'] },
      { name: 'Proj Full Stack', techSlugs: ['laravel', 'redis', 'vuejs'] },
    ]

    function matchProjectByTech(techSlugs: string[]) {
      if (techSlugs.length === 0) return []
      return dataset.filter((p) => {
        const matches = p.techSlugs.filter((t) => techSlugs.includes(t)).length
        return matches === techSlugs.length
      })
    }

    // Consulta por ['laravel', 'redis']
    const resultLaravelRedis = matchProjectByTech(['laravel', 'redis'])
    assert.strictEqual(resultLaravelRedis.length, 2)
    assert.deepStrictEqual(
      resultLaravelRedis.map((p) => p.name),
      ['Proj Laravel + Redis', 'Proj Full Stack']
    )

    // Consulta por lista vazia -> 0 resultados
    const emptyResult = matchProjectByTech([])
    assert.strictEqual(emptyResult.length, 0)
  })

  // ---------------------------------------------------------------------------
  // T9: Parameter Validation
  // ---------------------------------------------------------------------------
  it('T9-PARAMETER-VALIDATION: Parâmetros inválidos/malformados são validados ou rejeitados deterministamente', () => {
    // 1. ADR_GOVERNANCE: adrNumber inválido
    assert.throws(
      () => STRUCTURED_QUERIES.ADR_GOVERNANCE.validateParams({ adrNumber: 'invalid-string' }),
      /Invalid adrNumber parameter/
    )
    assert.throws(
      () => STRUCTURED_QUERIES.ADR_GOVERNANCE.validateParams({ adrNumber: -5 }),
      /Invalid adrNumber parameter/
    )

    // ADR válido
    const validAdr = STRUCTURED_QUERIES.ADR_GOVERNANCE.validateParams({ adrNumber: '5' })
    assert.strictEqual(validAdr.adrNumber, 5)

    // 2. SKILLS_MATRIX: category inválida
    assert.throws(
      () => STRUCTURED_QUERIES.SKILLS_MATRIX.validateParams({ category: 12345 }),
      /Invalid category parameter/
    )

    // 3. PROJECT_BY_TECH: normalização de slugs
    const validTechs = STRUCTURED_QUERIES.PROJECT_BY_TECH.validateParams({
      technologies: ['TypeScript', 'Vue.js', 'Next.js'],
    })
    assert.deepStrictEqual(validTechs.techSlugs, ['typescript', 'vue-js', 'next-js'])
  })

  // ---------------------------------------------------------------------------
  // T10: Abstain Propagation
  // ---------------------------------------------------------------------------
  it('T10-ABSTAIN-PROPAGATION: O estado de abstention permanece explícito até a saída do orchestrator', async () => {
    const mockClient = createMockClient(async () => [])
    const mockFallback = createMockFallback([])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    // Propagação explícita de abstenção
    assert.strictEqual(output.abstained, true)
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.formattedContext, '')
    assert.strictEqual(output.estimatedTokens, 0)
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
  })
})
