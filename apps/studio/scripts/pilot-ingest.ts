import { getCliClient } from 'sanity/cli'

export interface SanityDoc {
  _id: string
  _type: string
  [key: string]: any
}

// 1. 10 Skills
const skills: SanityDoc[] = [
  {
    _id: 'skill-typescript',
    _type: 'skill',
    name: 'TypeScript',
    slug: { _type: 'slug', current: 'typescript' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'Static typing, advanced generics, strict null checks, and modern full-stack development.',
    legacySourceId: 'skill:typescript',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-python',
    _type: 'skill',
    name: 'Python',
    slug: { _type: 'slug', current: 'python' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'FastAPI, automation scripts, Selenium, AI/ML integrations, and async data processing.',
    legacySourceId: 'skill:python',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-php',
    _type: 'skill',
    name: 'PHP',
    slug: { _type: 'slug', current: 'php' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'Object-oriented PHP, SOLID principles, design patterns, and enterprise APIs.',
    legacySourceId: 'skill:php',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-laravel',
    _type: 'skill',
    name: 'Laravel',
    slug: { _type: 'slug', current: 'laravel' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'Laravel Horizon, Dusk, Queues, Eloquent ORM, Event-Driven architecture, and RESTful APIs.',
    legacySourceId: 'skill:laravel',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-react',
    _type: 'skill',
    name: 'React',
    slug: { _type: 'slug', current: 'react' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'Modern React 19, hooks, component composition, state management, and high-performance rendering.',
    legacySourceId: 'skill:react',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-nextjs',
    _type: 'skill',
    name: 'Next.js',
    slug: { _type: 'slug', current: 'nextjs' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'Next.js 15 App Router, Serverless Functions, Server Components, and optimized Vercel deployments.',
    legacySourceId: 'skill:nextjs',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-docker',
    _type: 'skill',
    name: 'Docker',
    slug: { _type: 'slug', current: 'docker' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Containerization, Docker Compose, Docker Swarm multi-service orchestration, and multi-stage builds.',
    legacySourceId: 'skill:docker',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-rag',
    _type: 'skill',
    name: 'RAG (Retrieval-Augmented Generation)',
    slug: { _type: 'slug', current: 'rag' },
    category: 'ai_data_engineering',
    level: 'Advanced',
    description: 'Hybrid retrieval, vector search, cosine similarity, TF-IDF lexical retrieval, token budgeting, and grounding.',
    legacySourceId: 'skill:rag',
    legacyFile: 'README.md',
  },
  {
    _id: 'skill-sanity',
    _type: 'skill',
    name: 'Sanity Content Lake',
    slug: { _type: 'slug', current: 'sanity' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Structured content modeling, GROQ queries, Content Lake, dataset embeddings, and Sanity Context MCP.',
    legacySourceId: 'skill:sanity',
    legacyFile: 'docs/Plans/Plan Foundation - 1.a Roadmap.md',
  },
  {
    _id: 'skill-technical-leadership',
    _type: 'skill',
    name: 'Technical Leadership',
    slug: { _type: 'slug', current: 'technical-leadership' },
    category: 'architecture_leadership',
    level: 'Expert',
    description: 'Leading engineering teams, system design, architectural decision governance (ADRs), code reviews, and mentoring.',
    legacySourceId: 'skill:technical-leadership',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// 2. 2 Experiences
const experiences: SanityDoc[] = [
  {
    _id: 'exp-turno',
    _type: 'experience',
    company: 'Turno (anteriormente TurnoverBnB)',
    role: 'Engenheiro de Software Líder',
    location: 'Honolulu, Hawaii, EUA (Remoto)',
    employmentType: 'contract',
    startDate: '2022-11',
    endDate: '2025-03',
    isCurrent: false,
    summary:
      'Liderança técnica de equipe de 6 desenvolvedores em domínios críticos (Contas, Propriedades, Checklists). Arquitetou a iniciativa estratégica Mid-Stay Projects (+30% retenção), reduziu em 40% o tempo de resposta de endpoints e refatorou mais de 100 testes automatizados no Jenkins.',
    storytelling: {
      situation:
        'A plataforma enfrentava desafios de escalabilidade e retenção de usuários de médio prazo, além de débitos técnicos em queries e testes instáveis de CI/CD.',
      action:
        'Liderou a equipe na concepção arquitetural dos Mid-Stay Projects, corrigiu vulnerabilidades em testes de penetração, otimizou consultas complexas de banco e instituiu boas práticas de engenharia com apoio de IA (Copilot).',
      result:
        'Aumento de 30% na retenção de usuários, redução de 40% na latência de endpoints, pipeline de CI/CD estável com mais de 100 testes corrigidos e alta satisfação dos clientes.',
    },
    responsibilities: [
      'Liderança técnica de equipe multifuncional de 6 engenheiros',
      'Arquitetura da iniciativa Mid-Stay Projects com foco em escalabilidade',
      'Refatoração e estabilização de suíte de testes de integração e unitários',
      'Monitoramento de performance em tempo real com New Relic e Bugsnag',
    ],
    rolesPerformed: ['Tech Lead', 'Staff Software Engineer', 'Architecture Lead'],
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-react' },
      { _type: 'reference', _ref: 'skill-technical-leadership' },
    ],
    legacySourceId: 'experience:turno',
    legacyFile: 'apps/backend/src/knowledge-base/Experience-Consolidated.md',
  },
  {
    _id: 'exp-accenture',
    _type: 'experience',
    company: 'Accenture',
    role: 'Senior Software Engineer | Automation & AI',
    location: 'São Paulo, Brasil (Remoto)',
    employmentType: 'full_time',
    startDate: '2026-01',
    endDate: '2026-04',
    isCurrent: false,
    summary:
      'Arquitetura e desenvolvimento de Prova de Conceito (PoC) com Python e Selenium para automação autônoma no SAP Fiori/GUI, injeção de parâmetros dinâmicos, integração contínua em pipelines de CI/CD e orientação técnica na adoção de ferramentas de IA generativa.',
    storytelling: {
      situation:
        'Necessidade de automatizar fluxos complexos de navegação e extração de dados no SAP Fiori/GUI para eliminar gargalos operacionais manuais em clientes corporativos.',
      action:
        'Projetou do zero uma arquitetura resiliente com Python e Selenium, criando scripts modulares e integrando a execução de automação diretamente aos pipelines de CI/CD.',
      result:
        'Redução expressiva de gargalos operacionais, aceleração no ciclo de entrega de dados e consolidação de padrões de automação inteligente adotados pela equipe.',
    },
    responsibilities: [
      'Desenvolvimento de automação autônoma no SAP Fiori/GUI com Python',
      'Projeto e integração de esteiras de CI/CD com frameworks de teste e automação',
      'Mentoria técnica sobre boas práticas de arquitetura de automação e ferramentas de IA',
    ],
    rolesPerformed: ['Senior Automation Engineer', 'AI Integration Specialist'],
    technologies: [
      { _type: 'reference', _ref: 'skill-python' },
      { _type: 'reference', _ref: 'skill-docker' },
    ],
    legacySourceId: 'experience:accenture',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// 3. 2 Projects
const projects: SanityDoc[] = [
  {
    _id: 'proj-ask-richter',
    _type: 'project',
    name: 'Ask Richter - AI Career Agent',
    slug: { _type: 'slug', current: 'ask-richter' },
    category: 'ai_engineering_poc',
    status: 'active',
    summary:
      'AI Career Agent e CV Interativo construído com Next.js 15, Turborepo, Sanity Content Lake, RAG Serverless V2 e governança Zero-Trust sob o AI Engineering Framework v2.1.',
    description:
      'Aplicação que transforma a trajetória profissional tradicional em uma experiência conversacional inteligente e fundamentada, capaz de realizar consultas estruturadas via GROQ e recuperação semântica sobre uma base tipada.',
    architecture:
      'Monorepo Turborepo com Next.js 15 App Router, TypeScript 5.8, Sanity Content Lake para conhecimento estruturado, TSVectorStore 768d, Gemini LLM Provider e esteira de qualidade Jidoka.',
    challenges: [
      {
        challenge: 'Execução de RAG 100% Serverless na Vercel sem dependências binárias C++ nativas',
        solution: 'Criação do TSVectorStore em TypeScript puro com cálculo in-memory de similaridade de cosseno (ADR-0007)',
        result: 'Eliminação da infraestrutura externa do Render e cold starts inferiores a 50ms',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-nextjs' },
      { _type: 'reference', _ref: 'skill-rag' },
      { _type: 'reference', _ref: 'skill-sanity' },
    ],
    repositoryUrl: 'https://github.com/lfrichter/ask-richter',
    legacySourceId: 'project:ask-richter',
    legacyFile: 'README.md',
  },
  {
    _id: 'proj-brnow-voice-saas',
    _type: 'project',
    name: 'BrNow Voice Support SaaS & AI Platform',
    slug: { _type: 'slug', current: 'brnow-voice-saas' },
    category: 'production_saas',
    status: 'completed',
    summary:
      'Plataforma de atendimento por voz com IA generativa e telefonia SIP/WebRTC em tempo real orquestrada em Docker Swarm com modelo multi-tenant SaaS e billing por minuto.',
    description:
      'Arquitetura de microsserviços separando Controller API e Voice Agent, com integração LiveKit, Deepgram STT, OpenAI/ElevenLabs TTS e Supabase com Row Level Security.',
    architecture:
      'Microsserviços em Python/FastAPI, LiveKit WebRTC/SIP Gateway, Redis, Supabase PostgreSQL RLS e Docker Swarm com scripts idempotentes de provisionamento.',
    challenges: [
      {
        challenge: 'Orquestração de múltiplos serviços SIP, TURN e IA em contêineres com baixa latência de voz',
        solution: 'Adoção do Docker Swarm com host-mode para serviços SIP e scripts de provisionamento idempotentes',
        result: 'Atendimento de chamadas telefônicas SIP em produção com respostas naturais e histórico gravado',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-python' },
      { _type: 'reference', _ref: 'skill-docker' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'project:brnow-voice-saas',
    legacyFile: 'apps/backend/src/knowledge-base/Experience-Consolidated.md',
  },
]

// 4. 2 Education
const education: SanityDoc[] = [
  {
    _id: 'edu-unibta-software-eng',
    _type: 'education',
    institution: 'UNIBTA Centro Universitário',
    degree: 'Pós-Graduação em Engenharia de Software com foco em CBD e Sistemas Distribuídos',
    type: 'postgraduate',
    startDate: '2007-01',
    endDate: '2008-12',
    description:
      'Especialização focada em Arquitetura de Software Moderna (Microsserviços, APIs RESTful, Sistemas Distribuídos), Metodologias Ágeis, DevOps, CI/CD e Component-Based Development.',
    coursework: [
      'Arquitetura de Software Moderna e Microsserviços',
      'Component-Based Development (CBD)',
      'Metodologias Ágeis (Scrum, XP)',
      'DevOps, CI/CD e Automação de Deploy',
      'Governança e Escalabilidade em Sistemas Distribuídos',
    ],
    skills: [{ _type: 'reference', _ref: 'skill-technical-leadership' }],
    legacySourceId: 'education:unibta',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-fullcycle-solid',
    _type: 'education',
    institution: 'Full Cycle',
    degree: 'SOLID Express',
    type: 'certification',
    startDate: '2023-09',
    endDate: '2023-09',
    credentialId: 'd97e149e-e515-4dc4-9103-094163204584',
    credentialUrl: 'https://fullcycle.com.br/certificado/d97e149e-e515-4dc4-9103-094163204584',
    description:
      'Certificação intensiva em aplicação prática dos princípios SOLID em arquitetura de software orientada a objetos.',
    skills: [
      { _type: 'reference', _ref: 'skill-php' },
      { _type: 'reference', _ref: 'skill-typescript' },
    ],
    legacySourceId: 'education:fullcycle-solid',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// 5. 2 Achievements
const achievements: SanityDoc[] = [
  {
    _id: 'ach-midstay-retention-30',
    _type: 'achievement',
    title: '+30% de Retenção de Usuários com a Iniciativa Mid-Stay Projects',
    metric: '+30% Retenção',
    category: 'growth',
    context:
      'Concepção e liderança da arquitetura da feature Mid-Stay Projects na Turno, agregando valor direto ao produto de gestão de propriedades e elevando a retenção de clientes em 30%.',
    experience: { _type: 'reference', _ref: 'exp-turno' },
    legacySourceId: 'achievement:midstay-retention-30',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-shosales-10x-speed',
    _type: 'achievement',
    title: 'Otimização de Performance de Páginas em 10x no Shosales',
    metric: '10x Page Load Speed',
    category: 'performance',
    context:
      'Refatoração estratégica de consultas e paralelização de testes automatizados na Full Comms / Keaze, gerando uma aceleração de 10x na velocidade de carregamento de páginas.',
    legacySourceId: 'achievement:shosales-10x-speed',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// 6. 2 ArchitectureDecisions
const architectureDecisions: SanityDoc[] = [
  {
    _id: 'adr-0001',
    _type: 'architectureDecision',
    adrNumber: 1,
    title: 'Meta Spec, WSCI e Protocolo Jidoka',
    status: 'accepted',
    date: '2026-08-20',
    context:
      'Necessidade de governança estrita Zero-Trust e prevenção de falhas silenciosas no desenvolvimento assistido por agentes de IA.',
    decision:
      'Instituição da Meta Spec canônica, isolamento de contexto por escopo (WSCI) e comando unificado `npm run jidoka` (Andon Cord).',
    rationale:
      'Garantir que nenhuma regressão de compilação, lint ou tipagem passe despercebida durante iterações autônomas.',
    consequences:
      'Alta confiabilidade na esteira de desenvolvimento com interrupção imediata em caso de falhas.',
    technologies: [{ _type: 'reference', _ref: 'skill-technical-leadership' }],
    legacySourceId: 'adr:0001',
    legacyFile: 'docs/adr/0001-meta-spec-e-governanca-de-arquitetura.md',
  },
  {
    _id: 'adr-0007',
    _type: 'architectureDecision',
    adrNumber: 7,
    title: 'FAISS Elimination and TS Vector Search',
    status: 'accepted',
    date: '2026-08-26',
    context:
      'O faiss-node exigia binários C++ nativos incompatíveis com o ambiente Serverless da Vercel.',
    decision:
      'Substituição do faiss-node por TSVectorStore em TypeScript puro, executando similaridade de cosseno in-memory sobre vetores de 768 dimensões gerados pelo gemini-embedding-2.',
    rationale:
      'Elimina necessidade de contêineres dedicados no Render, tornando o RAG 100% serverless com cold starts inferiores a 50ms.',
    consequences:
      'Arquitetura simplificada, custo zero de infraestrutura ociosa e paridade vetorial com testes automatizados.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0007',
    legacyFile: 'docs/adr/0007-faiss-elimination-and-ts-vector-search.md',
  },
]

export const pilotDataset: SanityDoc[] = [
  ...skills,
  ...experiences,
  ...education,
  ...projects,
  ...achievements,
  ...architectureDecisions,
]

export async function runIngestion(runLabel: string) {
  console.log(`\n========================================`)
  console.log(`[INGESTION] Starting ${runLabel} (Target: ${pilotDataset.length} documents)`)
  console.log(`========================================`)

  const client = getCliClient({ apiVersion: '2024-01-01' })

  // 1. Contagem inicial
  const countBefore = await client.fetch('count(*[!(_id in path("_.**"))])')
  console.log(`[INGESTION] Document count BEFORE ${runLabel}: ${countBefore}`)

  // 2. Ingestão ordenada em 4 fases para garantir resolução de referências
  const phases = [
    { name: 'Phase 1: Skills', docs: skills },
    { name: 'Phase 2: Experiences & Education', docs: [...experiences, ...education] },
    { name: 'Phase 3: Projects & ADRs', docs: [...projects, ...architectureDecisions] },
    { name: 'Phase 4: Achievements', docs: achievements },
  ]

  for (const phase of phases) {
    console.log(`  -> Executing ${phase.name} (${phase.docs.length} docs)...`)
    for (const doc of phase.docs) {
      await client.createOrReplace(doc)
      console.log(`     [UPSERT] ${doc._type.padEnd(20)} | ID: ${doc._id}`)
    }
  }

  // 3. Contagem final
  const countAfter = await client.fetch('count(*[!(_id in path("_.**"))])')
  console.log(`[INGESTION] Document count AFTER ${runLabel}: ${countAfter}`)

  // 4. Breakdown por tipo
  const breakdown = await client.fetch(`{
    "skills": count(*[_type == "skill"]),
    "experiences": count(*[_type == "experience"]),
    "projects": count(*[_type == "project"]),
    "education": count(*[_type == "education"]),
    "achievements": count(*[_type == "achievement"]),
    "architectureDecisions": count(*[_type == "architectureDecision"]),
    "total": count(*[!(_id in path("_.**"))])
  }`)
  console.log(`[INGESTION] Breakdown after ${runLabel}:`, JSON.stringify(breakdown, null, 2))

  return { countBefore, countAfter, breakdown }
}

async function main() {
  await runIngestion('Run #1')
}

if (process.argv[1]?.endsWith('pilot-ingest.ts')) {
  main().catch((err) => {
    console.error('Fatal error during pilot ingestion:', err)
    process.exit(1)
  })
}
