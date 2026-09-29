import {
  KnowledgeGraphRetriever,
  ALLOWED_TOOLS,
  AllowedToolName,
  SanityDocumentType,
  GraphEvidenceItem,
  GraphTraversalResult,
  MAX_TOOL_HOPS,
  MAX_TOOL_CALLS,
  GLOBAL_TIMEOUT_MS,
} from './knowledge-graph-retriever'
import { SanityServerClient } from './client'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

export interface ToolDefinition {
  name: AllowedToolName
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required?: string[]
  }
}

export const TOOL_SCHEMAS: Record<AllowedToolName, ToolDefinition> = {
  getProject: {
    name: 'getProject',
    description: 'Recupera detalhes de um projeto de software incluindo tecnologias, desafios, arquitetura e experiência associada.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico do projeto (ex: proj-midstay-projects)' },
        name: { type: 'string', description: 'Nome do projeto para correspondência lexical' },
        slug: { type: 'string', description: 'Slug do projeto' },
      },
    },
  },
  getExperience: {
    name: 'getExperience',
    description: 'Recupera detalhes de uma experiência profissional incluindo empresa, cargo, período, storytelling STAR e responsabilidades.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico da experiência (ex: exp-turno)' },
        company: { type: 'string', description: 'Nome da empresa (ex: Turno, Plugae, Evoke Mobile)' },
      },
    },
  },
  getSkill: {
    name: 'getSkill',
    description: 'Recupera detalhes de uma competência técnica, nível e categoria.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico da skill (ex: skill-typescript)' },
        name: { type: 'string', description: 'Nome da skill (ex: TypeScript, Redis, Laravel)' },
      },
    },
  },
  getEducation: {
    name: 'getEducation',
    description: 'Recupera formação acadêmica, cursos e certificações.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico da formação (ex: edu-fiap)' },
        institution: { type: 'string', description: 'Nome da instituição de ensino' },
      },
    },
  },
  getAchievement: {
    name: 'getAchievement',
    description: 'Recupera conquistas quantificáveis, métricas de impacto e resultados de engenharia.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico da conquista' },
        title: { type: 'string', description: 'Título da conquista' },
        category: { type: 'string', description: 'Categoria de impacto' },
      },
    },
  },
  getArchitectureDecision: {
    name: 'getArchitectureDecision',
    description: 'Recupera registros de decisões arquiteturais (ADRs), contexto, decisão, racional e trade-offs.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID canônico da ADR (ex: adr-0007)' },
        adrNumber: { type: 'number', description: 'Número sequencial da ADR (ex: 7)' },
        title: { type: 'string', description: 'Título da decisão' },
      },
    },
  },
}

export interface PlannedToolCall {
  tool: AllowedToolName
  parameters: Record<string, any>
  reason: string
}

export interface AgenticPlan {
  query: string
  plan: PlannedToolCall[]
  mode: 'knowledge_graph_traversal' | 'direct_tool_lookup' | 'empty_plan'
  rootType?: SanityDocumentType
  rootIdentifier?: string | number
  sanitized: boolean
}

export interface AgenticExecutionResult {
  query: string
  plan: AgenticPlan
  graphResult: GraphTraversalResult
  executedCalls: number
  provenanceCount: number
  formattedContext: string
  estimatedTokens: number
  status: 'success' | 'no_evidence' | 'retrieval_error'
  abstained: boolean
  error?: string
}

export interface AgentPlannerOptions {
  client?: SanityServerClient
  graphRetriever?: KnowledgeGraphRetriever
  globalTimeoutMs?: number
  maxCalls?: number
  maxHops?: number
}

export class AgentPlanner {
  private readonly client: SanityServerClient
  private readonly graphRetriever: KnowledgeGraphRetriever
  private readonly globalTimeoutMs: number
  private readonly maxCalls: number
  private readonly maxHops: number

  constructor(options: AgentPlannerOptions = {}) {
    this.client = options.client || new SanityServerClient()
    this.graphRetriever = options.graphRetriever || new KnowledgeGraphRetriever({ client: this.client })
    this.globalTimeoutMs = options.globalTimeoutMs ?? GLOBAL_TIMEOUT_MS
    this.maxCalls = options.maxCalls ?? MAX_TOOL_CALLS
    this.maxHops = options.maxHops ?? MAX_TOOL_HOPS
  }

