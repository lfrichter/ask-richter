import { describe, it } from 'node:test'
import assert from 'node:assert'
import { RetrievalOrchestrator, LegacyFallbackAdapter } from './orchestrator'
import { isAgenticMultiHopQuery } from './agent-eligibility'
import { AgentPlanner } from './agent-planner'
import { KnowledgeGraphRetriever } from './knowledge-graph-retriever'
import { SanityServerClient } from './client'

describe('M4 Phase C — Tri-Retrieval Orchestration & Agent Integration Suite', () => {
  // C1: Pergunta M2 continua em M2
  it('C1. Pergunta com Structured Intent M2 deve priorizar M2 e não acionar M4', () => {
    const query = 'Quais projetos o Richter desenvolveu?'
    const hasStructuredMatch = true
    const isM4 = isAgenticMultiHopQuery(query, hasStructuredMatch)
    assert.strictEqual(isM4, false, 'Pergunta com match M2 não pode ser capturada por M4')
  })

  // C2: Pergunta M3 continua em M3
  it('C2. Pergunta conceitual simples deve seguir para M3 sem ser interceptada por M4', () => {
    const query = 'Como ele lida com incidentes críticos em produção?'
    const isM4 = isAgenticMultiHopQuery(query, false)
    assert.strictEqual(isM4, false, 'Pergunta conceitual simples não é elegível para M4')
  })

  // C3: Pergunta Multi-Hop aciona M4
  it('C3. Pergunta sobre ADR e decisão arquitetural deve ser elegível para M4', () => {
    const query = 'Qual foi a motivação da decisão na ADR 7?'
    const isM4 = isAgenticMultiHopQuery(query, false)
    assert.strictEqual(isM4, true, 'Pergunta sobre ADR deve acionar M4')
  })

  // C5 & C6: Contexto M4 entrega Grafo de Evidências com proveniência
  it('C5 & C6. orchestrateAgentic deve retornar source sanity_agentic_graph e proveniência completa', async () => {
    const mockClient = {
      fetch: async (query: string) => {
        if (query.includes('_type == "architectureDecision"')) {
          return {
            _id: 'adr-0007',
            _type: 'architectureDecision',
            adrNumber: 7,
            title: 'FAISS Elimination',
            technologies: [{ _ref: 'skill-ts' }],
          }
        }
        if (query.includes('_type == "skill"')) {
          return { _id: 'skill-ts', _type: 'skill', name: 'TypeScript' }
        }
        return null
      },
    } as unknown as SanityServerClient

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })
    const output = await orchestrator.orchestrateAgentic('O que diz a ADR 7?')

    assert.strictEqual(output.source, 'sanity_agentic_graph')
    assert.strictEqual(output.retrievalStatus, 'success')
    assert.strictEqual(output.abstained, false)
    assert.ok(output.matchedCount > 0)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA ESTRUTURADA - SANITY KNOWLEDGE GRAPH]'))
    assert.ok(output.formattedContext.includes('[ARCHITECTUREDECISION]: adr-0007'))
  })

  // C7: Fallback determinístico em caso de falha de rede do M4
  it('C7. Falha no Sanity Knowledge Graph deve acionar fallback transparente para Legacy RAG', async () => {
    const failingClient = {
      fetch: async () => {
        throw new Error('Network timeout in Graph Retriever')
      },
    } as unknown as SanityServerClient

    const fallbackAdapter: LegacyFallbackAdapter = {
      search: async () => [
        { pageContent: 'Trecho recuperado do TSVectorStore sobre a ADR-0007' },
      ],
    }

    const orchestrator = new RetrievalOrchestrator({
      client: failingClient,
      fallbackAdapter,
    })

    const output = await orchestrator.orchestrateAgentic('Explique a ADR 7')

    assert.strictEqual(output.source, 'fallback_ts_vector_store')
    assert.strictEqual(output.retrievalStatus, 'fallback_success')
    assert.strictEqual(output.abstained, false)
    assert.ok(output.formattedContext.includes('[EVIDÊNCIA RECUPERADA - LEGACY RAG]'))
  })

  // C8: Zero Evidência -> Abstenção explícita
  it('C8. Quando Sanity Graph e Fallback retornam zero registros, deve retornar abstained: true', async () => {
    const emptyClient = {
      fetch: async () => null,
    } as unknown as SanityServerClient

    const emptyFallback: LegacyFallbackAdapter = {
      search: async () => [],
    }

    const orchestrator = new RetrievalOrchestrator({
      client: emptyClient,
      fallbackAdapter: emptyFallback,
    })

    const output = await orchestrator.orchestrateAgentic('Decisão inexistente XYZ')

    assert.strictEqual(output.retrievalStatus, 'no_evidence')
    assert.strictEqual(output.abstained, true)
    assert.strictEqual(output.matchedCount, 0)
  })

  // C12: Token Budget <= 2.800 tokens
  it('C12. orchestrateAgentic deve manter o contexto estritamente dentro do orçamento de 2.800 tokens', async () => {
    const hugeClient = {
      fetch: async () => ({
        _id: 'adr-huge',
        _type: 'architectureDecision',
        adrNumber: 99,
        title: 'Huge Decision',
        context: 'C'.repeat(5000),
        decision: 'D'.repeat(5000),
      }),
    } as unknown as SanityServerClient

    const orchestrator = new RetrievalOrchestrator({ client: hugeClient })
    const output = await orchestrator.orchestrateAgentic('ADR 99')

    assert.ok(output.estimatedTokens <= 2800)
  })

  // C13: Paridade Multilíngue (PT / EN / ES)
  it('C13. Deve orquestrar perguntas em Inglês e Espanhol para o Knowledge Graph', async () => {
    const mockClient = {
      fetch: async () => ({
        _id: 'adr-0007',
        _type: 'architectureDecision',
        adrNumber: 7,
        title: 'FAISS Elimination',
      }),
    } as unknown as SanityServerClient

    const orchestrator = new RetrievalOrchestrator({ client: mockClient })

    const enOutput = await orchestrator.orchestrateAgentic('What is the architectural decision in ADR 7?')
    assert.strictEqual(enOutput.source, 'sanity_agentic_graph')
    assert.strictEqual(enOutput.retrievalStatus, 'success')

    const esOutput = await orchestrator.orchestrateAgentic('Cuál fue la decisión en ADR 7?')
    assert.strictEqual(esOutput.source, 'sanity_agentic_graph')
    assert.strictEqual(esOutput.retrievalStatus, 'success')
  })
})
