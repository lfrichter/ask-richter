import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  detectStructuredIntent,
} from './queries'
import {
  RetrievalOrchestrator,
  LegacyFallbackAdapter,
} from './orchestrator'
import {
  SanityServerClient,
  SanityTimeoutError,
  SanityRequestError,
} from './client'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

describe('M2 Phase B — Chat Integration & Intent Routing Suite', () => {
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

  // B1: STRUCTURED_ROUTING
  it('B1-STRUCTURED_ROUTING: Perguntas estruturadas são detectadas para o M2 Orchestrator', () => {
    // 1. LIST_PROJECTS
    const listMatch = detectStructuredIntent('Quais projetos o Richter desenvolveu?')
    assert.ok(listMatch)
    assert.strictEqual(listMatch.intent, 'LIST_PROJECTS')

    // 2. SKILLS_MATRIX
    const skillMatch = detectStructuredIntent('Quais tecnologias e linguagens ele domina?')
    assert.ok(skillMatch)
    assert.strictEqual(skillMatch.intent, 'SKILLS_MATRIX')

    // 3. PROJECT_BY_TECH
    const techMatch = detectStructuredIntent('Quais projetos usam Laravel e Redis?')
    assert.ok(techMatch)
    assert.strictEqual(techMatch.intent, 'PROJECT_BY_TECH')
    assert.ok(techMatch.params.technologies.some((t: string) => t.toLowerCase() === 'laravel'))
    assert.ok(techMatch.params.technologies.some((t: string) => t.toLowerCase() === 'redis'))

    // 4. CAREER_TIMELINE
    const careerMatch = detectStructuredIntent('Qual foi a trajetória profissional dele na Turno?')
    assert.ok(careerMatch)
    assert.strictEqual(careerMatch.intent, 'CAREER_TIMELINE')
    assert.strictEqual(careerMatch.params.company, 'Turno')

    // 5. EDUCATION_CERTS
    const eduMatch = detectStructuredIntent('Qual a formação acadêmica e certificações?')
    assert.ok(eduMatch)
    assert.strictEqual(eduMatch.intent, 'EDUCATION_CERTS')

    // 6. PROVEN_IMPACT
    const impactMatch = detectStructuredIntent('Quais as principais métricas e resultados alcançados?')
    assert.ok(impactMatch)
    assert.strictEqual(impactMatch.intent, 'PROVEN_IMPACT')

    // 7. ADR_GOVERNANCE
    const adrMatch = detectStructuredIntent('Explique a decisão de arquitetura ADR-0001 sobre o Jidoka')
    assert.ok(adrMatch)
    assert.strictEqual(adrMatch.intent, 'ADR_GOVERNANCE')
    assert.strictEqual(adrMatch.params.adrNumber, 1)
  })

  // B2: SANITY_CONTEXT
  it('B2-SANITY_CONTEXT: Sanity retorna entidades -> contexto formatado com cabeçalho do Sanity Content Lake', async () => {
    const mockClient = createMockClient(async () => [
      {
        _id: 'proj-ask-richter',
        name: 'Ask Richter',
        category: 'ai_engineering_poc',
        status: 'active',
        summary: 'AI Career Agent',
        technologies: ['TypeScript', 'Next.js', 'Sanity'],
      },
    ])

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    assert.strictEqual(output.source, 'sanity_content_lake')
    assert.strictEqual(output.retrievalStatus, 'success')
    assert.strictEqual(output.matchedCount, 1)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA ESTRUTURADA - SANITY CONTENT LAKE]'))
    assert.ok(output.formattedContext.includes('Ask Richter'))
  })

  // B3: SANITY_TIMEOUT
  it('B3-SANITY_TIMEOUT: Timeout no Sanity -> fallback transparente para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityTimeoutError('Request timeout after 2500ms')
    })

    const mockFallback = createMockFallback([
      { pageContent: 'Fallback chunk from TSVectorStore: Mid-Stay Projects on Turno' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.matchedCount, 1)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA RECUPERADA - LEGACY RAG]'))
    assert.ok(output.formattedContext.includes('Mid-Stay Projects'))
  })

  // B4: SANITY_EMPTY
  it('B4-SANITY_EMPTY: Sanity retorna vazio -> fallback para TSVectorStore', async () => {
    const mockClient = createMockClient(async () => []) // 0 registros no Sanity
    const mockFallback = createMockFallback([
      { pageContent: 'Fallback evidence for rare technology query' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('PROJECT_BY_TECH', { technologies: ['rare-tech'] })

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.matchedCount, 1)
    assert.strictEqual(output.abstained, false)
  })

  // B5: DOUBLE_EMPTY
  it('B5-DOUBLE_EMPTY: Sanity + TSVectorStore ambos vazios -> retrievalStatus: no_evidence e abstained: true', async () => {
    const mockClient = createMockClient(async () => [])
    const mockFallback = createMockFallback([])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('PROJECT_BY_TECH', { technologies: ['non-existent'] })

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.retrievalStatus, 'no_evidence')
    assert.strictEqual(output.matchedCount, 0)
    assert.strictEqual(output.abstained, true)
    assert.strictEqual(output.formattedContext, '')
  })

  // B6: FREEFORM_PRESERVATION
  it('B6-FREEFORM_PRESERVATION: Pergunta livre não-estruturada retorna null no detectStructuredIntent para usar RAG híbrido', () => {
    const freeformQueries = [
      'Como você organiza seu dia de trabalho como desenvolvedor?',
      'O que você acha do futuro da inteligência artificial generativa?',
      'Poderia me contar uma curiosidade sobre sua carreira?',
    ]

    for (const q of freeformQueries) {
      const match = detectStructuredIntent(q)
      assert.strictEqual(match, null, `Query "${q}" deve ser tratada como não-estruturada`)
    }
  })

  // B7: ABSTENTION_SAFETY
  it('B7-ABSTENTION_SAFETY: no_evidence garante ausência de dados factuais sem inventar contexto', async () => {
    const mockClient = createMockClient(async () => [])
    const mockFallback = createMockFallback([])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('ADR_GOVERNANCE', { adrNumber: 99 })

    assert.strictEqual(output.retrievalStatus, 'no_evidence')
    assert.strictEqual(output.formattedContext.length, 0)
    assert.strictEqual(output.estimatedTokens, 0)
    assert.strictEqual(output.abstained, true)
  })

  // B8: ERROR_ISOLATION
  it('B8-ERROR_ISOLATION: Falha 500 do Sanity é isolada sem derrubar a requisição', async () => {
    const mockClient = createMockClient(async () => {
      throw new SanityRequestError('Internal Server Error 500', 500)
    })

    const mockFallback = createMockFallback([
      { pageContent: 'Preserved system resilience context' },
    ])

    const orchestrator = new RetrievalOrchestrator({
      client: mockClient,
      fallbackAdapter: mockFallback,
    })

    const output = await orchestrator.orchestrate('SKILLS_MATRIX')

    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.matchedCount, 1)
  })

  // B9: TOKEN_BUDGET
  it('B9-TOKEN_BUDGET: Contexto formatado permanece estritamente dentro do limite de 2800 tokens', async () => {
    const massiveProjects = Array.from({ length: 50 }, (_, i) => ({
      _id: `proj-${i}`,
      name: `Heavy Enterprise Scale System #${i}`,
      summary: 'Detailed architectural summary with extensive descriptions.'.repeat(10),
      technologies: ['TypeScript', 'Next.js', 'Python', 'Docker', 'Kubernetes'],
    }))

    const mockClient = createMockClient(async () => massiveProjects)
    const orchestrator = new RetrievalOrchestrator({ client: mockClient })

    const output = await orchestrator.orchestrate('LIST_PROJECTS')

    assert.ok(output.estimatedTokens <= CONTEXT_BUDGET_TOKENS)
    assert.ok(output.matchedCount > 0)
    assert.strictEqual(output.estimatedTokens, estimateTokens(output.formattedContext))
  })

  // B10: LEGACY_REGRESSION
  it('B10-LEGACY_REGRESSION: O orquestrador preserva parâmetros e compatibilidade', () => {
    const plan = {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      payload: { technologies: ['PHP', 'Laravel'] },
    }
    const match = detectStructuredIntent('projetos em php e laravel', plan)

    assert.ok(match)
    assert.strictEqual(match.intent, 'PROJECT_BY_TECH')
    assert.deepStrictEqual(match.params.technologies, ['PHP', 'Laravel'])
  })

  // B11: NATURAL_VARIATIONS_ROUTING (M5 Hardening)
  it('B11-NATURAL_VARIATIONS_ROUTING: Suporta variações linguísticas naturais para LIST_PROJECTS e outros sem drift', () => {
    const projectVariations = [
      'Quais projetos?',
      'Quais são os projetos?',
      'Quais foram os projetos?',
      'Quais os projetos?',
      'Liste os projetos',
      'Me mostre os projetos',
      'Todos os projetos',
      'Quais projetos o Richter desenvolveu?',
      'Em quais projetos o Richter atuou?',
      'Quais são os projetos em que o Richter atuou?',
      'Quais projetos ele desenvolveu?',
      'Quais são os projetos desenvolvidos pelo Richter?',
      'Mostre os projetos realizados',
      'Quantos projetos o Richter tem?',
    ]

    for (const q of projectVariations) {
      const match = detectStructuredIntent(q)
      assert.ok(match, `Query "${q}" deve ser detectada como estruturada`)
      assert.strictEqual(match.intent, 'LIST_PROJECTS', `Query "${q}" deve mapear para LIST_PROJECTS`)
    }

    const techVariations = [
      { query: 'Quais projetos usam Laravel?', tech: 'Laravel' },
      { query: 'Quais são os projetos com React?', tech: 'React' },
      { query: 'Quais projetos Python ele desenvolveu?', tech: 'Python' },
    ]

    for (const { query, tech } of techVariations) {
      const match = detectStructuredIntent(query)
      assert.ok(match, `Query "${query}" deve ser detectada como estruturada`)
      assert.strictEqual(match.intent, 'PROJECT_BY_TECH')
      assert.ok(match.params.technologies.includes(tech))
    }

    const otherVariations = [
      { query: 'Onde o Richter trabalhou?', intent: 'CAREER_TIMELINE' },
      { query: 'Empresas onde o Richter atuou', intent: 'CAREER_TIMELINE' },
      { query: 'Quais tecnologias o Richter domina?', intent: 'SKILLS_MATRIX' },
      { query: 'Quais são as suas habilidades técnicas?', intent: 'SKILLS_MATRIX' },
      { query: 'Qual a formação acadêmica dele?', intent: 'EDUCATION_CERTS' },
      { query: 'Onde o Richter estudou?', intent: 'EDUCATION_CERTS' },
      { query: 'Quais as principais métricas e resultados alcançados?', intent: 'PROVEN_IMPACT' },
      { query: 'Explique a decisão de arquitetura ADR-0001', intent: 'ADR_GOVERNANCE' },
    ]

    for (const { query, intent } of otherVariations) {
      const match = detectStructuredIntent(query)
      assert.ok(match, `Query "${query}" deve ser detectada como estruturada`)
      assert.strictEqual(match.intent, intent, `Query "${query}" deve mapear para ${intent}`)
    }
  })

  // B12: MULTILINGUAL_AND_NEGATIVE_ROUTING (M6-B Hardening)
  it('B12-MULTILINGUAL_AND_NEGATIVE_ROUTING: Paridade PT/EN/ES em PROJECT_BY_TECH e anti-regressão negativa em LIST_PROJECTS', () => {
    // 1. Positive Multilingual Parity for PROJECT_BY_TECH
    const multilingualTechCases = [
      { query: 'Quais projetos usam React?', tech: 'React' },
      { query: 'Which projects use React?', tech: 'React' },
      { query: '¿Qué proyectos utilizan React?', tech: 'React' },
      { query: 'Projects developed with Laravel', tech: 'Laravel' },
      { query: 'Proyectos creados con Vue', tech: 'Vue' },
    ]

    for (const { query, tech } of multilingualTechCases) {
      const match = detectStructuredIntent(query)
      assert.ok(match, `Query "${query}" deve ser detectada como estruturada`)
      assert.strictEqual(match.intent, 'PROJECT_BY_TECH', `Query "${query}" deve mapear para PROJECT_BY_TECH`)
      assert.ok(match.params.technologies.includes(tech), `Query "${query}" deve extrair a tecnologia ${tech}`)
    }

    // 2. Positive Catalog Listing
    const positiveCatalog = [
      'Quais projetos existem?',
      'Quais são os projetos?',
      'Which projects did Richter develop?',
      'All the projects',
      'List all projects',
    ]
    for (const q of positiveCatalog) {
      const match = detectStructuredIntent(q)
      assert.ok(match, `Query "${q}" deve ser detectada como estruturada`)
      assert.strictEqual(match.intent, 'LIST_PROJECTS', `Query "${q}" deve mapear para LIST_PROJECTS`)
    }

    // 3. Negative / Anti-regression guards (queries contendo "projeto/project" que NÃO são catálogo)
    const negativeCatalogQueries = [
      'Quais tecnologias conectam o projeto Ask Richter às experiências profissionais do Richter?',
      'Qual foi o primeiro projeto do Richter usando tecnologia XYZ-UNEXISTENT?',
      'Como o projeto Ask Richter se relaciona com a carreira dele?',
      'Which technologies connect the Ask Richter project to his career?',
      'Which was the first project using XYZ-UNEXISTENT?',
    ]

    for (const q of negativeCatalogQueries) {
      const match = detectStructuredIntent(q)
      assert.notStrictEqual(match?.intent, 'LIST_PROJECTS', `Query "${q}" NÃO deve ser classificada como LIST_PROJECTS`)
    }
  })
})