  /**
   * B1: Retorna a definição canônica de ferramentas permitidas (Read-Only)
   */
  public getToolSchemas(): ToolDefinition[] {
    return Object.values(TOOL_SCHEMAS)
  }

  /**
   * B2, B3, B4 & B14: Analisa a consulta do usuário, sanitiza contra injeções e gera um plano determinístico
   */
  public plan(query: string): AgenticPlan {
    if (!query || !query.trim()) {
      return {
        query: '',
        plan: [],
        mode: 'empty_plan',
        sanitized: true,
      }
    }

    // B14: Sanitização contra Prompt Injection e comandos maliciosos
    const sanitizedQuery = this.sanitizeQuery(query)

    // B2 & B4: Roteamento determinístico de intenção para tool schemas
    const qLower = sanitizedQuery.toLowerCase()

    // 1. Decisões Arquiteturais / ADR
    const adrMatch = qLower.match(/adr[- ]?(\d+)/i) || qLower.match(/decisão (?:arquitetural|de arquitetura) (\d+)/i)
    if (adrMatch) {
      const adrNum = parseInt(adrMatch[1], 10)
      return {
        query: sanitizedQuery,
        mode: 'knowledge_graph_traversal',
        rootType: 'architectureDecision',
        rootIdentifier: adrNum,
        sanitized: true,
        plan: [
          {
            tool: 'getArchitectureDecision',
            parameters: { adrNumber: adrNum },
            reason: `Recupera a ADR #${adrNum} e navega nas tecnologias e projetos conexos`,
          },
        ],
      }
    }

    if (qLower.includes('adr') || qLower.includes('arquitetura') || qLower.includes('faiss') || qLower.includes('decision')) {
      return {
        query: sanitizedQuery,
        mode: 'knowledge_graph_traversal',
        rootType: 'architectureDecision',
        rootIdentifier: sanitizedQuery,
        sanitized: true,
        plan: [
          {
            tool: 'getArchitectureDecision',
            parameters: { title: sanitizedQuery },
            reason: 'Recupera decisões arquiteturais relacionadas à consulta',
          },
        ],
      }
    }

    // 2. Empresas / Experiências Profissionais
    const companies = ['turno', 'turnoverbnb', 'plugae', 'evoke mobile', 'accenture', 'editora ftd', 'ftd', 'brnow', 'canaoaves']
    for (const comp of companies) {
      if (qLower.includes(comp)) {
        return {
          query: sanitizedQuery,
          mode: 'knowledge_graph_traversal',
          rootType: 'experience',
          rootIdentifier: comp,
          sanitized: true,
          plan: [
            {
              tool: 'getExperience',
              parameters: { company: comp },
              reason: `Recupera a experiência na ${comp}, seus projetos e métricas de impacto`,
            },
          ],
        }
      }
    }

    // 3. Projetos Específicos
    const knownProjects = [
      'ask richter', 'mid-stay', 'midstay', 'aso', 'fanoty', 'spider', 'stock intelligence',
      'sap fiori', 'brnow voice'
    ]
    for (const proj of knownProjects) {
      if (qLower.includes(proj)) {
        return {
          query: sanitizedQuery,
          mode: 'knowledge_graph_traversal',
          rootType: 'project',
          rootIdentifier: proj,
          sanitized: true,
          plan: [
            {
              tool: 'getProject',
              parameters: { name: proj },
              reason: `Recupera o projeto ${proj}, stack técnica e métricas associadas`,
            },
          ],
        }
      }
    }

    // 4. Formação Acadêmica
    if (qLower.includes('faculdade') || qLower.includes('graduação') || qLower.includes('pós-graduação') || qLower.includes('fiap') || qLower.includes('estácio') || qLower.includes('educação') || qLower.includes('education')) {
      return {
        query: sanitizedQuery,
        mode: 'direct_tool_lookup',
        rootType: 'education',
        rootIdentifier: sanitizedQuery,
        sanitized: true,
        plan: [
          {
            tool: 'getEducation',
            parameters: { institution: sanitizedQuery },
            reason: 'Recupera histórico educacional e acadêmico',
          },
        ],
      }
    }

    // 5. Conquistas e Métricas
    if (qLower.includes('métrica') || qLower.includes('conquista') || qLower.includes('impacto') || qLower.includes('resultado') || qLower.includes('achievement')) {
      return {
        query: sanitizedQuery,
        mode: 'knowledge_graph_traversal',
        rootType: 'achievement',
        rootIdentifier: sanitizedQuery,
        sanitized: true,
        plan: [
          {
            tool: 'getAchievement',
            parameters: { title: sanitizedQuery },
            reason: 'Recupera métricas e conquistas mensuráveis de carreira',
          },
        ],
      }
    }

    // 6. Competências / Skills
    return {
      query: sanitizedQuery,
      mode: 'knowledge_graph_traversal',
      rootType: 'skill',
      rootIdentifier: sanitizedQuery,
      sanitized: true,
      plan: [
        {
          tool: 'getSkill',
          parameters: { name: sanitizedQuery },
          reason: 'Recupera informações sobre a habilidade e projetos onde foi aplicada',
        },
      ],
    }
  }

