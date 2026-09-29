import { SanityServerClient } from './client'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

export type SanityDocumentType =
  | 'project'
  | 'experience'
  | 'skill'
  | 'education'
  | 'achievement'
  | 'architectureDecision'

export const ALLOWED_TOOLS = [
  'getProject',
  'getExperience',
  'getSkill',
  'getEducation',
  'getAchievement',
  'getArchitectureDecision',
] as const

export type AllowedToolName = (typeof ALLOWED_TOOLS)[number]

export const MAX_TOOL_HOPS = 2
export const MAX_TOOL_CALLS = 4
export const GLOBAL_TIMEOUT_MS = 4000

export interface GraphEvidenceItem {
  documentId: string
  documentType: SanityDocumentType
  source: 'sanity'
  hop: number
  relation?: string
  data: Record<string, any>
}

export interface GraphTraversalResult {
  rootEntity: GraphEvidenceItem | null
  evidenceGraph: GraphEvidenceItem[]
  totalHops: number
  totalCalls: number
  formattedContext: string
  estimatedTokens: number
  status: 'success' | 'no_evidence' | 'retrieval_error'
  abstained: boolean
  error?: string
}

export interface KnowledgeGraphRetrieverOptions {
  client?: SanityServerClient
  maxHops?: number
  maxCalls?: number
  globalTimeoutMs?: number
}

export class KnowledgeGraphRetriever {
  private readonly client: SanityServerClient
  private readonly maxHops: number
  private readonly maxCalls: number
  private readonly globalTimeoutMs: number

  constructor(options: KnowledgeGraphRetrieverOptions = {}) {
    this.client = options.client || new SanityServerClient()
    this.maxHops = options.maxHops ?? MAX_TOOL_HOPS
    this.maxCalls = options.maxCalls ?? MAX_TOOL_CALLS
    this.globalTimeoutMs = options.globalTimeoutMs ?? GLOBAL_TIMEOUT_MS
  }

  /**
   * Tool Registry Read-Only: Consulta de Projeto
   */
  public async getProject(
    params: { id?: string; name?: string; slug?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "project" && _id == $id][0]{
        _id, _type, name, category, status, summary, description, architecture, challenges,
        experience, technologies, repositoryUrl, liveUrl, legacySourceId, legacyFile
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.name) {
      const query = `*[_type == "project" && name match $name][0]{
        _id, _type, name, category, status, summary, description, architecture, challenges,
        experience, technologies, repositoryUrl, liveUrl, legacySourceId, legacyFile
      }`
      return this.client.fetch(query, { name: `*${params.name}*` }, options)
    }
    if (params.slug) {
      const query = `*[_type == "project" && slug.current == $slug][0]{
        _id, _type, name, category, status, summary, description, architecture, challenges,
        experience, technologies, repositoryUrl, liveUrl, legacySourceId, legacyFile
      }`
      return this.client.fetch(query, { slug: params.slug }, options)
    }
    return null
  }

  /**
   * Tool Registry Read-Only: Consulta de Experiência Profissional
   */
  public async getExperience(
    params: { id?: string; company?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "experience" && _id == $id][0]{
        _id, _type, company, role, location, employmentType, startDate, endDate, isCurrent,
        summary, storytelling, responsibilities, rolesPerformed, technologies, legacySourceId
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.company) {
      const query = `*[_type == "experience" && company match $company][0]{
        _id, _type, company, role, location, employmentType, startDate, endDate, isCurrent,
        summary, storytelling, responsibilities, rolesPerformed, technologies, legacySourceId
      }`
      return this.client.fetch(query, { company: `*${params.company}*` }, options)
    }
    return null
  }

  /**
   * Tool Registry Read-Only: Consulta de Skill
   */
  public async getSkill(
    params: { id?: string; name?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "skill" && _id == $id][0]{
        _id, _type, name, category, level, description, legacySourceId
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.name) {
      const query = `*[_type == "skill" && name match $name][0]{
        _id, _type, name, category, level, description, legacySourceId
      }`
      return this.client.fetch(query, { name: `*${params.name}*` }, options)
    }
    return null
  }

  /**
   * Tool Registry Read-Only: Consulta de Formação Acadêmica
   */
  public async getEducation(
    params: { id?: string; institution?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "education" && _id == $id][0]{
        _id, _type, institution, degree, fieldOfStudy, startDate, endDate, description, coursework
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.institution) {
      const query = `*[_type == "education" && institution match $institution][0]{
        _id, _type, institution, degree, fieldOfStudy, startDate, endDate, description, coursework
      }`
      return this.client.fetch(query, { institution: `*${params.institution}*` }, options)
    }
    return null
  }

