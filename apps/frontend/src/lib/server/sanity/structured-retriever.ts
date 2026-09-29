import { SanityServerClient } from './client'
import { STRUCTURED_QUERIES, StructuredIntent } from './queries'

export const CONTEXT_BUDGET_TOKENS = 2800

/**
 * Estimativa determinística de tokens baseada na regra de 4 caracteres por token.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export type RetrievalStatus = 'success' | 'fallback_success' | 'no_evidence' | 'retrieval_error'

export interface StructuredRetrievalOutput {
  intent: string
  matchedCount: number
  rawEntities: any[]
  formattedContext: string
  estimatedTokens: number
  source: 'sanity_content_lake' | 'fallback_ts_vector_store'
  retrievalStatus: RetrievalStatus
  abstained?: boolean
  error?: string
}

export function formatEntitiesContext(intent: StructuredIntent, entities: any[]): string {
  if (!entities || entities.length === 0) {
    return ''
  }

  let formatted = `[EVIDÊNCIA ESTRUTURADA - SANITY CONTENT LAKE]\nCLASSE DE CONSULTA: ${intent}\nTOTAL DE ENTIDADES RECUPERADAS: ${entities.length}\n\n`

  switch (intent) {
    case 'LIST_PROJECTS':
    case 'PROJECT_BY_TECH': {
      for (const p of entities) {
        formatted += `### PROJETO: ${p.name || 'Sem nome'}\n`
        if (p.category) formatted += `- Categoria: ${p.category}\n`
        if (p.status) formatted += `- Status: ${p.status}\n`
        if (p.experience) formatted += `- Empresa / Experiência: ${p.experience}\n`
        if (p.technologies && p.technologies.length > 0) {
          formatted += `- Tecnologias: ${p.technologies.join(', ')}\n`
        }
        if (p.summary) formatted += `- Resumo: ${p.summary}\n`
        if (p.architecture) formatted += `- Arquitetura: ${p.architecture}\n`
        if (p.challenges && p.challenges.length > 0) {
          formatted += `- Desafios & Soluções:\n`
          for (const c of p.challenges) {
            formatted += `  * Desafio: ${c.challenge} | Solução: ${c.solution}${c.result ? ` | Resultado: ${c.result}` : ''}\n`
          }
        }
        if (p.repositoryUrl) formatted += `- Repositório: ${p.repositoryUrl}\n`
        if (p.liveUrl) formatted += `- Link / Demo: ${p.liveUrl}\n`
        formatted += `\n`
      }
      break
    }

    case 'SKILLS_MATRIX': {
      for (const s of entities) {
        formatted += `- Skill: **${s.name}** [${s.category || 'Geral'}] — Nível: ${s.level || 'Praticante'}`
        if (s.description) formatted += ` | ${s.description}`
        formatted += `\n`
      }
      break
    }

    case 'CAREER_TIMELINE': {
      for (const exp of entities) {
        formatted += `### EMPRESA: ${exp.company || 'Empresa'}\n`
        formatted += `- Cargo: ${exp.role || 'Cargo não especificado'}\n`
        if (exp.location) formatted += `- Localização: ${exp.location}\n`
        if (exp.startDate) formatted += `- Período: ${exp.startDate} até ${exp.isCurrent ? 'Presente' : exp.endDate || 'N/D'}\n`
        if (exp.summary) formatted += `- Resumo Executivo: ${exp.summary}\n`
        if (exp.storytelling) {
          formatted += `- Storytelling (STAR):\n`
          if (exp.storytelling.situation) formatted += `  * Situação: ${exp.storytelling.situation}\n`
          if (exp.storytelling.action) formatted += `  * Ação: ${exp.storytelling.action}\n`
          if (exp.storytelling.result) formatted += `  * Resultado: ${exp.storytelling.result}\n`
        }
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          formatted += `- Responsabilidades:\n`
          for (const r of exp.responsibilities) formatted += `  * ${r}\n`
        }
        if (exp.technologies && exp.technologies.length > 0) {
          formatted += `- Tecnologias Principais: ${exp.technologies.join(', ')}\n`
        }
        formatted += `\n`
      }
      break
    }

    case 'EDUCATION_CERTS': {
      for (const edu of entities) {
        formatted += `### FORMAÇÃO: ${edu.degree || edu.institution}\n`
        formatted += `- Instituição: ${edu.institution}\n`
        formatted += `- Tipo: ${edu.type}\n`
        if (edu.startDate || edu.endDate) formatted += `- Período: ${edu.startDate || ''} até ${edu.endDate || ''}\n`
        if (edu.description) formatted += `- Descrição: ${edu.description}\n`
        if (edu.coursework && edu.coursework.length > 0) {
          formatted += `- Tópicos: ${edu.coursework.join(', ')}\n`
        }
        if (edu.skills && edu.skills.length > 0) {
          formatted += `- Competências Associadas: ${edu.skills.join(', ')}\n`
        }
        formatted += `\n`
      }
      break
    }

    case 'PROVEN_IMPACT': {
      for (const ach of entities) {
        formatted += `### REALIZAÇÃO: ${ach.title}\n`
        formatted += `- Métrica de Impacto: **${ach.metric}**\n`
        if (ach.category) formatted += `- Categoria: ${ach.category}\n`
        if (ach.experience) formatted += `- Empresa Vinculada: ${ach.experience}\n`
        if (ach.project) formatted += `- Projeto Vinculado: ${ach.project}\n`
        if (ach.context) formatted += `- Contexto: ${ach.context}\n`
        formatted += `\n`
      }
      break
    }

    case 'ADR_GOVERNANCE': {
      for (const adr of entities) {
        formatted += `### ADR-${String(adr.adrNumber).padStart(4, '0')}: ${adr.title}\n`
        formatted += `- Status: ${adr.status} | Data: ${adr.date || 'N/D'}\n`
        if (adr.context) formatted += `- Contexto: ${adr.context}\n`
        if (adr.decision) formatted += `- Decisão: ${adr.decision}\n`
        if (adr.rationale) formatted += `- Justificativa: ${adr.rationale}\n`
        if (adr.consequences) formatted += `- Consequências: ${adr.consequences}\n`
        if (adr.technologies && adr.technologies.length > 0) {
          formatted += `- Tecnologias Relacionadas: ${adr.technologies.join(', ')}\n`
        }
        formatted += `\n`
      }
      break
    }

    default:
      formatted += JSON.stringify(entities, null, 2)
  }

  return formatted.trim()
}

/**
 * Poda entidades até que o contexto formatado respeite o CONTEXT_BUDGET_TOKENS.
 */
