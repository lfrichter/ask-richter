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

function normalizeQuery(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const KNOWN_TECHNOLOGIES: Array<{ slug: string; name: string }> = [
  { slug: 'laravel', name: 'Laravel' },
  { slug: 'lumen', name: 'Lumen' },
  { slug: 'php', name: 'PHP' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'python', name: 'Python' },
  { slug: 'vue', name: 'Vue' },
  { slug: 'vue.js', name: 'Vue.js' },
  { slug: 'vuejs', name: 'Vue.js' },
  { slug: 'react', name: 'React' },
  { slug: 'react.js', name: 'React' },
  { slug: 'reactjs', name: 'React' },
  { slug: 'next.js', name: 'Next.js' },
  { slug: 'nextjs', name: 'Next.js' },
  { slug: 'docker', name: 'Docker' },
  { slug: 'kubernetes', name: 'Kubernetes' },
  { slug: 'redis', name: 'Redis' },
  { slug: 'mongodb', name: 'MongoDB' },
  { slug: 'mysql', name: 'MySQL' },
  { slug: 'postgresql', name: 'PostgreSQL' },
  { slug: 'sqlite', name: 'SQLite' },
  { slug: 'sql server', name: 'SQL Server' },
  { slug: 'supabase', name: 'Supabase' },
  { slug: 'sanity', name: 'Sanity' },
  { slug: 'rag', name: 'RAG' },
  { slug: 'langchain', name: 'LangChain' },
  { slug: 'langchain.js', name: 'LangChain.js' },
  { slug: 'c#', name: 'C#' },
  { slug: 'aws', name: 'AWS' },
  { slug: 'gcp', name: 'GCP' },
  { slug: 'fastapi', name: 'FastAPI' },
  { slug: 'node.js', name: 'Node.js' },
  { slug: 'nodejs', name: 'Node.js' },
  { slug: 'express', name: 'Express' },
  { slug: 'livekit', name: 'LiveKit' },
  { slug: 'webrtc', name: 'WebRTC' },
  { slug: 'ollama', name: 'Ollama' },
  { slug: 'faiss', name: 'FAISS' },
  { slug: 'openai', name: 'OpenAI' },
  { slug: 'hugging face', name: 'Hugging Face' },
  { slug: 'git', name: 'Git' },
  { slug: 'github actions', name: 'GitHub Actions' },
  { slug: 'jenkins', name: 'Jenkins' },
  { slug: 'bitbucket pipelines', name: 'Bitbucket Pipelines' }
]

/**
 * Detecta se a pergunta do usuário mapeia para uma intenção estruturada suportada pelo Sanity.
 * Retorna null para perguntas livres/não-estruturadas, direcionando-as ao RAG híbrido existente.
 */
export function detectStructuredIntent(
  query: string,
  queryPlan?: { type?: string; payload?: { technologies?: string[]; technology?: string } }
): { intent: StructuredIntent; params: Record<string, any> } | null {
  const normalized = normalizeQuery(query)
  if (!normalized) return null

  // 1. Decisões Arquiteturais e Governança (ADRs)
  const isAdrQuery =
    /\badr[-\s]?0*([1-9]\d*)\b/i.test(normalized) ||
    /\bdecis(ao|oes)\s+(de\s+)?arquitetura(l|is)?\b/i.test(normalized) ||
    /\bprotocolo\s+jidoka\b/i.test(normalized) ||
    /\bgovernanca\s+de\s+arquitetura\b/i.test(normalized) ||
    /\bmeta\s+spec\b/i.test(normalized)

  if (isAdrQuery) {
    const adrMatch = normalized.match(/adr[-\s]?0*([1-9]\d*)/i)
    const adrNumber = adrMatch && adrMatch[1] ? parseInt(adrMatch[1], 10) : null
    return { intent: 'ADR_GOVERNANCE', params: { adrNumber } }
  }

  // 2. Projetos por Tecnologia (Prioridade quando há tecnologias explícitas na pergunta e intenção de projeto)
  if (queryPlan?.type === 'PROJECT_TECHNOLOGY_SEARCH') {
    const techs = queryPlan.payload?.technologies || (queryPlan.payload?.technology ? [queryPlan.payload.technology] : [])
    if (techs.length > 0) {
      return { intent: 'PROJECT_BY_TECH', params: { technologies: techs } }
    }
  }

  const techMatches: string[] = []
  for (const t of KNOWN_TECHNOLOGIES) {
    const regex = new RegExp(`(^|[^a-z0-9#])${t.slug.replace('.', '\\.')}(?=$|[^a-z0-9#])`, 'i')
    if (regex.test(normalized)) {
      if (!techMatches.includes(t.name)) {
        techMatches.push(t.name)
      }
    }
  }

  const hasProjectContext =
    /\b(projeto|projetos|project|projects|proyecto|proyectos)\b/i.test(normalized) ||
    /\b(desenvolveu|criou|construiu|atuou|trabalhou|developed|created|built|worked\s+on|worked\s+with|desarrollo|creo|construyo|trabajo)\b/i.test(normalized)

  if (techMatches.length > 0 && hasProjectContext) {
    return { intent: 'PROJECT_BY_TECH', params: { technologies: techMatches } }
  }

  // 3. Catálogo Exaustivo de Projetos (Sem tecnologia específica)
  if (queryPlan?.type === 'LIST_PROJECTS') {
    return { intent: 'LIST_PROJECTS', params: {} }
  }

  // Anti-greedy guards: não interceptar consultas relacionais, comparativas ou ordinais/únicas como catálogo
  const isOrdinalOrRelational =
    /\b(primeiro|ultimo|first|last|primer|unico|single)\s+(projeto|project|proyecto)\b/i.test(normalized) ||
    /\b(conectam|conectan|connect|relaciona|relacao|relationship)\b/i.test(normalized)

  const isListProjectsQuery =
    !isOrdinalOrRelational &&
    (/\b(quais|qual|listar|liste|lista|mostre|me mostre|ver|exibir)\s+(sao\s+os\s+|foram\s+os\s+|os\s+|de\s+)?(projetos|projects|proyectos)\b/i.test(normalized) ||
      /\b(todos\s+os|todos\s+los|all\s+the|all)\s+(projetos|projects|proyectos)\b/i.test(normalized) ||
      /\b(catalogo|portfolio|portfólio|lista)\s+(de\s+)?(projetos|projects|proyectos)\b/i.test(normalized) ||
      /\b(em\s+quais|in\s+which|en\s+que)\s+(projetos|projects|proyectos)\b/i.test(normalized) ||
      /\b(quantos|how\s+many|cuantos)\s+(projetos|projects|proyectos)\b/i.test(normalized) ||
      /\b(projetos|projects|proyectos)\s+(do\s+|de\s+|by\s+)?richter\b/i.test(normalized) ||
      /\b(projetos|projects|proyectos)\s+(desenvolvidos|criados|realizados|disponiveis|feitos|developed|created|built)\b/i.test(normalized) ||
      /\b(quais|which)\s+(projetos|projects|proyectos)\s+(o\s+richter|ele|he|el)\s+(desenvolveu|criou|fez|atuou|trabalhou|developed|built|created)\b/i.test(normalized) ||
      /\b(which|list)\s+projects\b/i.test(normalized))

  if (isListProjectsQuery) {
    return { intent: 'LIST_PROJECTS', params: {} }
  }

  // 4. Matriz de Skills / Competências Técnicas
  const isSkillsQuery =
    !isOrdinalOrRelational &&
    (/\b(quais|qual|listar|liste|mostrar|me mostre|todas as|quais sao as)\b.*?\b(tecnologias|skills|linguagens|ferramentas|competencias|habilidades)\b/i.test(normalized) ||
      /\b(stack|conhecimentos|skills|competencias|habilidades)\b.*?\btecnic(o|as|os)\b/i.test(normalized) ||
      /\btecnologias que (domina|conhece|utiliza|trabalha|usa)\b/i.test(normalized) ||
      /\bmatriz de (skills|competencias|habilidades)\b/i.test(normalized))

  if (isSkillsQuery) {
    return { intent: 'SKILLS_MATRIX', params: {} }
  }

  // 5. Linha do Tempo e Experiências Profissionais
  const isCareerQuery =
    /\b(trajetoria|historico|experiencia)\b.*?\b(profissional|de trabalho|de carreira|carreira)\b/i.test(normalized) ||
    /\bonde\b.*?\b(trabalhou|atuou|passou)\b/i.test(normalized) ||
    /\bempresas\b.*?\b(onde|que)\b.*?\b(trabalhou|atuou|passou)\b/i.test(normalized) ||
    /\btrabalhou na\b/i.test(normalized) ||
    /\bcarreira do richter\b/i.test(normalized)

  if (isCareerQuery) {
    let company: string | null = null
    if (normalized.includes('turno')) company = 'Turno'
    else if (normalized.includes('accenture')) company = 'Accenture'
    else if (normalized.includes('full comms')) company = 'Full Comms'
    else if (normalized.includes('evoke')) company = 'Evoke'
    else if (normalized.includes('ftd')) company = 'Editora FTD'
    else if (normalized.includes('plugae')) company = 'Plugae'
    return { intent: 'CAREER_TIMELINE', params: { company } }
  }

  // 6. Educação e Certificações
  const isEduQuery =
    /\b(formacao\s+academica|graduacao|pos-graduacao|certificacoes|faculdade|diploma|cursos\s+concluidos)\b/i.test(normalized) ||
    /\bonde\b.*?\b(estudou|se formou)\b/i.test(normalized)

  if (isEduQuery) {
    return { intent: 'EDUCATION_CERTS', params: {} }
  }

  // 7. Impacto e Métricas Comprovadas
  const isImpactQuery =
    /\b(principais\s+)?(metricas|impacto gerado|resultados\s+alcancados|cases\s+de\s+sucesso|ganho\s+de\s+performance|otimizacoes\s+de\s+impacto)\b/i.test(normalized)

  if (isImpactQuery) {
    return { intent: 'PROVEN_IMPACT', params: {} }
  }

  return null
}