  /**
   * Tool Registry Read-Only: Consulta de Conquistas & Métricas (Achievement)
   */
  public async getAchievement(
    params: { id?: string; title?: string; category?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "achievement" && _id == $id][0]{
        _id, _type, title, metric, category, context, experience, project, legacySourceId
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.title) {
      const query = `*[_type == "achievement" && title match $title][0]{
        _id, _type, title, metric, category, context, experience, project, legacySourceId
      }`
      return this.client.fetch(query, { title: `*${params.title}*` }, options)
    }
    if (params.category) {
      const query = `*[_type == "achievement" && category == $category][0]{
        _id, _type, title, metric, category, context, experience, project, legacySourceId
      }`
      return this.client.fetch(query, { category: params.category }, options)
    }
    return null
  }

  /**
   * Tool Registry Read-Only: Consulta de Decisão Arquitetural (ADR)
   */
  public async getArchitectureDecision(
    params: { id?: string; adrNumber?: number; title?: string },
    options: { signal?: AbortSignal } = {}
  ): Promise<Record<string, any> | null> {
    if (params.id) {
      const query = `*[_type == "architectureDecision" && _id == $id][0]{
        _id, _type, adrNumber, title, status, date, context, decision, rationale, consequences, technologies
      }`
      return this.client.fetch(query, { id: params.id }, options)
    }
    if (params.adrNumber !== undefined) {
      const query = `*[_type == "architectureDecision" && adrNumber == $adrNumber][0]{
        _id, _type, adrNumber, title, status, date, context, decision, rationale, consequences, technologies
      }`
      return this.client.fetch(query, { adrNumber: Number(params.adrNumber) }, options)
    }
    if (params.title) {
      const query = `*[_type == "architectureDecision" && title match $title][0]{
        _id, _type, adrNumber, title, status, date, context, decision, rationale, consequences, technologies
      }`
      return this.client.fetch(query, { title: `*${params.title}*` }, options)
    }
    return null
  }

