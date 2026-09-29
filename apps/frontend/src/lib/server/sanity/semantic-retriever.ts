import { SanityServerClient, SanityTimeoutError, SanityRequestError } from './client'
import { CONTEXT_BUDGET_TOKENS, estimateTokens } from './structured-retriever'

export type SemanticSearchMode = 'semantic' | 'keyword' | 'hybrid'

export interface SemanticSearchOptions {
  mode?: SemanticSearchMode
  limit?: number
  types?: string[]
  keywordBoost?: number
}

export interface SemanticRetrievalOutput {
  query: string
  mode: SemanticSearchMode
  matchedCount: number
  rawEntities: any[]
  formattedContext: string
  estimatedTokens: number
  source: 'sanity_content_lake'
  retrievalStatus: 'success' | 'no_evidence' | 'retrieval_error'
  error?: string
}

export const DEFAULT_SEARCH_TYPES = [
  'project',
  'experience',
  'skill',
  'education',
  'achievement',
  'architectureDecision'
]

// -----------------------------------------------------------------------------
// Declarative GROQ Query Builders for Semantic / Keyword / Hybrid
// -----------------------------------------------------------------------------

export function buildSemanticGroq(mode: SemanticSearchMode = 'semantic'): string {
  let scoreClause: string

  switch (mode) {
    case 'keyword':
      scoreClause = `score([name, title, company, summary, description, context, decision] match text::query($query))`
      break
    case 'hybrid':
      scoreClause = `score(boost([name, title, company] match text::query($query), $keywordBoost), text::semanticSimilarity($query))`
      break
    case 'semantic':
    default:
      scoreClause = `score(text::semanticSimilarity($query))`
      break
  }

  return `*[_type in $types]
    | ${scoreClause}
    | order(_score desc)[0...$limit] {
      _id,
      _type,
      _score,
      name,
      title,
      company,
      role,
      category,
      level,
      status,
      summary,
      description,
      architecture,
      challenges,
      storytelling,
      responsibilities,
      rolesPerformed,
      context,
      decision,
      rationale,
      consequences,
      institution,
      degree,
      coursework,
      "technologies": technologies[]->name,
      "experience": experience->company,
      "project": project->name,
      "skills": skills[]->name
    }`
}

export function formatSemanticEntity(entity: any, index: number): string {
  if (!entity) return ''

  const type = entity._type || 'document'
  const scoreStr = typeof entity._score === 'number' ? ` [Score Relativo: ${entity._score.toFixed(3)}]` : ''
  let formatted = `### #${index + 1} [Tipo: ${type.toUpperCase()}]${scoreStr}\n`

  switch (type) {
    case 'project':
      formatted += `- Nome: **${entity.name || 'Sem nome'}**\n`
      if (entity.category) formatted += `- Categoria: ${entity.category}\n`
      if (entity.status) formatted += `- Status: ${entity.status}\n`
      if (entity.experience) formatted += `- Empresa / Experiência: ${entity.experience}\n`
      if (entity.technologies && entity.technologies.length > 0) {
        formatted += `- Tecnologias: ${entity.technologies.join(', ')}\n`
      }
      if (entity.summary) formatted += `- Resumo: ${entity.summary}\n`
      if (entity.architecture) formatted += `- Arquitetura: ${entity.architecture}\n`
      if (entity.challenges && entity.challenges.length > 0) {
        formatted += `- Desafios & Soluções:\n`
        for (const c of entity.challenges) {
          formatted += `  * Desafio: ${c.challenge} | Solução: ${c.solution}${c.result ? ` | Resultado: ${c.result}` : ''}\n`
        }
      }
      break

    case 'experience':
      formatted += `- Empresa: **${entity.company || 'Empresa'}** | Cargo: ${entity.role || 'Cargo N/D'}\n`
      if (entity.summary) formatted += `- Resumo: ${entity.summary}\n`
      if (entity.storytelling) {
        formatted += `- Storytelling (STAR):\n`
        if (entity.storytelling.situation) formatted += `  * Situação: ${entity.storytelling.situation}\n`
        if (entity.storytelling.action) formatted += `  * Ação: ${entity.storytelling.action}\n`
        if (entity.storytelling.result) formatted += `  * Resultado: ${entity.storytelling.result}\n`
      }
      if (entity.responsibilities && entity.responsibilities.length > 0) {
        formatted += `- Responsabilidades:\n`
        for (const r of entity.responsibilities) formatted += `  * ${r}\n`
      }
      if (entity.technologies && entity.technologies.length > 0) {
        formatted += `- Tecnologias: ${entity.technologies.join(', ')}\n`
      }
      break

    case 'skill':
      formatted += `- Habilidade: **${entity.name}** [${entity.category || 'Geral'}] — Nível: ${entity.level || 'Praticante'}\n`
      if (entity.description) formatted += `- Descrição: ${entity.description}\n`
      break

    case 'education':
      formatted += `- Formação / Curso: **${entity.degree || entity.institution}**\n`
      if (entity.institution) formatted += `- Instituição: ${entity.institution}\n`
      if (entity.description) formatted += `- Descrição: ${entity.description}\n`
      if (entity.coursework && entity.coursework.length > 0) {
        formatted += `- Tópicos: ${entity.coursework.join(', ')}\n`
      }
      break

    case 'achievement':
      formatted += `- Conquista / Métrica: **${entity.title}**\n`
      if (entity.category) formatted += `- Categoria: ${entity.category}\n`
      if (entity.context) formatted += `- Contexto & Impacto: ${entity.context}\n`
      if (entity.experience) formatted += `- Empresa Relacionada: ${entity.experience}\n`
      break

    case 'architectureDecision':
      formatted += `- Decisão Arquitetural (ADR): **${entity.title}**\n`
      if (entity.context) formatted += `- Contexto: ${entity.context}\n`
      if (entity.decision) formatted += `- Decisão: ${entity.decision}\n`
      if (entity.rationale) formatted += `- Racional: ${entity.rationale}\n`
      if (entity.consequences) formatted += `- Consequências: ${entity.consequences}\n`
      break

    default:
      if (entity.name || entity.title) formatted += `- Título: **${entity.name || entity.title}**\n`
      if (entity.summary || entity.description) formatted += `- Detalhes: ${entity.summary || entity.description}\n`
      break
  }

  formatted += `\n`
  return formatted
}

