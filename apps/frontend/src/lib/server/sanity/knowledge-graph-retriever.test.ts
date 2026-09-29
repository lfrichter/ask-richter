import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  KnowledgeGraphRetriever,
  ALLOWED_TOOLS,
  MAX_TOOL_HOPS,
  MAX_TOOL_CALLS,
  GLOBAL_TIMEOUT_MS,
  GraphEvidenceItem,
} from './knowledge-graph-retriever'
import { SanityServerClient } from './client'

describe('M4 Phase A — Deterministic Knowledge Graph & Multi-Hop Retrieval', () => {
  // A1: Tool registry fechado
  it('A1. Deve conter um registro fechado de ferramentas permitidas', () => {
    assert.strictEqual(ALLOWED_TOOLS.length, 6)
    assert.deepStrictEqual([...ALLOWED_TOOLS], [
      'getProject',
      'getExperience',
      'getSkill',
      'getEducation',
      'getAchievement',
      'getArchitectureDecision',
    ])
  })

  // A2 & A17: Todas as tools read-only / zero mutation
  it('A2 & A17. Todas as ferramentas devem ser de leitura estrita (sem mutações)', () => {
    const retriever = new KnowledgeGraphRetriever()
    assert.strictEqual(typeof (retriever as any).createDocument, 'undefined')
    assert.strictEqual(typeof (retriever as any).patchDocument, 'undefined')
    assert.strictEqual(typeof (retriever as any).deleteDocument, 'undefined')
  })

  // A3: Project -> related entities (experience e skills)
  it('A3. Deve expandir Projeto para Experiência e Skills associadas (Hop 1)', async () => {
    const mockClient = {
      fetch: async (query: string, params?: Record<string, any>) => {
        if (query.includes('_type == "project"')) {
          return {
            _id: 'proj-midstay',
            _type: 'project',
            name: 'Mid-Stay Projects',
            experience: { _ref: 'exp-turno' },
            technologies: [{ _ref: 'skill-laravel' }, { _ref: 'skill-vue' }],
          }
        }
        if (query.includes('_type == "experience" && _id == $id')) {
          return {
            _id: 'exp-turno',
            _type: 'experience',
            company: 'Turno',
            role: 'Tech Lead',
          }
        }
        if (query.includes('_type == "skill" && _id == $id')) {
          return {
            _id: params?.id,
            _type: 'skill',
            name: params?.id === 'skill-laravel' ? 'Laravel' : 'Vue.js',
          }
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('project', 'proj-midstay', { maxHops: 1 })

    assert.strictEqual(result.status, 'success')
    assert.strictEqual(result.abstained, false)
    assert.strictEqual(result.rootEntity?.documentId, 'proj-midstay')
    assert.strictEqual(result.evidenceGraph.length, 4) // Root + 1 Experience + 2 Skills
    assert.ok(result.evidenceGraph.some((e) => e.documentId === 'exp-turno' && e.hop === 1))
    assert.ok(result.evidenceGraph.some((e) => e.documentId === 'skill-laravel' && e.hop === 1))
  })

  // A4: Experience -> projects
  it('A4. Deve expandir Experiência para Projetos desenvolvidos na empresa', async () => {
    const mockClient = {
      fetch: async (query: string) => {
        if (query.includes('_type == "experience"')) {
          return {
            _id: 'exp-turno',
            _type: 'experience',
            company: 'Turno',
            role: 'Tech Lead',
          }
        }
        if (query.includes('_type == "project" && experience._ref == $id')) {
          return [
            { _id: 'proj-midstay', _type: 'project', name: 'Mid-Stay Projects' },
            { _id: 'proj-integration', _type: 'project', name: 'Turno Integration' },
          ]
        }
        return []
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('experience', 'exp-turno', { maxHops: 1 })

    assert.strictEqual(result.status, 'success')
    assert.strictEqual(result.rootEntity?.documentId, 'exp-turno')
    assert.ok(result.evidenceGraph.some((e) => e.documentId === 'proj-midstay' && e.relation === 'company_project'))
  })

  // A5 & A6: ADR -> technologies / skills
  it('A5 & A6. Deve recuperar ADR e expandir para Skills relacionadas', async () => {
    const mockClient = {
      fetch: async (query: string, params?: Record<string, any>) => {
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
          return {
            _id: 'skill-ts',
            _type: 'skill',
            name: 'TypeScript',
          }
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('architectureDecision', 7, { maxHops: 1 })

    assert.strictEqual(result.status, 'success')
    assert.strictEqual(result.rootEntity?.documentId, 'adr-0007')
    assert.ok(result.evidenceGraph.some((e) => e.documentId === 'skill-ts' && e.relation === 'applies_to_technology'))
  })

  // A7: Achievement -> source entity
  it('A7. Deve expandir Conquista (Achievement) para Experiência de origem', async () => {
    const mockClient = {
      fetch: async (query: string) => {
        if (query.includes('_type == "achievement"')) {
          return {
            _id: 'ach-turno-30',
            _type: 'achievement',
            title: '+30% Retenção',
            experience: { _ref: 'exp-turno' },
          }
        }
        if (query.includes('_type == "experience"')) {
          return {
            _id: 'exp-turno',
            _type: 'experience',
            company: 'Turno',
          }
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('achievement', 'ach-turno-30', { maxHops: 1 })

    assert.strictEqual(result.status, 'success')
    assert.ok(result.evidenceGraph.some((e) => e.documentId === 'exp-turno' && e.relation === 'achieved_at_experience'))
  })

  // A8: Máximo 2 hops estritamente respeitado
  it('A8. Deve limitar a travessia a no máximo 2 hops mesmo se solicitado valor maior', async () => {
    const mockClient = {
      fetch: async (query: string) => {
        if (query.includes('_type == "project"')) {
          return {
            _id: 'proj-1',
            _type: 'project',
            name: 'P1',
            experience: { _ref: 'exp-1' },
          }
        }
        if (query.includes('_type == "experience"')) {
          return { _id: 'exp-1', _type: 'experience', company: 'C1' }
        }
        if (query.includes('_type == "achievement"')) {
          return [{ _id: 'ach-1', _type: 'achievement', title: 'A1' }]
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('project', 'proj-1', { maxHops: 5 })

    assert.strictEqual(result.status, 'success')
    assert.ok(result.totalHops <= MAX_TOOL_HOPS)
    assert.ok(result.evidenceGraph.every((e) => e.hop <= 2))
  })

  // A9: Máximo 4 tool calls
  it('A9. Deve respeitar o limite máximo de 4 chamadas de ferramentas por travessia', async () => {
    let callCount = 0
    const mockClient = {
      fetch: async (query: string) => {
        callCount++
        if (query.includes('_type == "project"')) {
          return {
            _id: 'proj-1',
            _type: 'project',
            name: 'P1',
            technologies: [{ _ref: 's1' }, { _ref: 's2' }, { _ref: 's3' }, { _ref: 's4' }, { _ref: 's5' }],
          }
        }
        return { _id: 'skill-generic', _type: 'skill', name: 'Skill' }
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient, maxCalls: 4 })
    const result = await retriever.traverseFromEntity('project', 'proj-1', { maxHops: 2 })

    assert.strictEqual(result.status, 'success')
    assert.ok(result.totalCalls <= MAX_TOOL_CALLS)
  })

  // A10: Deadline global <= 4s com cancelamento
  it('A10. Deve cancelar por timeout global se ultrapassar o deadline', async () => {
    const slowClient = {
      fetch: async (_query: string, _params?: any, options?: { signal?: AbortSignal }) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve({ _id: 'proj-slow', _type: 'project', name: 'Slow' })
          }, 150)
          options?.signal?.addEventListener('abort', () => {
            clearTimeout(timer)
            const abortErr = new Error('The operation was aborted')
            abortErr.name = 'AbortError'
            reject(abortErr)
          })
        })
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: slowClient, globalTimeoutMs: 50 })
    const result = await retriever.traverseFromEntity('project', 'proj-slow')

    assert.strictEqual(result.status, 'retrieval_error')
    assert.strictEqual(result.abstained, true)
  })

  // A11: Detecção de ciclos e eliminação de duplicatas
  it('A11. Deve detectar ciclos e não re-adicionar ou re-expandir nós visitados', async () => {
    const mockClient = {
      fetch: async (query: string) => {
        if (query.includes('_type == "project"')) {
          return {
            _id: 'proj-midstay',
            _type: 'project',
            name: 'Mid-Stay',
            experience: { _ref: 'exp-turno' },
          }
        }
        if (query.includes('_type == "experience"')) {
          return {
            _id: 'exp-turno',
            _type: 'experience',
            company: 'Turno',
          }
        }
        if (query.includes('_type == "achievement"')) {
          // Tenta apontar de volta para o projeto já visitado
          return [{ _id: 'proj-midstay', _type: 'project', title: 'Mid-Stay' }]
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('project', 'proj-midstay', { maxHops: 2 })

    assert.strictEqual(result.status, 'success')
    const ids = result.evidenceGraph.map((e) => e.documentId)
    const uniqueIds = new Set(ids)
    assert.strictEqual(ids.length, uniqueIds.size, 'Não deve haver IDs duplicados no grafo de evidências')
  })

  // A12: Entidade inexistente -> no_evidence
  it('A12. Deve retornar no_evidence com abstained: true quando a entidade raiz não existir', async () => {
    const emptyClient = {
      fetch: async () => null,
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: emptyClient })
    const result = await retriever.traverseFromEntity('project', 'proj-nao-existe')

    assert.strictEqual(result.status, 'no_evidence')
    assert.strictEqual(result.abstained, true)
    assert.strictEqual(result.evidenceGraph.length, 0)
  })

  // A13: Falha de rede -> retrieval_error
  it('A13. Deve retornar retrieval_error quando ocorrer exceção de rede', async () => {
    const failingClient = {
      fetch: async () => {
        throw new Error('Connection refused')
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: failingClient })
    const result = await retriever.traverseFromEntity('project', 'proj-error')

    assert.strictEqual(result.status, 'retrieval_error')
    assert.strictEqual(result.abstained, true)
    assert.ok(result.error?.includes('Connection refused'))
  })

  // A14: Proveniência completa no grafo de evidências
  it('A14. Cada item de evidência deve conter proveniência completa', async () => {
    const mockClient = {
      fetch: async () => ({
        _id: 'proj-1',
        _type: 'project',
        name: 'P1',
      }),
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client: mockClient })
    const result = await retriever.traverseFromEntity('project', 'proj-1', { maxHops: 0 })

    assert.strictEqual(result.status, 'success')
    const item = result.evidenceGraph[0]
    assert.strictEqual(item.documentId, 'proj-1')
    assert.strictEqual(item.documentType, 'project')
    assert.strictEqual(item.source, 'sanity')
    assert.strictEqual(item.hop, 0)
    assert.ok(item.data)
  })

  // A15: Orçamento de contexto <= 2.800 tokens
  it('A15. O contexto formatado deve respeitar estritamente o orçamento de 2.800 tokens', () => {
    const retriever = new KnowledgeGraphRetriever()
    const hugeItems: GraphEvidenceItem[] = Array.from({ length: 50 }, (_, i) => ({
      documentId: `doc-${i}`,
      documentType: 'project',
      source: 'sanity',
      hop: 1,
      relation: 'huge_test',
      data: {
        name: `Huge Project ${i}`,
        summary: 'A'.repeat(500),
        architecture: 'B'.repeat(500),
      },
    }))

    const formatted = retriever.formatEvidenceGraph(hugeItems)
    const estimatedTokens = Math.ceil(formatted.length / 4)
    assert.ok(estimatedTokens <= 2800, `Tokens (${estimatedTokens}) excedeu o limite de 2800`)
  })

  // A16: Robustez de identificadores (número, string, slug)
  it('A16. Deve aceitar diferentes tipos de identificadores para ADR, Skill, Education e Project', async () => {
    const client = {
      fetch: async (query: string, params?: Record<string, any>) => {
        if (query.includes('adrNumber == $adrNumber')) {
          return { _id: 'adr-0007', _type: 'architectureDecision', adrNumber: params?.adrNumber, title: 'ADR' }
        }
        if (query.includes('institution match $institution')) {
          return { _id: 'edu-fiap', _type: 'education', institution: 'FIAP', degree: 'Pós' }
        }
        return null
      },
    } as unknown as SanityServerClient

    const retriever = new KnowledgeGraphRetriever({ client })

    const adrResult = await retriever.traverseFromEntity('architectureDecision', 7, { maxHops: 0 })
    assert.strictEqual(adrResult.status, 'success')
    assert.strictEqual(adrResult.rootEntity?.documentId, 'adr-0007')

    const eduResult = await retriever.traverseFromEntity('education', 'FIAP', { maxHops: 0 })
    assert.strictEqual(eduResult.status, 'success')
    assert.strictEqual(eduResult.rootEntity?.documentId, 'edu-fiap')
  })
})