  /**
   * Executa travessia determinística no Grafo de Conhecimento a partir de uma entidade raiz.
   */
  public async traverseFromEntity(
    rootType: SanityDocumentType,
    identifier: string | number,
    options: { maxHops?: number; maxCalls?: number; signal?: AbortSignal } = {}
  ): Promise<GraphTraversalResult> {
    const controller = new AbortController()
    const effectiveHops = Math.min(options.maxHops ?? this.maxHops, MAX_TOOL_HOPS)
    const effectiveCalls = Math.min(options.maxCalls ?? this.maxCalls, MAX_TOOL_CALLS)

    const timeoutId = setTimeout(() => controller.abort(), this.globalTimeoutMs)

    // Unifica o sinal de cancelamento externo com o timeout global
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort())
    }

    const visitedIds = new Set<string>()
    const evidenceGraph: GraphEvidenceItem[] = []
    let totalCalls = 0
    let currentHop = 0

    try {
      // Hop 0: Busca a entidade raiz
      totalCalls++
      let rootData: Record<string, any> | null = null

      if (rootType === 'project') {
        rootData = typeof identifier === 'string' && identifier.startsWith('proj-')
          ? await this.getProject({ id: identifier }, { signal: controller.signal })
          : await this.getProject({ name: String(identifier) }, { signal: controller.signal })
      } else if (rootType === 'experience') {
        rootData = typeof identifier === 'string' && identifier.startsWith('exp-')
          ? await this.getExperience({ id: identifier }, { signal: controller.signal })
          : await this.getExperience({ company: String(identifier) }, { signal: controller.signal })
      } else if (rootType === 'architectureDecision') {
        rootData = typeof identifier === 'number' || (!isNaN(Number(identifier)) && !String(identifier).startsWith('adr-'))
          ? await this.getArchitectureDecision({ adrNumber: Number(identifier) }, { signal: controller.signal })
          : (typeof identifier === 'string' && identifier.startsWith('adr-'))
            ? await this.getArchitectureDecision({ id: identifier }, { signal: controller.signal })
            : await this.getArchitectureDecision({ title: String(identifier) }, { signal: controller.signal })
      } else if (rootType === 'skill') {
        rootData = typeof identifier === 'string' && identifier.startsWith('skill-')
          ? await this.getSkill({ id: identifier }, { signal: controller.signal })
          : await this.getSkill({ name: String(identifier) }, { signal: controller.signal })
      } else if (rootType === 'education') {
        rootData = typeof identifier === 'string' && identifier.startsWith('edu-')
          ? await this.getEducation({ id: identifier }, { signal: controller.signal })
          : await this.getEducation({ institution: String(identifier) }, { signal: controller.signal })
      } else if (rootType === 'achievement') {
        rootData = typeof identifier === 'string' && identifier.startsWith('ach-')
          ? await this.getAchievement({ id: identifier }, { signal: controller.signal })
          : await this.getAchievement({ title: String(identifier) }, { signal: controller.signal })
      }

      if (!rootData || !rootData._id) {
        clearTimeout(timeoutId)
        return {
          rootEntity: null,
          evidenceGraph: [],
          totalHops: 0,
          totalCalls,
          formattedContext: '',
          estimatedTokens: 0,
          status: 'no_evidence',
          abstained: true,
        }
      }

      const rootItem: GraphEvidenceItem = {
        documentId: rootData._id,
        documentType: rootData._type as SanityDocumentType,
        source: 'sanity',
        hop: 0,
        data: rootData,
      }

      visitedIds.add(rootData._id)
      evidenceGraph.push(rootItem)

      // Hop 1: Expansão de referências diretas
      if (effectiveHops >= 1 && totalCalls < effectiveCalls) {
        currentHop = 1
        const hop1Items = await this.expandHop1(rootItem, visitedIds, controller.signal)
        for (const item of hop1Items) {
          if (totalCalls >= effectiveCalls) break
          totalCalls++
          visitedIds.add(item.documentId)
          evidenceGraph.push(item)
        }
      }

      // Hop 2: Expansão de segundo nível (conquistas ou entidades conexas)
      if (effectiveHops >= 2 && totalCalls < effectiveCalls) {
        currentHop = 2
        const hop1ItemsInGraph = evidenceGraph.filter((item) => item.hop === 1)
        for (const parentItem of hop1ItemsInGraph) {
          if (totalCalls >= effectiveCalls) break
          const hop2Items = await this.expandHop2(parentItem, visitedIds, controller.signal)
          for (const item of hop2Items) {
            if (totalCalls >= effectiveCalls) break
            totalCalls++
            visitedIds.add(item.documentId)
            evidenceGraph.push(item)
          }
        }
      }

      clearTimeout(timeoutId)

      const formattedContext = this.formatEvidenceGraph(evidenceGraph)
      const estimatedTokens = estimateTokens(formattedContext)

      return {
        rootEntity: rootItem,
        evidenceGraph,
        totalHops: currentHop,
        totalCalls,
        formattedContext,
        estimatedTokens,
        status: 'success',
        abstained: false,
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      return {
        rootEntity: null,
        evidenceGraph: [],
        totalHops: currentHop,
        totalCalls,
        formattedContext: '',
        estimatedTokens: 0,
        status: 'retrieval_error',
        abstained: true,
        error: err?.message || String(err),
      }
    }
  }

  /**
   * Expansão Hop 1: Resolve referências imediatas da raiz
   */
  private async expandHop1(
    root: GraphEvidenceItem,
    visitedIds: Set<string>,
    signal: AbortSignal
  ): Promise<GraphEvidenceItem[]> {
    const results: GraphEvidenceItem[] = []

    if (root.documentType === 'project') {
      // 1. Resolve experiência associada
      const expRef = root.data.experience?._ref
      if (expRef && !visitedIds.has(expRef)) {
        const expData = await this.getExperience({ id: expRef }, { signal })
        if (expData) {
          results.push({
            documentId: expData._id,
            documentType: 'experience',
            source: 'sanity',
            hop: 1,
            relation: 'developed_during_experience',
            data: expData,
          })
        }
      }

      // 2. Resolve tecnologias/skills associadas
      if (Array.isArray(root.data.technologies)) {
        for (const tech of root.data.technologies.slice(0, 3)) {
          const techRef = tech?._ref
          if (techRef && !visitedIds.has(techRef)) {
            const skillData = await this.getSkill({ id: techRef }, { signal })
            if (skillData) {
              results.push({
                documentId: skillData._id,
                documentType: 'skill',
                source: 'sanity',
                hop: 1,
                relation: 'uses_technology',
                data: skillData,
              })
            }
          }
        }
      }
    } else if (root.documentType === 'experience') {
      // 1. Resolve projetos desenvolvidos na empresa
      const query = `*[_type == "project" && experience._ref == $id]{
        _id, _type, name, category, summary, architecture
      }[0..2]`
      const projects = await this.client.fetch(query, { id: root.documentId }, { signal })
      if (Array.isArray(projects)) {
        for (const p of projects) {
          if (!visitedIds.has(p._id)) {
            results.push({
              documentId: p._id,
              documentType: 'project',
              source: 'sanity',
              hop: 1,
              relation: 'company_project',
              data: p,
            })
          }
        }
      }
    } else if (root.documentType === 'architectureDecision') {
      // 1. Resolve skills relacionadas
      if (Array.isArray(root.data.technologies)) {
        for (const tech of root.data.technologies.slice(0, 2)) {
          const techRef = tech?._ref
          if (techRef && !visitedIds.has(techRef)) {
            const skillData = await this.getSkill({ id: techRef }, { signal })
            if (skillData) {
              results.push({
                documentId: skillData._id,
                documentType: 'skill',
                source: 'sanity',
                hop: 1,
                relation: 'applies_to_technology',
                data: skillData,
              })
            }
          }
        }
      }
    } else if (root.documentType === 'achievement') {
      // Resolve experiência ou projeto de origem
      const expRef = root.data.experience?._ref
      if (expRef && !visitedIds.has(expRef)) {
        const expData = await this.getExperience({ id: expRef }, { signal })
        if (expData) {
          results.push({
            documentId: expData._id,
            documentType: 'experience',
            source: 'sanity',
            hop: 1,
            relation: 'achieved_at_experience',
            data: expData,
          })
        }
      }
    }

    return results
  }

  /**
   * Expansão Hop 2: Resolve conquistas / métricas ou conexões secundárias
   */
  private async expandHop2(
    parent: GraphEvidenceItem,
    visitedIds: Set<string>,
    signal: AbortSignal
  ): Promise<GraphEvidenceItem[]> {
    const results: GraphEvidenceItem[] = []

    if (parent.documentType === 'experience' || parent.documentType === 'project') {
      // Busca conquistas e métricas ligadas a essa entidade
      const query = `*[_type == "achievement" && (experience._ref == $id || project._ref == $id)]{
        _id, _type, title, metric, category, context
      }[0..1]`
      const achievements = await this.client.fetch(query, { id: parent.documentId }, { signal })
      if (Array.isArray(achievements)) {
        for (const ach of achievements) {
          if (!visitedIds.has(ach._id)) {
            results.push({
              documentId: ach._id,
              documentType: 'achievement',
              source: 'sanity',
              hop: 2,
              relation: 'measured_impact',
              data: ach,
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Formata a cadeia de evidências em bloco Markdown com proveniência explícita e orçamento de tokens.
   */
  public formatEvidenceGraph(items: GraphEvidenceItem[]): string {
    if (items.length === 0) {
      return ''
    }

    let buffer = `[EVIDÊNCIA ESTRUTURADA - SANITY KNOWLEDGE GRAPH]\nTOTAL DE NÓS NO GRAFO: ${items.length}\n\n`

    for (const item of items) {
      const hopPrefix = item.hop === 0 ? '● [ROOT]' : `↳ [HOP ${item.hop} | Rel: ${item.relation || 'related'}]`
      buffer += `${hopPrefix} [${item.documentType.toUpperCase()}]: ${item.documentId}\n`

      const d = item.data
      if (item.documentType === 'project') {
        buffer += `  Nome: ${d.name || ''}\n`
        if (d.category) buffer += `  Categoria: ${d.category}\n`
        if (d.summary) buffer += `  Resumo: ${d.summary}\n`
        if (d.architecture) buffer += `  Arquitetura: ${d.architecture}\n`
      } else if (item.documentType === 'experience') {
        buffer += `  Empresa: ${d.company || ''}\n`
        buffer += `  Cargo: ${d.role || ''}\n`
        if (d.summary) buffer += `  Sumário: ${d.summary}\n`
        if (d.storytelling?.result) buffer += `  Impacto: ${d.storytelling.result}\n`
      } else if (item.documentType === 'skill') {
        buffer += `  Skill: ${d.name || ''} (${d.category || 'tech'})\n`
        if (d.level) buffer += `  Nível: ${d.level}\n`
        if (d.description) buffer += `  Descrição: ${d.description}\n`
      } else if (item.documentType === 'architectureDecision') {
        buffer += `  ADR-${d.adrNumber}: ${d.title}\n`
        buffer += `  Status: ${d.status}\n`
        if (d.decision) buffer += `  Decisão: ${d.decision}\n`
        if (d.rationale) buffer += `  Racional: ${d.rationale}\n`
        if (d.consequences) buffer += `  Consequências: ${d.consequences}\n`
      } else if (item.documentType === 'achievement') {
        buffer += `  Conquista: ${d.title}\n`
        buffer += `  Métrica: ${d.metric}\n`
        if (d.context) buffer += `  Contexto: ${d.context}\n`
      } else if (item.documentType === 'education') {
        buffer += `  Instituição: ${d.institution}\n`
        buffer += `  Grau: ${d.degree || ''} em ${d.fieldOfStudy || ''}\n`
      }

      buffer += '\n'
    }

    let formatted = buffer.trim()
    if (estimateTokens(formatted) > CONTEXT_BUDGET_TOKENS) {
      formatted = formatted.slice(0, CONTEXT_BUDGET_TOKENS * 4).trim()
    }

    return formatted
  }
}