export function formatSemanticResultsContext(
  results: any[],
  mode: SemanticSearchMode,
  budgetTokens: number = CONTEXT_BUDGET_TOKENS
): string {
  if (!results || results.length === 0) {
    return ''
  }

  const header = `[EVIDÊNCIA SEMÂNTICA - SANITY CONTENT LAKE]\nMODO DE BUSCA: ${mode.toUpperCase()}\nTOTAL DE ENTIDADES RECUPERADAS: ${results.length}\n\n`
  let accumulated = header
  let validCount = 0

  for (let i = 0; i < results.length; i++) {
    const formattedItem = formatSemanticEntity(results[i], i)
    const projectedTokens = estimateTokens(accumulated + formattedItem)

    if (projectedTokens > budgetTokens) {
      if (validCount === 0) {
        accumulated += formattedItem.slice(0, budgetTokens * 4 - 50) + '\n...[TRUNCADO POR LIMITE DE CONTEXTO]\n'
      }
      break
    }

    accumulated += formattedItem
    validCount++
  }

  return accumulated.trim()
}

// -----------------------------------------------------------------------------
// Semantic Retriever Class
// -----------------------------------------------------------------------------

export class SemanticRetriever {
  private client: SanityServerClient

  constructor(options?: { client?: SanityServerClient }) {
    this.client = options?.client || new SanityServerClient()
  }

  async search(query: string, options?: SemanticSearchOptions): Promise<SemanticRetrievalOutput> {
    const trimmedQuery = (query || '').trim()
    const mode = options?.mode || 'semantic'
    const limit = Math.max(1, Math.min(options?.limit || 5, 10))
    const types = options?.types || DEFAULT_SEARCH_TYPES
    const keywordBoost = typeof options?.keywordBoost === 'number' ? options.keywordBoost : 0.5

    if (!trimmedQuery) {
      return {
        query: '',
        mode,
        matchedCount: 0,
        rawEntities: [],
        formattedContext: '',
        estimatedTokens: 0,
        source: 'sanity_content_lake',
        retrievalStatus: 'no_evidence'
      }
    }

    const groq = buildSemanticGroq(mode)
    const params: Record<string, any> = {
      query: trimmedQuery,
      limit,
      types
    }
    if (mode === 'hybrid') {
      params.keywordBoost = keywordBoost
    }

    try {
      const rawResults = await this.client.fetch(groq, params)
      const validResults = Array.isArray(rawResults) ? rawResults : []

      if (validResults.length === 0) {
        return {
          query: trimmedQuery,
          mode,
          matchedCount: 0,
          rawEntities: [],
          formattedContext: '',
          estimatedTokens: 0,
          source: 'sanity_content_lake',
          retrievalStatus: 'no_evidence'
        }
      }

      const formattedContext = formatSemanticResultsContext(validResults, mode, CONTEXT_BUDGET_TOKENS)
      const estimatedTokens = estimateTokens(formattedContext)

      return {
        query: trimmedQuery,
        mode,
        matchedCount: validResults.length,
        rawEntities: validResults,
        formattedContext,
        estimatedTokens,
        source: 'sanity_content_lake',
        retrievalStatus: 'success'
      }
    } catch (err: any) {
      return {
        query: trimmedQuery,
        mode,
        matchedCount: 0,
        rawEntities: [],
        formattedContext: '',
        estimatedTokens: 0,
        source: 'sanity_content_lake',
        retrievalStatus: 'retrieval_error',
        error: err?.message || String(err)
      }
    }
  }

  /**
   * Avaliação empírica paralela de estratégias (semantic vs keyword vs hybrid).
   */
  async evaluateStrategies(query: string, limit: number = 5): Promise<{
    semantic: SemanticRetrievalOutput
    keyword: SemanticRetrievalOutput
    hybrid: SemanticRetrievalOutput
  }> {
    const [semantic, keyword, hybrid] = await Promise.all([
      this.search(query, { mode: 'semantic', limit }),
      this.search(query, { mode: 'keyword', limit }),
      this.search(query, { mode: 'hybrid', limit, keywordBoost: 0.5 })
    ])
    return { semantic, keyword, hybrid }
  }
}
