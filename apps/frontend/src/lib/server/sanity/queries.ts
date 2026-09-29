export type StructuredIntent =
  | 'LIST_PROJECTS'
  | 'SKILLS_MATRIX'
  | 'PROJECT_BY_TECH'
  | 'CAREER_TIMELINE'
  | 'EDUCATION_CERTS'
  | 'PROVEN_IMPACT'
  | 'ADR_GOVERNANCE'

export interface ParameterizedQueryDef {
  intent: StructuredIntent
  groq: string
  validateParams: (params: Record<string, any>) => Record<string, any>
}

// -----------------------------------------------------------------------------
// Declarative GROQ Queries (Static Templates - Zero String Interpolation)
// -----------------------------------------------------------------------------

export const GROQ_LIST_PROJECTS = `*[_type == "project"] | order(status asc, name asc) {
  _id,
  name,
  slug,
  category,
  status,
  summary,
  repositoryUrl,
  liveUrl,
  "experience": experience->company,
  "technologies": technologies[]->name
}`

export const GROQ_SKILLS_MATRIX = `*[_type == "skill" && (!defined($category) || category == $category)] | order(category asc, level desc, name asc) {
  _id,
  name,
  slug,
  category,
  level,
  description
}`

export const GROQ_PROJECT_BY_TECH = `*[_type == "project" && length($techSlugs) > 0 && count((technologies[]->slug.current)[@ in $techSlugs]) == count($techSlugs)] | order(status asc, name asc) {
  _id,
  name,
  slug,
  category,
  status,
  summary,
  architecture,
  challenges,
  "technologies": technologies[]->name,
  "experience": experience->company
}`

export const GROQ_CAREER_TIMELINE = `*[_type == "experience" && (!defined($company) || company match $company)] | order(startDate desc) {
  _id,
  company,
  role,
  location,
  employmentType,
  startDate,
  endDate,
  isCurrent,
  summary,
  storytelling,
  responsibilities,
  rolesPerformed,
  "technologies": technologies[]->name
}`

export const GROQ_EDUCATION_CERTS = `*[_type == "education"] | order(endDate desc, startDate desc) {
  _id,
  institution,
  degree,
  type,
  startDate,
  endDate,
  credentialUrl,
  description,
  coursework,
  "skills": skills[]->name
}`

export const GROQ_PROVEN_IMPACT = `*[_type == "achievement" && (!defined($category) || category == $category)] | order(title asc) {
  _id,
  title,
  metric,
  category,
  context,
  "experience": experience->company,
  "project": project->name
}`

export const GROQ_ADR_GOVERNANCE = `*[_type == "architectureDecision" && (!defined($adrNumber) || adrNumber == $adrNumber)] | order(adrNumber asc) {
  _id,
  adrNumber,
  title,
  status,
  date,
  context,
  decision,
  rationale,
  consequences,
  "technologies": technologies[]->name
}`