export function pruneEntitiesToBudget(
  intent: StructuredIntent,
  entities: any[],
  maxTokens = CONTEXT_BUDGET_TOKENS
): { prunedEntities: any[]; formattedContext: string; estimatedTokens: number } {
  let low = 1
  let high = entities.length
  let bestEntities = entities
  let bestFormatted = formatEntitiesContext(intent, entities)
  let bestTokens = estimateTokens(bestFormatted)

  if (bestTokens <= maxTokens) {
    return {
      prunedEntities: bestEntities,
      formattedContext: bestFormatted,
      estimatedTokens: bestTokens,
    }
  }

  // Binary search determinística para encontrar o maior subconjunto ordenado
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const subset = entities.slice(0, mid)
    const formatted = formatEntitiesContext(intent, subset)
    const tokens = estimateTokens(formatted)

    if (tokens <= maxTokens) {
      bestEntities = subset
      bestFormatted = formatted
      bestTokens = tokens
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return {
    prunedEntities: bestEntities,
    formattedContext: bestFormatted,
    estimatedTokens: bestTokens,
  }
}

export class SanityStructuredRetriever {
  private readonly client: SanityServerClient

  constructor(client = new SanityServerClient()) {
    this.client = client
  }

  public async retrieve(
    intent: StructuredIntent,
    rawParams: Record<string, any> = {}
  ): Promise<StructuredRetrievalOutput> {
    const queryDef = STRUCTURED_QUERIES[intent]
    if (!queryDef) {
      throw new Error(`Unsupported structured intent: ${intent}`)
    }

    const validatedParams = queryDef.validateParams(rawParams)
    const rawResult = await this.client.fetch<any[]>(queryDef.groq, validatedParams)
    const entities = Array.isArray(rawResult) ? rawResult : []

    const { prunedEntities, formattedContext, estimatedTokens } = pruneEntitiesToBudget(
      intent,
      entities,
      CONTEXT_BUDGET_TOKENS
    )

    const hasResults = prunedEntities.length > 0

    return {
      intent,
      matchedCount: prunedEntities.length,
      rawEntities: prunedEntities,
      formattedContext,
      estimatedTokens,
      source: 'sanity_content_lake',
      retrievalStatus: hasResults ? 'success' : 'no_evidence',
      abstained: !hasResults,
    }
  }
}