  /**
   * B3: Valida se todas as ferramentas planejadas pertencem à allowlist estrita
   */
  public validatePlan(plan: AgenticPlan): boolean {
    if (!plan.plan || plan.plan.length === 0) return true
    return plan.plan.every((call) => ALLOWED_TOOLS.includes(call.tool))
  }

  /**
   * Executa o plano agêntico aplicando limites estritos (B5, B6, B7, B8, B9, B10, B11, B12, B15)
   */
  public async executePlan(
    plan: AgenticPlan,
    options: { signal?: AbortSignal } = {}
  ): Promise<AgenticExecutionResult> {
    // B3: Rejeição imediata se houver ferramenta fora da allowlist
    if (!this.validatePlan(plan)) {
      return {
        query: plan.query,
        plan,
        graphResult: {
          rootEntity: null,
          evidenceGraph: [],
          totalHops: 0,
          totalCalls: 0,
          formattedContext: '',
          estimatedTokens: 0,
          status: 'retrieval_error',
          abstained: true,
          error: 'Tentativa de execução de ferramenta não autorizada',
        },
        executedCalls: 0,
        provenanceCount: 0,
        formattedContext: '',
        estimatedTokens: 0,
        status: 'retrieval_error',
        abstained: true,
        error: 'Tentativa de execução de ferramenta não autorizada',
      }
    }

    if (plan.mode === 'empty_plan' || !plan.rootType || plan.rootIdentifier === undefined) {
      return {
        query: plan.query,
        plan,
        graphResult: {
          rootEntity: null,
          evidenceGraph: [],
          totalHops: 0,
          totalCalls: 0,
          formattedContext: '',
          estimatedTokens: 0,
          status: 'no_evidence',
          abstained: true,
        },
        executedCalls: 0,
        provenanceCount: 0,
        formattedContext: '',
        estimatedTokens: 0,
        status: 'no_evidence',
        abstained: true,
      }
    }

    // Executa travessia multi-hop através do KnowledgeGraphRetriever com guardas estritas
    const graphResult = await this.graphRetriever.traverseFromEntity(
      plan.rootType,
      plan.rootIdentifier,
      {
        maxHops: this.maxHops,
        maxCalls: this.maxCalls,
        signal: options.signal,
      }
    )

    const provenanceCount = graphResult.evidenceGraph.length
    const formattedContext = graphResult.formattedContext
    const estimatedTokens = estimateTokens(formattedContext)

    return {
      query: plan.query,
      plan,
      graphResult,
      executedCalls: graphResult.totalCalls,
      provenanceCount,
      formattedContext,
      estimatedTokens,
      status: graphResult.status,
      abstained: graphResult.abstained,
      error: graphResult.error,
    }
  }

  /**
   * B14: Sanitiza contra injeções de prompt
   */
  private sanitizeQuery(input: string): string {
    return input
      .replace(/system prompt/gi, '')
      .replace(/ignore (?:all )?previous instructions/gi, '')
      .replace(/drop (?:database|table|collection)/gi, '')
      .replace(/delete from/gi, '')
      .replace(/write to/gi, '')
      .trim()
  }
}