export const STRUCTURED_QUERIES: Record<StructuredIntent, ParameterizedQueryDef> = {
  LIST_PROJECTS: {
    intent: 'LIST_PROJECTS',
    groq: GROQ_LIST_PROJECTS,
    validateParams: () => ({}),
  },
  SKILLS_MATRIX: {
    intent: 'SKILLS_MATRIX',
    groq: GROQ_SKILLS_MATRIX,
    validateParams: (params) => {
      const category = params?.category
      if (category !== undefined && category !== null && typeof category !== 'string') {
        throw new Error(`Invalid category parameter: expected string, got ${typeof category}`)
      }
      return { category: category ?? null }
    },
  },
  PROJECT_BY_TECH: {
    intent: 'PROJECT_BY_TECH',
    groq: GROQ_PROJECT_BY_TECH,
    validateParams: (params) => {
      let techSlugs = params?.techSlugs
      if (typeof params?.technology === 'string') {
        techSlugs = [params.technology.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')]
      } else if (Array.isArray(params?.technologies)) {
        techSlugs = params.technologies.map((t: string) =>
          typeof t === 'string' ? t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : ''
        ).filter(Boolean)
      } else if (!Array.isArray(techSlugs)) {
        techSlugs = []
      }
      return { techSlugs }
    },
  },
  CAREER_TIMELINE: {
    intent: 'CAREER_TIMELINE',
    groq: GROQ_CAREER_TIMELINE,
    validateParams: (params) => {
      const company = params?.company
      if (company !== undefined && company !== null && typeof company !== 'string') {
        throw new Error(`Invalid company parameter: expected string, got ${typeof company}`)
      }
      return { company: company ? `*${company}*` : null }
    },
  },
  EDUCATION_CERTS: {
    intent: 'EDUCATION_CERTS',
    groq: GROQ_EDUCATION_CERTS,
    validateParams: () => ({}),
  },
  PROVEN_IMPACT: {
    intent: 'PROVEN_IMPACT',
    groq: GROQ_PROVEN_IMPACT,
    validateParams: (params) => {
      const category = params?.category
      if (category !== undefined && category !== null && typeof category !== 'string') {
        throw new Error(`Invalid category parameter: expected string, got ${typeof category}`)
      }
      return { category: category ?? null }
    },
  },
  ADR_GOVERNANCE: {
    intent: 'ADR_GOVERNANCE',
    groq: GROQ_ADR_GOVERNANCE,
    validateParams: (params) => {
      let adrNumber = params?.adrNumber
      if (adrNumber !== undefined && adrNumber !== null) {
        adrNumber = Number(adrNumber)
        if (isNaN(adrNumber) || !Number.isInteger(adrNumber) || adrNumber <= 0) {
          throw new Error(`Invalid adrNumber parameter: expected positive integer, got ${params.adrNumber}`)
        }
      }
      return { adrNumber: adrNumber ?? null }
    },
  },
}

/**
 * Detecta se a pergunta do usuário mapeia para uma intenção estruturada suportada pelo Sanity.
 * Retorna null para perguntas livres/não-estruturadas, direcionando-as ao RAG híbrido existente.
 */
export function detectStructuredIntent(
  query: string,
  queryPlan?: { type?: string; payload?: { technologies?: string[]; technology?: string } }
): { intent: StructuredIntent; params: Record<string, any> } | null {
  const lower = (query || '').toLowerCase()

  // 1. Projetos por Tecnologia (Prioridade quando há tecnologias explícitas na pergunta)
  if (queryPlan?.type === 'PROJECT_TECHNOLOGY_SEARCH') {
    const techs = queryPlan.payload?.technologies || (queryPlan.payload?.technology ? [queryPlan.payload.technology] : [])
    if (techs.length > 0) {
      return { intent: 'PROJECT_BY_TECH', params: { technologies: techs } }
    }
  }

  const knownTechs = [
    'laravel', 'lumen', 'php', 'typescript', 'javascript', 'python', 'vue', 'vue.js', 'vuejs',
    'react', 'next.js', 'nextjs', 'docker', 'redis', 'mongodb', 'mysql', 'postgresql',
    'supabase', 'sanity', 'rag', 'langchain', 'c#', 'sql server'
  ]
  if (lower.includes('projetos') || lower.includes('projeto')) {
    const techMatches: string[] = []
    for (const t of knownTechs) {
      // Regex boundary para evitar match parcial
      const regex = new RegExp(`\\b${t.replace('.', '\\.')}\\b`, 'i')
      if (regex.test(lower)) {
        techMatches.push(t)
      }
    }
    if (techMatches.length > 0) {
      return { intent: 'PROJECT_BY_TECH', params: { technologies: techMatches } }
    }
  }

  // 2. Catálogo Exaustivo de Projetos (Sem tecnologia específica)
  if (queryPlan?.type === 'LIST_PROJECTS') {
    return { intent: 'LIST_PROJECTS', params: {} }
  }
  const listKeywords = ['listar projetos', 'liste os projetos', 'quais projetos', 'todos os projetos', 'projetos desenvolvidos', 'portfolio de projetos', 'portfólio de projetos']
  if (listKeywords.some((k) => lower.includes(k))) {
    return { intent: 'LIST_PROJECTS', params: {} }
  }

  // 3. Matriz de Skills / Competências Técnicas
  const skillKeywords = ['quais tecnologias', 'quais skills', 'quais linguagens', 'tecnologias que domina', 'stack técnico', 'stack tecnico', 'competências técnicas', 'competencias tecnicas', 'habilidades técnicas', 'habilidades tecnicas']
  if (skillKeywords.some((k) => lower.includes(k))) {
    return { intent: 'SKILLS_MATRIX', params: {} }
  }

  // 4. Linha do Tempo e Experiências Profissionais
  const careerKeywords = ['trajetória profissional', 'trajetoria profissional', 'histórico profissional', 'historico profissional', 'onde trabalhou', 'empresas onde trabalhou', 'experiência profissional', 'experiencia profissional', 'trabalhou na turno', 'trabalhou na accenture', 'trabalhou na full comms', 'trabalhou na evoke']
  if (careerKeywords.some((k) => lower.includes(k))) {
    let company: string | null = null
    if (lower.includes('turno')) company = 'Turno'
    else if (lower.includes('accenture')) company = 'Accenture'
    else if (lower.includes('full comms')) company = 'Full Comms'
    else if (lower.includes('evoke')) company = 'Evoke'
    else if (lower.includes('ftd')) company = 'Editora FTD'
    else if (lower.includes('plugae')) company = 'Plugae'
    return { intent: 'CAREER_TIMELINE', params: { company } }
  }

  // 5. Educação e Certificações
  const eduKeywords = ['formação acadêmica', 'formacao academica', 'graduação', 'graduacao', 'pós-graduação', 'pos-graduacao', 'certificações', 'certificacoes', 'cursos concluídos', 'faculdade']
  if (eduKeywords.some((k) => lower.includes(k))) {
    return { intent: 'EDUCATION_CERTS', params: {} }
  }

  // 6. Impacto e Métricas Comprovadas
  const impactKeywords = ['principais métricas', 'principais metricas', 'impacto gerado', 'resultados alcançados', 'cases de sucesso', 'ganho de performance', 'otimizações de impacto']
  if (impactKeywords.some((k) => lower.includes(k))) {
    return { intent: 'PROVEN_IMPACT', params: {} }
  }

  // 7. Decisões Arquiteturais e Governança (ADRs)
  const adrKeywords = ['decisões de arquitetura', 'decisoes de arquitetura', 'adr', 'adrs', 'protocolo jidoka', 'meta spec', 'governança de arquitetura']
  if (adrKeywords.some((k) => lower.includes(k))) {
    const adrMatch = lower.match(/adr[-\s]?0*([1-9])/i)
    const adrNumber = adrMatch ? parseInt(adrMatch[1], 10) : null
    return { intent: 'ADR_GOVERNANCE', params: { adrNumber } }
  }

  return null
}
