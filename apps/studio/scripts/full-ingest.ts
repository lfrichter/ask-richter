import { getCliClient } from 'sanity/cli'

export interface SanityDoc {
  _id: string
  _type: string
  [key: string]: any
}

// ---------------------------------------------------------
// 1. SKILLS (38 Documentos)
// ---------------------------------------------------------
export const skills: SanityDoc[] = [
  // Languages & Frameworks
  {
    _id: 'skill-typescript',
    _type: 'skill',
    name: 'TypeScript',
    slug: { _type: 'slug', current: 'typescript' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'Tipagem estática avançada, generics complexos, strict null checks e desenvolvimento full-stack escalável.',
    legacySourceId: 'skill:typescript',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-javascript',
    _type: 'skill',
    name: 'JavaScript',
    slug: { _type: 'slug', current: 'javascript' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'ECMAScript moderno (ES6+), programação assíncrona, closures, event loop e manipulação avançada de DOM.',
    legacySourceId: 'skill:javascript',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-python',
    _type: 'skill',
    name: 'Python',
    slug: { _type: 'slug', current: 'python' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'FastAPI, automação com Selenium, integração com modelos de IA/LLM, LangChain e processamento assíncrono.',
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
    description: 'PHP moderno (7.x/8.x), orientação a objetos rigorosa, SOLID, design patterns e desenvolvimento de APIs empresariais.',
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
    description: 'Laravel Horizon, Queues, Dusk, Eloquent ORM avançado, Event-Driven Architecture, Service Providers e RESTful APIs.',
    legacySourceId: 'skill:laravel',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-lumen',
    _type: 'skill',
    name: 'Lumen',
    slug: { _type: 'slug', current: 'lumen' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'Microsserviços de altíssima performance, APIs leves e rápidas em PHP.',
    legacySourceId: 'skill:lumen',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-vuejs',
    _type: 'skill',
    name: 'Vue.js',
    slug: { _type: 'slug', current: 'vuejs' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'Vue 2 / Vue 3 Composition API, Pinia/Vuex, Single File Components e integração com Laravel.',
    legacySourceId: 'skill:vuejs',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-react',
    _type: 'skill',
    name: 'React',
    slug: { _type: 'slug', current: 'react' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'React 19, Hooks customizados, Context API, componentização desacoplada e renderização de alto desempenho.',
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
    description: 'Next.js 15 App Router, Server Components (RSC), Route Handlers, Server Actions e otimização para Vercel.',
    legacySourceId: 'skill:nextjs',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-nodejs',
    _type: 'skill',
    name: 'Node.js',
    slug: { _type: 'slug', current: 'nodejs' },
    category: 'languages_frameworks',
    level: 'Advanced',
    description: 'Node.js (>=20/22), Express, TypeScript execution via tsx, streaming de SSE e microsserviços.',
    legacySourceId: 'skill:nodejs',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-html-css',
    _type: 'skill',
    name: 'HTML5 & CSS3',
    slug: { _type: 'slug', current: 'html-css' },
    category: 'languages_frameworks',
    level: 'Expert',
    description: 'HTML5 semântico, acessibilidade, CSS3 moderno, Flexbox, Grid, TailwindCSS e animações CSS.',
    legacySourceId: 'skill:html-css',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-csharp',
    _type: 'skill',
    name: 'C#',
    slug: { _type: 'slug', current: 'csharp' },
    category: 'languages_frameworks',
    level: 'Intermediate',
    description: 'Conhecimento em C#/.NET aplicado a sistemas corporativos e integração de serviços.',
    legacySourceId: 'skill:csharp',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },

  // Databases & Storage
  {
    _id: 'skill-postgresql',
    _type: 'skill',
    name: 'PostgreSQL',
    slug: { _type: 'slug', current: 'postgresql' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Modelagem relacional, indexação avançada, consultas otimizadas, triggers e integração com Supabase.',
    legacySourceId: 'skill:postgresql',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-mysql',
    _type: 'skill',
    name: 'MySQL',
    slug: { _type: 'slug', current: 'mysql' },
    category: 'databases_storage',
    level: 'Expert',
    description: 'Arquitetura de dados, tuning de consultas, replicação, transações ACID e otimização para alta concorrência.',
    legacySourceId: 'skill:mysql',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-sqlite',
    _type: 'skill',
    name: 'SQLite',
    slug: { _type: 'slug', current: 'sqlite' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Armazenamento embarcado leve e persistência para testes e prototipagem rápida.',
    legacySourceId: 'skill:sqlite',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-sql-server',
    _type: 'skill',
    name: 'SQL Server',
    slug: { _type: 'slug', current: 'sql-server' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Modelagem de dados corporativos, stored procedures, triggers e portais empresariais.',
    legacySourceId: 'skill:sql-server',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-mongodb',
    _type: 'skill',
    name: 'MongoDB',
    slug: { _type: 'slug', current: 'mongodb' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Modelagem de documentos NoSQL, agregação, catálogos flexíveis e sincronização de marketplaces.',
    legacySourceId: 'skill:mongodb',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-redis',
    _type: 'skill',
    name: 'Redis',
    slug: { _type: 'slug', current: 'redis' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Caching distribuído, controle de sessões, mensageria Pub/Sub e backend de filas para Laravel Horizon.',
    legacySourceId: 'skill:redis',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-supabase',
    _type: 'skill',
    name: 'Supabase',
    slug: { _type: 'slug', current: 'supabase' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'BaaS com PostgreSQL, Row Level Security (RLS), Management API para restauração automatizada e telemetria.',
    legacySourceId: 'skill:supabase',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-sanity',
    _type: 'skill',
    name: 'Sanity Content Lake',
    slug: { _type: 'slug', current: 'sanity' },
    category: 'databases_storage',
    level: 'Advanced',
    description: 'Modelagem ontológica em TypeScript, consultas declarativas em GROQ, Content Lake e Sanity Context MCP.',
    legacySourceId: 'skill:sanity',
    legacyFile: 'docs/Plans/Plan Foundation - 1.a Roadmap.md',
  },

  // DevOps & Cloud
  {
    _id: 'skill-docker',
    _type: 'skill',
    name: 'Docker',
    slug: { _type: 'slug', current: 'docker' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Containerização, multi-stage builds, Docker Compose para ambientes locais e padronização de runtime.',
    legacySourceId: 'skill:docker',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-docker-swarm',
    _type: 'skill',
    name: 'Docker Swarm',
    slug: { _type: 'slug', current: 'docker-swarm' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Orquestração de microsserviços em produção, overlay networks, host mode para SIP e provisionamento idempotente.',
    legacySourceId: 'skill:docker-swarm',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-kubernetes',
    _type: 'skill',
    name: 'Kubernetes',
    slug: { _type: 'slug', current: 'kubernetes' },
    category: 'devops_cloud',
    level: 'Intermediate',
    description: 'Fundamentos de orquestração de contêineres, pods, deployments, services e ingress controllers.',
    legacySourceId: 'skill:kubernetes',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-aws',
    _type: 'skill',
    name: 'AWS',
    slug: { _type: 'slug', current: 'aws' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'EC2, S3, CloudFront, Lambda, CodeDeploy, RDS e arquiteturas escaláveis na nuvem.',
    legacySourceId: 'skill:aws',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-gcp',
    _type: 'skill',
    name: 'GCP',
    slug: { _type: 'slug', current: 'gcp' },
    category: 'devops_cloud',
    level: 'Intermediate',
    description: 'Google Cloud Platform, Vertex AI, Cloud Storage e APIs do ecossistema Google.',
    legacySourceId: 'skill:gcp',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-vercel',
    _type: 'skill',
    name: 'Vercel',
    slug: { _type: 'slug', current: 'vercel' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Deploy contínuo, Serverless Edge Functions, otimização de Next.js e roteamento relativo de produção.',
    legacySourceId: 'skill:vercel',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-ci-cd',
    _type: 'skill',
    name: 'CI/CD & Pipelines',
    slug: { _type: 'slug', current: 'ci-cd' },
    category: 'devops_cloud',
    level: 'Expert',
    description: 'Automação de testes, linting, build, validação estática e deploy contínuo em esteiras integradas.',
    legacySourceId: 'skill:ci-cd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-github-actions',
    _type: 'skill',
    name: 'GitHub Actions',
    slug: { _type: 'slug', current: 'github-actions' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Workflows declarativos de CI/CD, execução de testes automatizados e automação de releases.',
    legacySourceId: 'skill:github-actions',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-jenkins',
    _type: 'skill',
    name: 'Jenkins',
    slug: { _type: 'slug', current: 'jenkins' },
    category: 'devops_cloud',
    level: 'Advanced',
    description: 'Pipelines automatizadas de build e teste, refatoração e estabilização de mais de 100 testes de integração.',
    legacySourceId: 'skill:jenkins',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },

  // AI & Data Engineering
  {
    _id: 'skill-rag',
    _type: 'skill',
    name: 'RAG (Retrieval-Augmented Generation)',
    slug: { _type: 'slug', current: 'rag' },
    category: 'ai_data_engineering',
    level: 'Advanced',
    description: 'Recuperação híbrida, busca vetorial in-memory (TSVectorStore), TF-IDF léxico, token budgeting e anti-alucinação.',
    legacySourceId: 'skill:rag',
    legacyFile: 'README.md',
  },
  {
    _id: 'skill-langchain',
    _type: 'skill',
    name: 'LangChain',
    slug: { _type: 'slug', current: 'langchain' },
    category: 'ai_data_engineering',
    level: 'Advanced',
    description: 'Orquestração de pipelines de RAG, divisão semântica de documentos e abstração de provedores.',
    legacySourceId: 'skill:langchain',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-gemini-api',
    _type: 'skill',
    name: 'Google Gemini API',
    slug: { _type: 'slug', current: 'gemini-api' },
    category: 'ai_data_engineering',
    level: 'Advanced',
    description: 'SDK oficial @google/genai, modelos gemini-embedding-2 (768d), gemini-2.5-flash e gemini-3.6-flash.',
    legacySourceId: 'skill:gemini-api',
    legacyFile: 'docs/adr/0005-provider-agnostic-ai-architecture.md',
  },
  {
    _id: 'skill-openai-api',
    _type: 'skill',
    name: 'OpenAI API',
    slug: { _type: 'slug', current: 'openai-api' },
    category: 'ai_data_engineering',
    level: 'Advanced',
    description: 'Modelos GPT-4o, embeddings, integração com agentes de voz (TTS/STT) e pipelines de fallback.',
    legacySourceId: 'skill:openai-api',
    legacyFile: 'docs/adr/0005-provider-agnostic-ai-architecture.md',
  },

  // Architecture & Leadership
  {
    _id: 'skill-technical-leadership',
    _type: 'skill',
    name: 'Technical Leadership',
    slug: { _type: 'slug', current: 'technical-leadership' },
    category: 'architecture_leadership',
    level: 'Expert',
    description: 'Liderança técnica de times de engenharia, arquitetura de sistemas escaláveis, code reviews e mentoria.',
    legacySourceId: 'skill:technical-leadership',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-clean-architecture',
    _type: 'skill',
    name: 'Clean Architecture & Design Patterns',
    slug: { _type: 'slug', current: 'clean-architecture' },
    category: 'architecture_leadership',
    level: 'Expert',
    description: 'Desacoplamento de camadas de domínio e infraestrutura, SOLID, Inversion of Control e Repository Pattern.',
    legacySourceId: 'skill:clean-architecture',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-ddd',
    _type: 'skill',
    name: 'Domain Driven Design (DDD)',
    slug: { _type: 'slug', current: 'ddd' },
    category: 'architecture_leadership',
    level: 'Advanced',
    description: 'Bounded Contexts, Aggregates, Entities, Value Objects, Domain Events e modelagem estratégica de negócios.',
    legacySourceId: 'skill:ddd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-tdd',
    _type: 'skill',
    name: 'TDD & Automated Testing',
    slug: { _type: 'slug', current: 'tdd' },
    category: 'architecture_leadership',
    level: 'Expert',
    description: 'Desenvolvimento guiado por testes, testes unitários, testes de integração e matrizes de verificação de caos.',
    legacySourceId: 'skill:tdd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'skill-zero-trust-governance',
    _type: 'skill',
    name: 'Zero-Trust Governance & Jidoka',
    slug: { _type: 'slug', current: 'zero-trust-governance' },
    category: 'architecture_leadership',
    level: 'Expert',
    description: 'AI Engineering Framework v2.1, protocolo Jidoka (parar no primeiro sinal de inconsistência) e verificação contínua.',
    legacySourceId: 'skill:zero-trust-governance',
    legacyFile: 'docs/adr/0001-meta-spec-e-governanca-de-arquitetura.md',
  },
]

// ---------------------------------------------------------
// 2. EXPERIENCES (10 Documentos)
// ---------------------------------------------------------
export const experiences: SanityDoc[] = [
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
      situation: 'Necessidade de automatizar fluxos complexos de navegação e extração de dados no SAP Fiori/GUI para eliminar gargalos operacionais manuais em clientes corporativos.',
      action: 'Projetou do zero uma arquitetura resiliente com Python e Selenium, criando scripts modulares e integrando a execução de automação diretamente aos pipelines de CI/CD.',
      result: 'Redução expressiva de gargalos operacionais, aceleração no ciclo de entrega de dados e consolidação de padrões de automação inteligente adotados pela equipe.',
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
      situation: 'A plataforma enfrentava desafios de escalabilidade e retenção de usuários de médio prazo, além de débitos técnicos em queries e testes instáveis de CI/CD.',
      action: 'Liderou a equipe na concepção arquitetural dos Mid-Stay Projects, corrigiu vulnerabilidades em testes de penetração, otimizou consultas complexas de banco e instituiu boas práticas de engenharia com apoio de IA (Copilot).',
      result: 'Aumento de 30% na retenção de usuários, redução de 40% na latência de endpoints, pipeline de CI/CD estável com mais de 100 testes corrigidos e alta satisfação dos clientes.',
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
    _id: 'exp-full-comms',
    _type: 'experience',
    company: 'Full Comms / Keaze',
    role: 'Head de Desenvolvimento Full-Stack',
    location: 'Londres, Reino Unido (Remoto)',
    employmentType: 'full_time',
    startDate: '2021-04',
    endDate: '2022-11',
    isCurrent: false,
    summary:
      'Liderança de desenvolvimento full-stack para portais imobiliários no Reino Unido (Keaze, Shosales e Kpro Aftersales), otimizando a velocidade de carregamento em 10x através de modernização arquitetural em Laravel e Vue.js.',
    storytelling: {
      situation: 'Sistemas imobiliários com tempos de resposta elevados e acoplamento que prejudicavam a conversão de leads e a experiência de pós-venda.',
      action: 'Reformulou a arquitetura do portal Shosales e desenvolveu o módulo de pós-venda Kpro em Lumen/Vue.js com pipelines automatizadas de CI/CD.',
      result: 'Melhoria de 10x no tempo de carregamento de páginas e aumento expressivo na taxa de conversão e retenção de compradores.',
    },
    responsibilities: [
      'Gestão técnica e desenvolvimento de portais imobiliários britânicos',
      'Arquitetura de microsserviços em Lumen e APIs RESTful',
      'Modernização de interfaces com Vue.js e componentização desacoplada',
    ],
    rolesPerformed: ['Head of Development', 'Lead Full Stack Engineer'],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-vuejs' },
      { _type: 'reference', _ref: 'skill-lumen' },
      { _type: 'reference', _ref: 'skill-typescript' },
    ],
    legacySourceId: 'experience:full-comms',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-evoke-mobile',
    _type: 'experience',
    company: 'Evoke Mobile',
    role: 'Head de Desenvolvimento de Software',
    location: 'São Paulo, Brasil / Londres, UK',
    employmentType: 'full_time',
    startDate: '2019-03',
    endDate: '2021-04',
    isCurrent: false,
    summary:
      'Liderança de equipe de engenharia no desenvolvimento de plataformas de telemetria e inteligência de mercado (Toot) e aplicativos de entretenimento esportivo (Fanoty Football), escalando o processamento assíncrono em 500x com Laravel Horizon e Redis.',
    storytelling: {
      situation: 'Necessidade de processar volumes massivos de dados geoespaciais e telemetria de viagens em tempo real com renderização rápida em mapas e alta concorrência.',
      action: 'Implementou fila assíncrona com Laravel Horizon/Redis e otimizou consultas espaciais, acelerando a renderização de mapas de 200k+ pontos em 30x.',
      result: 'Processamento de filas 500x mais rápido, estabilidade operacional com zero downtime em dias de jogos e dados de mercado em tempo real.',
    },
    responsibilities: [
      'Gestão da equipe de software e definição das diretrizes de arquitetura',
      'Arquitetura de backend escalável em Laravel, Redis e PostgreSQL/MySQL',
      'Integração de APIs de parceiros internacionais (OPTA Sports Data, Prozone)',
    ],
    rolesPerformed: ['Head of Software Development', 'Principal Backend Architect'],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-react' },
      { _type: 'reference', _ref: 'skill-redis' },
      { _type: 'reference', _ref: 'skill-technical-leadership' },
    ],
    legacySourceId: 'experience:evoke-mobile',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-alfasoft',
    _type: 'experience',
    company: 'Alfasoft.pt',
    role: 'Engenheiro de Desenvolvimento de Software',
    location: 'Lisboa, Portugal (Remoto)',
    employmentType: 'full_time',
    startDate: '2018-04',
    endDate: '2018-11',
    isCurrent: false,
    summary:
      'Desenvolvimento e integração de sistemas legados para clientes corporativos europeus, construindo o hub Sisporta para integração de ERP e o portal corporativo de cosméticos MyLabel.',
    storytelling: {
      situation: 'Sistemas industriais legados em clientes europeus necessitavam de integração moderna com ERPs e comércio eletrônico sem disrupção das operações.',
      action: 'Desenvolveu módulos de integração em Laravel e scripts Python para sincronização de dados e gerenciamento de inventário.',
      result: 'Conexão transparente entre sistemas legados e portais modernos com integridade transacional garantida.',
    },
    responsibilities: [
      'Integração de sistemas legados industriais com ERPs modernos',
      'Desenvolvimento de APIs robustas em PHP/Laravel e scripts de automação Python',
    ],
    rolesPerformed: ['Senior Software Engineer', 'Backend Integrator'],
    technologies: [
      { _type: 'reference', _ref: 'skill-php' },
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-python' },
    ],
    legacySourceId: 'experience:alfasoft',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-plugae',
    _type: 'experience',
    company: 'Plugae',
    role: 'Desenvolvedor Sênior de Software',
    location: 'São Paulo, Brasil',
    employmentType: 'contract',
    startDate: '2017-11',
    endDate: '2018-02',
    isCurrent: false,
    summary:
      'Arquitetura e desenvolvimento do Spider, hub integrador multi-marketplace e ERP conectando Mercado Livre, B2W, Via Varejo e ERPs com eliminação completa de overselling de estoque.',
    storytelling: {
      situation: 'Lojistas sofriam com atrasos na sincronização de estoque entre múltiplos marketplaces, gerando vendas de produtos sem estoque físico.',
      action: 'Desenvolveu barramento assíncrono com Laravel, MongoDB e Redis para conciliação em tempo real de pedidos e estoques.',
      result: 'Eliminação de 100% dos incidentes de overselling e sincronização quase instantânea de catálogo.',
    },
    responsibilities: [
      'Desenvolvimento do hub integrador Spider em Laravel e MongoDB',
      'Arquitetura de processamento assíncrono de webhook de marketplaces',
    ],
    rolesPerformed: ['Senior Backend Engineer', 'Integration Specialist'],
    technologies: [
      { _type: 'reference', _ref: 'skill-php' },
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-mongodb' },
      { _type: 'reference', _ref: 'skill-redis' },
    ],
    legacySourceId: 'experience:plugae',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-pilha-digital',
    _type: 'experience',
    company: 'Pilha Digital',
    role: 'Desenvolvedor de Software',
    location: 'São Paulo, Brasil',
    employmentType: 'contract',
    startDate: '2017-02',
    endDate: '2017-09',
    isCurrent: false,
    summary:
      'Desenvolvimento de plataforma de engajamento web push notifications e integração com gateways de pagamento (Iugu/Pagar.me) para envio massivo de alertas em alta performance.',
    storytelling: {
      situation: 'Necessidade de entregar notificações web push com altíssima taxa de entrega e processamento em lote de cobranças recorrentes.',
      action: 'Construiu a arquitetura em Laravel com filas assíncronas e integração com APIs de push dos navegadores.',
      result: 'Capacidade de disparo de centenas de milhares de notificações por minuto com conciliação financeira automatizada.',
    },
    responsibilities: [
      'Desenvolvimento de sistema web push e cobrança recorrente',
      'Otimização de filas e consumo de APIs externas',
    ],
    rolesPerformed: ['Software Developer'],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-php' },
    ],
    legacySourceId: 'experience:pilha-digital',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-aso',
    _type: 'experience',
    company: 'ASO',
    role: 'Full Stack Developer',
    location: 'São Paulo, Brasil',
    employmentType: 'full_time',
    startDate: '2016-01',
    endDate: '2017-01',
    isCurrent: false,
    summary:
      'Desenvolvimento e manutenção de sistema de gestão de saúde ocupacional e medicina do trabalho, controle de prontuários, agendamentos e emissão de laudos regulatórios.',
    storytelling: {
      situation: 'Clínicas ocupacionais necessitavam de fluxo digital seguro para laudos médicos e histórico de pacientes em conformidade com as normas regulamentadoras.',
      action: 'Implementou módulos em PHP e MySQL com controle de permissões por perfil clínico e emissão automatizada de relatórios.',
      result: 'Redução no tempo de emissão de laudos de 48h para minutos e digitalização completa dos prontuários.',
    },
    responsibilities: [
      'Desenvolvimento full-stack de sistema de medicina ocupacional',
      'Modelagem relacional e otimização de consultas no MySQL',
    ],
    rolesPerformed: ['Full Stack Developer'],
    technologies: [
      { _type: 'reference', _ref: 'skill-php' },
      { _type: 'reference', _ref: 'skill-mysql' },
    ],
    legacySourceId: 'experience:aso',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-promoedu',
    _type: 'experience',
    company: 'Promoedu.com',
    role: 'Coach & Treinador de Liderança',
    location: 'São Paulo, Brasil',
    employmentType: 'contract',
    startDate: '2015-09',
    endDate: '2016-03',
    isCurrent: false,
    summary:
      'Treinamento de equipes, mentoria em liderança situacional, comunicação estratégica e facilitação de workshops corporativos para desenvolvimento de gestores.',
    storytelling: {
      situation: 'Equipes corporativas em transição de liderança demandavam capacitação prática em gestão de conflitos e tomada de decisão.',
      action: 'Conduziu programas de treinamento e mentoria individual focados em dinâmicas de liderança e alinhamento de metas.',
      result: 'Elevação do engajamento dos times e capacitação bem-sucedida de novos líderes técnicos.',
    },
    responsibilities: [
      'Condução de workshops e treinamentos executivos',
      'Mentoria em liderança técnica e comunicação interpessoal',
    ],
    rolesPerformed: ['Leadership Coach', 'Facilitator'],
    technologies: [
      { _type: 'reference', _ref: 'skill-technical-leadership' },
    ],
    legacySourceId: 'experience:promoedu',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'exp-editora-ftd',
    _type: 'experience',
    company: 'Editora FTD S/A',
    role: 'Web Developer & Engenheiro de Software',
    location: 'São Paulo, Brasil',
    employmentType: 'full_time',
    startDate: '1998-01',
    endDate: '2011-11',
    isCurrent: false,
    summary:
      'Trajetória de mais de 13 anos liderando o desenvolvimento de portais corporativos educacionais, intranet para milhares de colaboradores, sistemas de e-commerce e catálogo digital de livros didáticos.',
    storytelling: {
      situation: 'Pioneirismo na transição do setor editorial tradicional para o ambiente digital na internet.',
      action: 'Arquitetou e construiu portais corporativos, catálogos online de livros e intranets integradas com bases SQL Server.',
      result: 'Operação ininterrupta de portais com milhões de acessos anuais de professores, alunos e parceiros comerciais.',
    },
    responsibilities: [
      'Desenvolvimento de portais corporativos e intranets educacionais',
      'Modelagem de banco de dados e stored procedures no SQL Server',
      'Arquitetura web escalável e integração com catálogo editorial',
    ],
    rolesPerformed: ['Web Developer', 'Senior Software Engineer', 'Portal Architect'],
    technologies: [
      { _type: 'reference', _ref: 'skill-sql-server' },
      { _type: 'reference', _ref: 'skill-html-css' },
      { _type: 'reference', _ref: 'skill-javascript' },
    ],
    legacySourceId: 'experience:editora-ftd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// ---------------------------------------------------------
// 3. EDUCATION (14 Documentos)
// ---------------------------------------------------------
export const education: SanityDoc[] = [
  {
    _id: 'edu-unibta-software-eng',
    _type: 'education',
    institution: 'UNIBTA',
    degree: 'Pós-Graduação em Engenharia de Software (CBD & Sistemas Distribuídos)',
    type: 'postgraduate',
    startDate: '2007-01',
    endDate: '2008-12',
    description: 'Especialização em arquitetura de componentes de software (CBD), sistemas distribuídos, padrões de projeto e governança técnica.',
    coursework: ['Component-Based Development (CBD)', 'Sistemas Distribuídos', 'Engenharia de Requisitos', 'Arquitetura de Software Empresarial'],
    skills: [{ _type: 'reference', _ref: 'skill-technical-leadership' }],
    legacySourceId: 'education:unibta',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-anhembi-ecommerce',
    _type: 'education',
    institution: 'Universidade Anhembi Morumbi',
    degree: 'Graduação em Gestão de E-Commerce',
    type: 'bachelor',
    startDate: '1999-01',
    endDate: '2002-12',
    description: 'Formação superior focada em estratégia de negócios digitais, gestão de comércio eletrônico, marketing e infraestrutura web.',
    coursework: ['Gestão de Plataformas Digitais', 'Marketing para E-commerce', 'Modelos de Negócios na Internet', 'Logística e Pagamentos Online'],
    skills: [],
    legacySourceId: 'education:anhembi',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-outlier-hypno-ai',
    _type: 'education',
    institution: 'Outlier',
    degree: 'Hypno Methodology for Advanced AI Model Evaluation',
    type: 'certification',
    endDate: '2025-06',
    description: 'Certificação e treinamento metodológico avançado para avaliação de capacidades de raciocínio, alinhamento e precisão de modelos de linguagem de fronteira (LLMs).',
    coursework: ['LLM Reasoning Evaluation', 'Prompt Evaluation & Alignment', 'Hypno Protocol'],
    skills: [],
    legacySourceId: 'education:outlier-hypno',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-fullcycle-solid',
    _type: 'education',
    institution: 'Full Cycle',
    degree: 'SOLID Express',
    type: 'certification',
    endDate: '2023-09',
    description: 'Princípios SOLID aplicados na prática para construção de software extensível, manutenível e de baixo acoplamento.',
    coursework: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
    skills: [
      { _type: 'reference', _ref: 'skill-php' },
      { _type: 'reference', _ref: 'skill-typescript' },
    ],
    legacySourceId: 'education:fullcycle-solid',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-fullcycle-opentelemetry',
    _type: 'education',
    institution: 'Full Cycle',
    degree: 'Introduction to OpenTelemetry',
    type: 'certification',
    endDate: '2022-12',
    description: 'Fundamentos de observabilidade distribuída, tracing de microsserviços, métricas e logs estruturados com OpenTelemetry.',
    coursework: ['Distributed Tracing', 'Métricas & Exportadores', 'Instrumentação de Aplicações'],
    skills: [],
    legacySourceId: 'education:fullcycle-opentelemetry',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-fullcycle-git-patterns',
    _type: 'education',
    institution: 'Full Cycle',
    degree: 'Advanced Patterns & Techniques with Git & GitHub',
    type: 'certification',
    endDate: '2022-02',
    description: 'Fluxos avançados de versionamento, Gitflow, Conventional Commits, trunk-based development e automação de repositórios.',
    coursework: ['Git Internals', 'Rebase Interativo & Cherry-pick', 'GitHub Flow & Trunk-Based Development'],
    skills: [{ _type: 'reference', _ref: 'skill-ci-cd' }],
    legacySourceId: 'education:fullcycle-git',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-fullcycle-ddd',
    _type: 'education',
    institution: 'Full Cycle',
    degree: 'Domain Driven Design (DDD)',
    type: 'course',
    endDate: '2021-11',
    description: 'Aprofundamento em modelagem estratégica e tática de software baseada em domínio de negócios com Bounded Contexts e Aggregates.',
    coursework: ['Strategic Design & Context Mapping', 'Tactical Design (Entities, VO, Aggregates)', 'Domain Events & Repositories'],
    skills: [{ _type: 'reference', _ref: 'skill-ddd' }],
    legacySourceId: 'education:fullcycle-ddd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-aws-s3',
    _type: 'education',
    institution: 'School of Net',
    degree: 'AWS S3 & CloudFront',
    type: 'certification',
    endDate: '2022-11',
    description: 'Armazenamento de objetos na nuvem, políticas de segurança de bucket, CORS e distribuição global via CDN CloudFront.',
    coursework: ['S3 Buckets & Lifecycle Rules', 'CloudFront Distributions & Caching', 'IAM Security Policies'],
    skills: [{ _type: 'reference', _ref: 'skill-aws' }],
    legacySourceId: 'education:schoolofnet-aws-s3',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-aws-ec2',
    _type: 'education',
    institution: 'School of Net',
    degree: 'AWS EC2',
    type: 'certification',
    endDate: '2022-11',
    description: 'Provisionamento de instâncias computacionais elásticas, Security Groups, pares de chaves e configuração de servidores.',
    coursework: ['EC2 Instance Types', 'Security Groups & VPC', 'EBS Volumes & Snapshots'],
    skills: [{ _type: 'reference', _ref: 'skill-aws' }],
    legacySourceId: 'education:schoolofnet-aws-ec2',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-aws-lambda',
    _type: 'education',
    institution: 'School of Net',
    degree: 'AWS Lambda',
    type: 'certification',
    endDate: '2022-11',
    description: 'Execução de código Serverless orientada a eventos, gatilhos de API Gateway, limites de execução e variáveis de ambiente.',
    coursework: ['Serverless Functions', 'Event Triggers (S3, SQS)', 'API Gateway Integration'],
    skills: [{ _type: 'reference', _ref: 'skill-aws' }],
    legacySourceId: 'education:schoolofnet-aws-lambda',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-aws-codedeploy',
    _type: 'education',
    institution: 'School of Net',
    degree: 'AWS CodeDeploy',
    type: 'certification',
    endDate: '2022-11',
    description: 'Automação de deployments para instâncias EC2 e ambientes híbridos com scripts de lifecycle e rollback automático.',
    coursework: ['AppSpec Configuration', 'Deployment Groups', 'Automated Rollback'],
    skills: [
      { _type: 'reference', _ref: 'skill-aws' },
      { _type: 'reference', _ref: 'skill-ci-cd' },
    ],
    legacySourceId: 'education:schoolofnet-aws-codedeploy',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-laravel-blade',
    _type: 'education',
    institution: 'School of Net',
    degree: 'Laravel Blade Components',
    type: 'certification',
    endDate: '2021-08',
    description: 'Componentização avançada de interfaces server-rendered com Laravel Blade, slots, props e layouts dinâmicos.',
    coursework: ['Blade Component Classes', 'Slots & Attributes', 'Layout Inheritance'],
    skills: [{ _type: 'reference', _ref: 'skill-laravel' }],
    legacySourceId: 'education:schoolofnet-blade',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-laravel-tdd',
    _type: 'education',
    institution: 'School of Net',
    degree: 'Laravel TDD & Unit Testing',
    type: 'certification',
    endDate: '2020-05',
    description: 'Desenvolvimento guiado por testes em PHPUnit para aplicações Laravel, factories de banco de dados e testes de API HTTP.',
    coursework: ['PHPUnit Assertions', 'Model Factories & Seeders', 'HTTP Feature Testing'],
    skills: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-tdd' },
    ],
    legacySourceId: 'education:schoolofnet-tdd',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'edu-schoolofnet-docker',
    _type: 'education',
    institution: 'School of Net',
    degree: 'Docker & Containerization',
    type: 'certification',
    endDate: '2019-10',
    description: 'Criação de imagens Docker otimizadas, volumes para persistência, redes internas de contêineres e orquestração com Compose.',
    coursework: ['Dockerfile Best Practices', 'Docker Compose Multi-Container', 'Volume & Network Management'],
    skills: [{ _type: 'reference', _ref: 'skill-docker' }],
    legacySourceId: 'education:schoolofnet-docker',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
]

// ---------------------------------------------------------
// 4. PROJECTS (18 Documentos)
// ---------------------------------------------------------
export const projects: SanityDoc[] = [
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
  {
    _id: 'proj-midstay-projects',
    _type: 'project',
    name: 'Mid-Stay Projects (Turno)',
    slug: { _type: 'slug', current: 'midstay-projects' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-turno' },
    status: 'completed',
    summary:
      'Módulo estratégico de locação de médio prazo na plataforma Turno, permitindo o agendamento de serviços de limpeza e manutenção programada com +30% de retenção de usuários.',
    description:
      'Arquitetura complexa de agendamentos recorrentes integrando calendários de anfitriões, gestão de equipes de limpeza e cobranças automáticas.',
    architecture: 'Backend em Laravel, banco relacional com otimização de índices para alta concorrência e frontend em Vue.js/React.',
    challenges: [
      {
        challenge: 'Lidar com concorrência e conflitos de agendamento em datas sobrepostas para milhares de anfitriões',
        solution: 'Algoritmo de validação com locks pessimistas e filas assíncronas no Laravel Horizon',
        result: 'Aumento de 30% na retenção de anfitriões e hóspedes de média estadia sem falhas de agendamento',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-vuejs' },
    ],
    legacySourceId: 'project:midstay-projects',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-kpro-aftersales',
    _type: 'project',
    name: 'Kpro AfterSales Module (Full Comms)',
    slug: { _type: 'slug', current: 'kpro-aftersales' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-full-comms' },
    status: 'completed',
    summary:
      'Módulo de gestão de pós-venda imobiliária para construtoras no Reino Unido, automatizando chamados de garantia, vistorias e atendimento a compradores.',
    description:
      'Sistema em Lumen e Vue.js com workflows de aprovação, upload seguro de relatórios técnicos e notificações em tempo real para equipes de suporte.',
    architecture: 'Microsserviço em Lumen PHP com banco PostgreSQL e SPA em Vue.js.',
    challenges: [
      {
        challenge: 'Processamento de relatórios fotográficos de vistorias com resposta imediata para compradores',
        solution: 'Upload assíncrono para storage com geração de thumbnails e processamento em segundo plano',
        result: 'Redução drástica no tempo de atendimento de pós-venda e satisfação dos compradores',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-lumen' },
      { _type: 'reference', _ref: 'skill-vuejs' },
    ],
    legacySourceId: 'project:kpro-aftersales',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-shosales-revamp',
    _type: 'project',
    name: 'Shosales Website Revamp & Platform (Full Comms)',
    slug: { _type: 'slug', current: 'shosales-revamp' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-full-comms' },
    status: 'completed',
    summary:
      'Reformulação arquitetural e modernização do portal de vendas de imóveis Shosales no Reino Unido, atingindo carregamento 10x mais rápido.',
    description:
      'Refatoração completa de código legado para Laravel com componentes Vue.js otimizados, caching agressivo de consultas de propriedades e SEO aprimorado.',
    architecture: 'Laravel, Redis Caching, Vue.js e integração com feeds imobiliários de terceiros.',
    challenges: [
      {
        challenge: 'Páginas lentas de listagem de milhares de imóveis com filtros dinâmicos',
        solution: 'Implementação de camada de cache em Redis e normalização de queries no banco',
        result: 'Carregamento 10x mais veloz e elevação dos índices de Core Web Vitals',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-vuejs' },
    ],
    legacySourceId: 'project:shosales-revamp',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-toot-analytics',
    _type: 'project',
    name: 'Toot Trip Analytics & Tracking (Evoke Mobile)',
    slug: { _type: 'slug', current: 'toot-analytics' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-evoke-mobile' },
    status: 'completed',
    summary:
      'Plataforma de telemetria e análise de viagens veiculares em tempo real com renderização de mais de 200 mil registros geoespaciais em mapas de alta performance.',
    description:
      'Backend de alto volume processando dados de GPS enviados por dispositivos embarcados, clustering de coordenadas e cálculo de métricas de rota.',
    architecture: 'Laravel, Redis, PostgreSQL com PostGIS / MySQL espacial e frontend em React.',
    challenges: [
      {
        challenge: 'Renderização fluida de centenas de milhares de coordenadas GPS sem congelamento do navegador',
        solution: 'Algoritmo de decimação e clustering de pontos no servidor antes do envio ao cliente',
        result: 'Aceleração de 30x na renderização de mapas com dados de telemetria',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-redis' },
    ],
    legacySourceId: 'project:toot-analytics',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-toot-market-intel',
    _type: 'project',
    name: 'Toot Market Intelligence Platform (Evoke Mobile)',
    slug: { _type: 'slug', current: 'toot-market-intel' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-evoke-mobile' },
    status: 'completed',
    summary:
      'Painel analítico de inteligência de mercado e precificação dinâmica para o setor de mobilidade e transporte urbano.',
    description:
      'Consolidação de dados de frotas, comportamento de rotas e benchmarks competitivos com geração de dashboards executivos.',
    architecture: 'Laravel, Redis e visualização de dados com gráficos interativos.',
    challenges: [
      {
        challenge: 'Agregação analítica em tempo real de grandes volumes de dados sem degradar a API operacional',
        solution: 'Leituras em réplicas de leitura e tabelas de sumarização geradas assincronamente',
        result: 'Dashboards analíticos instantâneos para tomada de decisão executiva',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
    ],
    legacySourceId: 'project:toot-market-intel',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-fanoty-football',
    _type: 'project',
    name: 'Fanoty Football App Migration & OPTA API (Evoke Mobile)',
    slug: { _type: 'slug', current: 'fanoty-football' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-evoke-mobile' },
    status: 'completed',
    summary:
      'Migração de backend e integração com a API da OPTA Sports Data para estatísticas de futebol ao vivo, fantasy games e engajamento de torcedores.',
    description:
      'Consumo em tempo real de lances, escalações e pontuações de partidas de futebol com transmissão instantânea para o aplicativo mobile.',
    architecture: 'Laravel, Redis Pub/Sub, WebSockets e integração direta com feeds da OPTA.',
    challenges: [
      {
        challenge: 'Picos massivos de requisições e processamento de eventos de gols durante jogos simultâneos',
        solution: 'Arquitetura baseada em eventos com Laravel Horizon e caching distribuído em Redis',
        result: 'Operação com 100% de estabilidade e baixa latência de entrega de placares',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
    ],
    legacySourceId: 'project:fanoty-football',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-sisporta',
    _type: 'project',
    name: 'Sisporta - Legacy Systems Integration (Alfasoft)',
    slug: { _type: 'slug', current: 'sisporta' },
    category: 'integration_hub',
    experience: { _type: 'reference', _ref: 'exp-alfasoft' },
    status: 'completed',
    summary:
      'Hub de integração entre sistemas industriais legados e ERPs corporativos para indústria europeia de portas e esquadrias.',
    description:
      'Barramento de comunicação em Laravel e scripts Python para conversão de formatos de dados de chão de fábrica em dados financeiros do ERP.',
    architecture: 'Laravel, Python e integração com bancos de dados relacionais.',
    challenges: [
      {
        challenge: 'Conectar sistemas industriais sem APIs modernas com ERPs em nuvem',
        solution: 'Scripts de pooling e transformação com validação de schemas em Python e Laravel',
        result: 'Automação total no fluxo de ordens de produção sem intervenção humana manual',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-python' },
    ],
    legacySourceId: 'project:sisporta',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-mylabel',
    _type: 'project',
    name: 'MyLabel Corporate Cosmetics Platform (Alfasoft)',
    slug: { _type: 'slug', current: 'mylabel' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-alfasoft' },
    status: 'completed',
    summary:
      'Portal B2B de cosméticos e personalização de marca própria para rede varejista europeia.',
    description:
      'Plataforma web em PHP permitindo a simulação, configuração de embalagens e pedidos corporativos em escala.',
    architecture: 'PHP, MySQL e arquitetura modular de serviços.',
    challenges: [
      {
        challenge: 'Cálculo dinâmico de regras de personalização e volumes mínimos de produção',
        solution: 'Motor de regras de negócio em PHP com persistência relacional otimizada',
        result: 'Lançamento bem-sucedido do portal B2B para clientes corporativos',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-php' },
    ],
    legacySourceId: 'project:mylabel',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-spider-hub',
    _type: 'project',
    name: 'Spider - Multi-Marketplace & ERP Integration Hub (Plugae)',
    slug: { _type: 'slug', current: 'spider-hub' },
    category: 'integration_hub',
    experience: { _type: 'reference', _ref: 'exp-plugae' },
    status: 'completed',
    summary:
      'Hub integradorconectando lojistas aos principais marketplaces (Mercado Livre, B2W, Magazine Luiza) e ERPs, eliminando 100% de overselling.',
    description:
      'Barramento assíncrono em Laravel, MongoDB e Redis para sincronização de catálogo, preços, estoque e conciliação de pedidos.',
    architecture: 'Laravel, MongoDB para dados não estruturados de produtos, Redis para filas de webhooks.',
    challenges: [
      {
        challenge: 'Manter estoque unificado em tempo real para múltiplos canais de venda simultâneos',
        solution: 'Fila de eventos centralizada com trava atômica em Redis para atualização de estoque',
        result: 'Eliminação total de pedidos cancelados por falta de estoque físico',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
      { _type: 'reference', _ref: 'skill-mongodb' },
      { _type: 'reference', _ref: 'skill-redis' },
    ],
    legacySourceId: 'project:spider-hub',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-pilha-push',
    _type: 'project',
    name: 'Pilha Web Push Notification & Payment Platform (Pilha Digital)',
    slug: { _type: 'slug', current: 'pilha-push' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-pilha-digital' },
    status: 'completed',
    summary:
      'Plataforma SaaS de engajamento via Web Push Notifications com checkout transparente e cobrança recorrente.',
    description:
      'Serviço em Laravel gerenciando inscrições de navegadores (Service Workers), segmentação de audiência e disparo massivo de alertas.',
    architecture: 'Laravel, MySQL, Service Workers e integração com gateways Iugu e Pagar.me.',
    challenges: [
      {
        challenge: 'Envio simultâneo de notificações push para milhares de assinantes sem estourar tempo de requisição',
        solution: 'Processamento assíncrono particionado em filas com backoff de retentativas',
        result: 'Alta taxa de conversão em campanhas de e-commerce e retenção de usuários',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-laravel' },
    ],
    legacySourceId: 'project:pilha-push',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-aso-hospital',
    _type: 'project',
    name: 'ASO Healthcare Management System (ASO)',
    slug: { _type: 'slug', current: 'aso-hospital' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-aso' },
    status: 'completed',
    summary:
      'Sistema de gestão hospitalar e medicina ocupacional para controle de exames admissionais, periódicos e emissão de laudos ASO.',
    description:
      'Software em PHP e MySQL para agendamentos médicos, prontuário eletrônico e conformidade com normas regulamentadoras do trabalho.',
    architecture: 'PHP MVC, MySQL e controle rigoroso de acesso por perfil médico.',
    challenges: [
      {
        challenge: 'Garantir segurança e sigilo de dados médicos com geração ágil de documentos legais',
        solution: 'Módulo de controle de acessos com trilha de auditoria e templates automatizados de laudos',
        result: 'Agilidade na liberação de laudos ocupacionais e conformidade legal total',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-php' },
    ],
    legacySourceId: 'project:aso-hospital',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-promoedu-training',
    _type: 'project',
    name: 'Promoedu Leadership & Coaching Platform (Promoedu)',
    slug: { _type: 'slug', current: 'promoedu-training' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-promoedu' },
    status: 'completed',
    summary:
      'Plataforma de acompanhamento e mentoria em liderança técnica e gestão executiva de equipes.',
    description:
      'Sistema para acompanhamento de planos de desenvolvimento individual (PDI), feedbacks 360 e avaliações de liderança.',
    architecture: 'Plataforma web para gestão de trilhas de treinamento e relatórios de progresso.',
    challenges: [
      {
        challenge: 'Estruturação de métricas qualitativas de liderança em planos de ação mensuráveis',
        solution: 'Metodologia de metas estruturadas com check-ins periódicos e matriz de competências',
        result: 'Capacitação eficaz de novos gestores de tecnologia',
      },
    ],
    technologies: [],
    legacySourceId: 'project:promoedu-training',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-ftd-portal',
    _type: 'project',
    name: 'FTD Corporate Portal, E-commerce & Intranet (Editora FTD)',
    slug: { _type: 'slug', current: 'ftd-portal' },
    category: 'production_saas',
    experience: { _type: 'reference', _ref: 'exp-editora-ftd' },
    status: 'completed',
    summary:
      'Portais corporativos, e-commerce educacional e intranet institucional para a Editora FTD com suporte a milhões de acessos.',
    description:
      'Ecossistema digital educacional conectando autores, professores, estudantes e equipes comerciais com integração a bases SQL Server corporativas.',
    architecture: 'Arquitetura corporativa em ASP/PHP, SQL Server com procedures otimizadas e interfaces responsivas.',
    challenges: [
      {
        challenge: 'Atender picos de milhões de acessos durante os períodos de volta às aulas',
        solution: 'Otimização de queries, procedures no SQL Server e arquitetura de cache de páginas',
        result: 'Estabilidade e continuidade por mais de uma década de operação digital pioneira',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-sql-server' },
    ],
    legacySourceId: 'project:ftd-portal',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-sap-automation-poc',
    _type: 'project',
    name: 'Autonomous SAP Fiori/GUI Automation PoC (Accenture)',
    slug: { _type: 'slug', current: 'sap-automation-poc' },
    category: 'ai_engineering_poc',
    experience: { _type: 'reference', _ref: 'exp-accenture' },
    status: 'completed',
    summary:
      'Prova de Conceito de automação autônoma de navegação e extração de dados no SAP Fiori e SAP GUI com Python, Selenium e esteira CI/CD.',
    description:
      'Desenvolvimento de automação inteligente capaz de interagir com componentes web complexos do SAP Fiori com injeção dinâmica de parâmetros e logging estruturado.',
    architecture: 'Python, Selenium WebDriver, Docker e integração com pipelines de CI/CD corporativas.',
    challenges: [
      {
        challenge: 'Lidar com dynamic IDs, iframes e renderização assíncrona profunda na interface SAP Fiori',
        solution: 'Estratégia de seletores resilientes e esperas explícitas inteligentes em Python',
        result: 'Automação ponta a ponta estável e eliminação de tarefas manuais repetitivas',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-python' },
      { _type: 'reference', _ref: 'skill-docker' },
    ],
    legacySourceId: 'project:sap-automation-poc',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'proj-financial-ai-agent',
    _type: 'project',
    name: 'Financial Analysis & Stock Intelligence AI Agent',
    slug: { _type: 'slug', current: 'financial-ai-agent' },
    category: 'ai_engineering_poc',
    status: 'completed',
    summary:
      'Agente de Inteligência Financeira e Análise de Ações utilizando LangChain, modelos LLM e recuperação RAG de demonstrações financeiras (DRE/Balanços).',
    description:
      'Sistema capaz de interpretar dados financeiros de empresas de capital aberto, sintetizar relatórios trimestrais e responder perguntas complexas sobre múltiplos de valuation.',
    architecture: 'Python, LangChain, embeddings vetoriais, FastAPI e frontend interativo em Next.js.',
    challenges: [
      {
        challenge: 'Garantir precisão numérica rigorosa e evitar alucinações em dados contábeis',
        solution: 'Recuperação baseada em tabelas com extração determinística e grounding estrito em notas explicativas',
        result: 'Análises financeiras estruturadas e confiáveis com fontes auditáveis',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-python' },
      { _type: 'reference', _ref: 'skill-rag' },
      { _type: 'reference', _ref: 'skill-nextjs' },
    ],
    legacySourceId: 'project:financial-ai-agent',
    legacyFile: 'apps/backend/src/knowledge-base/PoC-Challenges-SideProjects-Consolidated.md',
  },
  {
    _id: 'proj-rag-multimodal-poc',
    _type: 'project',
    name: 'Multimodal Document RAG & Vision Analysis PoC',
    slug: { _type: 'slug', current: 'rag-multimodal-poc' },
    category: 'ai_engineering_poc',
    status: 'completed',
    summary:
      'PoC de RAG multimodal processando simultaneamente texto, tabelas e diagramas arquiteturais em PDFs complexos com modelos de visão e embeddings.',
    description:
      'Pipeline de indexação e recuperação que segmenta páginas em blocos visuais e textuais, permitindo perguntas sobre gráficos e fluxogramas.',
    architecture: 'Python, Gemini Multimodal API, LangChain, TSVectorStore e contêineres Docker.',
    challenges: [
      {
        challenge: 'Extrair significado semântico de diagramas e fluxogramas contidos em documentos PDF',
        solution: 'Uso de modelos de visão generativa para transcrição semântica de imagens e indexação combinada',
        result: 'Capacidade de resposta fundamentada sobre especificações visuais de engenharia',
      },
    ],
    technologies: [
      { _type: 'reference', _ref: 'skill-python' },
      { _type: 'reference', _ref: 'skill-rag' },
      { _type: 'reference', _ref: 'skill-docker' },
    ],
    legacySourceId: 'project:rag-multimodal-poc',
    legacyFile: 'apps/backend/src/knowledge-base/PoC-Challenges-SideProjects-Consolidated.md',
  },
]

// ---------------------------------------------------------
// 5. ARCHITECTURE DECISIONS (9 Documentos)
// ---------------------------------------------------------
export const adrs: SanityDoc[] = [
  {
    _id: 'adr-0001',
    _type: 'architectureDecision',
    adrNumber: 1,
    title: 'ADR-0001: Meta Spec, WSCI e Protocolo Jidoka',
    status: 'accepted',
    date: '2026-08-20',
    context:
      'Necessidade de estabelecer uma governança arquitetural rigorosa sob o AI Engineering Framework v2.1 para orientar o desenvolvimento do Ask Richter com controle de qualidade Zero-Trust.',
    decision:
      'Criação da Meta Spec canônica, definição do isolamento de escopo WSCI e unificação das verificações de qualidade no comando centralizado `npm run jidoka`.',
    rationale:
      'Garante que nenhuma alteração de código ocorra sem plano validado e que a esteira pare imediatamente em qualquer regressão de tipos, linter ou testes.',
    consequences:
      'Processo de engenharia disciplinado e auditável com proteção contínua contra débitos técnicos e alucinações de agentes.',
    technologies: [
      { _type: 'reference', _ref: 'skill-technical-leadership' },
      { _type: 'reference', _ref: 'skill-zero-trust-governance' },
    ],
    legacySourceId: 'adr:0001',
    legacyFile: 'docs/adr/0001-meta-spec-e-governanca-de-arquitetura.md',
  },
  {
    _id: 'adr-0002',
    _type: 'architectureDecision',
    adrNumber: 2,
    title: 'ADR-0002: Recuperação Determinística de Chunks Sintéticos via Docstore',
    status: 'accepted',
    date: '2026-08-21',
    context:
      'Perguntas de listagem exaustiva de projetos (ex: "Quais projetos o Richter desenvolveu?") falhavam quando dependiam exclusivamente de busca vetorial aproximada por similaridade de cosseno.',
    decision:
      'Implementação da função `findSyntheticProjectListDoc` com lookup determinístico O(1) com score fixo 1.0 para intenções de listagem de projetos.',
    rationale:
      'Garante 100% de precisão e completude na listagem de projetos sem perda de itens por cutoff arbitrário de similaridade.',
    consequences:
      'Respostas perfeitas para perguntas de catálogo com integridade factual total.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0002',
    legacyFile: 'docs/adr/0002-recuperacao-deterministica-de-chunks-sinteticos.md',
  },
  {
    _id: 'adr-0003',
    _type: 'architectureDecision',
    adrNumber: 3,
    title: 'ADR-0003: Roteamento de Intenções e Extração Multi-Tecnologia',
    status: 'accepted',
    date: '2026-08-22',
    context:
      'Perguntas envolvendo múltiplas tecnologias simultâneas (ex: "Ele trabalhou com Laravel e Python?") geravam recuperação dispersa de chunks incompletos.',
    decision:
      'Criação do analisador de intenções `decomposeQuery` com extração multi-tecnologia e filtragem booleana sobre o array de metadados `technologies[]`.',
    rationale:
      'Permite intersectar tecnologias requeridas e ranquear primeiro chunks que atendem a todos os critérios da pergunta.',
    consequences:
      'Maior precisão em perguntas técnicas comparativas e filtros cruzados de competências.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0003',
    legacyFile: 'docs/adr/0003-roteamento-de-intencoes-e-extracao-multi-tecnologia.md',
  },
  {
    _id: 'adr-0004',
    _type: 'architectureDecision',
    adrNumber: 4,
    title: 'ADR-0004: Isolamento de Escopo de Metadados em Ingestão',
    status: 'accepted',
    date: '2026-08-23',
    context:
      'Vazamento de metadados entre seções adjacentes durante o split automático de markdown prejudicava a classificação dos chunks.',
    decision:
      'Definição de regras estritas de isolamento de escopo e enriquecimento determinístico de metadados durante a criação de chunks.',
    rationale:
      'Impede que tecnologias de uma experiência passada sejam incorretamente associadas a projetos de outra empresa.',
    consequences:
      'Eliminação de falsos positivos na filtragem de tecnologias do motor de RAG.',
    technologies: [
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0004',
    legacyFile: 'docs/adr/0004-isolamento-de-escopo-de-metadados-em-ingestao.md',
  },
  {
    _id: 'adr-0005',
    _type: 'architectureDecision',
    adrNumber: 5,
    title: 'ADR-0005: Provider-Agnostic AI Architecture',
    status: 'accepted',
    date: '2026-08-24',
    context:
      'Lock-in em SDKs proprietários dificultava a alternância entre provedores de IA e a realização de testes offline.',
    decision:
      'Desenvolvimento de uma camada de abstração com interfaces polimórficas `LLMProvider` e `EmbeddingProvider` no `ProviderFactory`.',
    rationale:
      'Desacopla o núcleo da aplicação dos detalhes de implementação dos provedores (Gemini, OpenRouter, HuggingFace, Ollama).',
    consequences:
      'Flexibilidade total para troca de modelo em runtime e independência de fornecedor.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-gemini-api' },
      { _type: 'reference', _ref: 'skill-openai-api' },
    ],
    legacySourceId: 'adr:0005',
    legacyFile: 'docs/adr/0005-provider-agnostic-ai-architecture.md',
  },
  {
    _id: 'adr-0006',
    _type: 'architectureDecision',
    adrNumber: 6,
    title: 'ADR-0006: LLM Provider Resilience and Fallback',
    status: 'accepted',
    date: '2026-08-25',
    context:
      'Instabilidades transitórias (erros HTTP 429/503) em provedores de LLM causavam falhas diretas nas respostas aos usuários.',
    decision:
      'Implementação de `ResilientLLMProvider` com retentativas exponenciais com jitter (`retryWithBackoff`) e cadeia de fallback automática (`Gemini -> OpenRouter -> HuggingFace -> Ollama`).',
    rationale:
      'Garante que falhas transitórias em um provedor sejam absorvidas sem impactar a experiência do usuário final.',
    consequences:
      'Elevada disponibilidade e resiliência na geração de respostas de chat.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-gemini-api' },
    ],
    legacySourceId: 'adr:0006',
    legacyFile: 'docs/adr/0006-llm-provider-resilience-and-fallback.md',
  },
  {
    _id: 'adr-0007',
    _type: 'architectureDecision',
    adrNumber: 7,
    title: 'ADR-0007: FAISS Elimination and TS Vector Search',
    status: 'accepted',
    date: '2026-08-26',
    context:
      'O pacote nativo C++ `faiss-node` impedia a execução direta do RAG em ambientes Serverless na Vercel devido a binários incompatíveis.',
    decision:
      'Substituição completa do `faiss-node` pelo `TSVectorStore` em TypeScript puro, carregando vetores normalizados de 768 dimensões com cálculo in-memory de similaridade de cosseno.',
    rationale:
      'Permite rodar 100% da pipeline de RAG dentro das Serverless Functions da Vercel com cold start inferior a 50ms e zero dependências nativas.',
    consequences:
      'Eliminação de custos com servidores externos no Render e simplificação drástica da arquitetura de deploy.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0007',
    legacyFile: 'docs/adr/0007-faiss-elimination-and-ts-vector-search.md',
  },
  {
    _id: 'adr-0008',
    _type: 'architectureDecision',
    adrNumber: 8,
    title: 'ADR-0008: Lexical Retriever Modernization',
    status: 'accepted',
    date: '2026-08-27',
    context:
      'Buscas léxicas baseadas em correspondência de strings simples falhavam em termos com variações morfológicas ou stopwords.',
    decision:
      'Modernização do retriever léxico híbrido com TF-IDF e tokenização da biblioteca `natural`, combinando scores léxicos e vetoriais.',
    rationale:
      'Melhora a recuperação de termos técnicos exatos e siglas específicas da área de engenharia de software.',
    consequences:
      'Equilíbrio perfeito entre precisão semântica (vetorial) e precisão de termos exatos (léxica).',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-rag' },
    ],
    legacySourceId: 'adr:0008',
    legacyFile: 'docs/adr/0008-lexical-retriever-modernization.md',
  },
  {
    _id: 'adr-0009',
    _type: 'architectureDecision',
    adrNumber: 9,
    title: 'ADR-0009: Supabase Resilience and State Machine',
    status: 'accepted',
    date: '2026-08-28',
    context:
      'Instâncias gratuitas do Supabase entram em modo cold pause após períodos de inatividade, gerando falhas de conexão para usuários.',
    decision:
      'Criação da máquina de 7 estados determinísticos (`READY`, `PAUSED`, `WAKING`, `UNAVAILABLE`, `TIMEOUT`, `AUTH_ERROR`, `UNKNOWN`), Regra de Ouro da Não-Inferência e restore server-side via Management API.',
    rationale:
      'Garante recuperação automática do banco de dados com feedback transparente na interface sem expor chaves administrativas ao cliente.',
    consequences:
      'Resiliência ponta a ponta e recuperação transparente de projetos pausados.',
    technologies: [
      { _type: 'reference', _ref: 'skill-typescript' },
      { _type: 'reference', _ref: 'skill-supabase' },
    ],
    legacySourceId: 'adr:0009',
    legacyFile: 'docs/adr/0009-supabase-resilience-and-state-machine.md',
  },
]

// ---------------------------------------------------------
// 6. ACHIEVEMENTS (12 Documentos)
// ---------------------------------------------------------
export const achievements: SanityDoc[] = [
  {
    _id: 'ach-midstay-retention-30',
    _type: 'achievement',
    title: '+30% de Retenção de Usuários na Turno (Mid-Stay Projects)',
    metric: '+30% Retenção',
    category: 'growth',
    context: 'Concepção e liderança da arquitetura da funcionalidade Mid-Stay Projects na Turno, viabilizando estadias de médio prazo e elevando a retenção de clientes em 30%.',
    experience: { _type: 'reference', _ref: 'exp-turno' },
    legacySourceId: 'achievement:midstay-retention-30',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-turno-latency-40',
    _type: 'achievement',
    title: '40% de Redução na Latência de Endpoints na Turno',
    metric: '-40% Latência',
    category: 'performance',
    context: 'Otimização de consultas Eloquent complexas, indexação estratégica de banco de dados e caching em endpoints críticos de alto tráfego na Turno.',
    experience: { _type: 'reference', _ref: 'exp-turno' },
    legacySourceId: 'achievement:turno-latency-40',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-turno-100-tests',
    _type: 'achievement',
    title: '100+ Testes Automatizados Corrigidos e Estabilizados no Jenkins',
    metric: '100+ Testes Estabilizados',
    category: 'devops_ci_cd',
    context: 'Refatoração de suíte de testes de integração e unitários intermitentes no Jenkins, estabilizando as esteiras de integração contínua na Turno.',
    experience: { _type: 'reference', _ref: 'exp-turno' },
    legacySourceId: 'achievement:turno-100-tests',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-shosales-10x-speed',
    _type: 'achievement',
    title: '10x Page Load Speed no Shosales',
    metric: '10x Speed',
    category: 'performance',
    context: 'Modernização arquitetural completa do portal imobiliário Shosales no Reino Unido, reduzindo drasticamente o tempo de carregamento com Laravel e Vue.js.',
    experience: { _type: 'reference', _ref: 'exp-full-comms' },
    legacySourceId: 'achievement:shosales-10x-speed',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-evoke-30x-map-render',
    _type: 'achievement',
    title: '30x Aceleração na Renderização de 200k+ Registros Geoespaciais',
    metric: '30x Speed (200k+ records)',
    category: 'performance',
    context: 'Algoritmo de clustering e processamento assíncrono para renderização de mais de 200 mil pontos de GPS em mapas de telemetria na Evoke Mobile.',
    experience: { _type: 'reference', _ref: 'exp-evoke-mobile' },
    legacySourceId: 'achievement:evoke-30x-map',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-evoke-500x-queues',
    _type: 'achievement',
    title: '500x Aceleração em Processamento de Filas com Laravel Horizon',
    metric: '500x Queue Processing',
    category: 'performance',
    context: 'Reestruturação de processamento de filas assíncronas com Laravel Horizon e Redis, escalando a taxa de processamento de eventos na Evoke Mobile.',
    experience: { _type: 'reference', _ref: 'exp-evoke-mobile' },
    legacySourceId: 'achievement:evoke-500x-queues',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-spider-zero-overselling',
    _type: 'achievement',
    title: 'Eliminação de Overselling e Sincronização em Tempo Real na Plugae',
    metric: 'Zero Overselling',
    category: 'security_reliability',
    context: 'Desenvolvimento do hub Spider com conciliação atômica de estoque entre Mercado Livre, B2W e ERPs, zerando cancelamentos por falta de produto.',
    experience: { _type: 'reference', _ref: 'exp-plugae' },
    legacySourceId: 'achievement:spider-zero-overselling',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-brnow-voice-sip',
    _type: 'achievement',
    title: 'Atendimento Telefônico SIP em Produção com Agente de Voz e Billing por Minuto',
    metric: 'Produção SIP / Billing Ativo',
    category: 'ai_automation',
    context: 'Implementação de agente de voz com IA conversacional em produção com telefonia SIP/WebRTC em tempo real e orquestração Docker Swarm.',
    project: { _type: 'reference', _ref: 'proj-brnow-voice-saas' },
    legacySourceId: 'achievement:brnow-voice-sip',
    legacyFile: 'apps/backend/src/knowledge-base/Experience-Consolidated.md',
  },
  {
    _id: 'ach-accenture-sap-poc',
    _type: 'achievement',
    title: 'Automação Autônoma no SAP Fiori/GUI com Python e CI/CD Integrado',
    metric: 'Automação End-to-End',
    category: 'ai_automation',
    context: 'Desenvolvimento de PoC pioneira de automação autônoma no SAP Fiori com injeção dinâmica de parâmetros e validação em pipelines na Accenture.',
    experience: { _type: 'reference', _ref: 'exp-accenture' },
    legacySourceId: 'achievement:accenture-sap-poc',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-askrichter-serverless-coldstart',
    _type: 'achievement',
    title: 'RAG 100% Serverless com Cold Start < 50ms e Custo Zero Ocioso',
    metric: '<50ms Cold Start',
    category: 'performance',
    context: 'Arquitetura do TSVectorStore em TypeScript eliminando dependências nativas C++ e viabilizando execução de RAG na Vercel com custo zero ocioso.',
    project: { _type: 'reference', _ref: 'proj-ask-richter' },
    legacySourceId: 'achievement:askrichter-serverless',
    legacyFile: 'README.md',
  },
  {
    _id: 'ach-ftd-13years-impact',
    _type: 'achievement',
    title: '13 Anos de Desenvolvimento de Portais Corporativos e E-commerce na FTD',
    metric: '13+ Anos de Continuidade',
    category: 'growth',
    context: 'Construção contínua da presença digital e comércio eletrônico educacional da Editora FTD com suporte a milhões de usuários.',
    experience: { _type: 'reference', _ref: 'exp-editora-ftd' },
    legacySourceId: 'achievement:ftd-13years',
    legacyFile: 'apps/backend/src/knowledge-base/CV-Consolidated.md',
  },
  {
    _id: 'ach-multilingual-m15',
    _type: 'achievement',
    title: 'Suporte Multilíngue (EN/PT/ES) com 100% de Alinhamento de Idioma no Ask Richter',
    metric: '100% Multilingual Parity',
    category: 'ai_automation',
    context: 'Implementação de diretrizes rígidas de Language Parity (M15) garantindo respostas no idioma exato da pergunta com fundamentação factual estrita.',
    project: { _type: 'reference', _ref: 'proj-ask-richter' },
    legacySourceId: 'achievement:multilingual-m15',
    legacyFile: 'README.md',
  },
]

// ---------------------------------------------------------
// EXPORTAÇÃO COMPLETA (101 Documentos em DAG de 4 Fases)
// ---------------------------------------------------------
export const allDocuments: SanityDoc[] = [
  ...skills,        // Fase 1 (38 docs)
  ...experiences,   // Fase 2 (10 docs)
  ...education,     // Fase 2 (14 docs)
  ...projects,      // Fase 3 (18 docs)
  ...adrs,          // Fase 3 (9 docs)
  ...achievements,  // Fase 4 (12 docs)
]

export async function runIngestion(client = getCliClient({ apiVersion: '2024-01-01' })) {
  console.log(`Starting migration of ${allDocuments.length} documents...`)
  const startTime = Date.now()

  let succeeded = 0
  let failed = 0
  const errors: any[] = []

  // Fase 1: Skills
  console.log(`\n[Phase 1/4] Ingesting ${skills.length} Skills...`)
  for (const doc of skills) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest skill ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }

  // Fase 2: Experiences & Education
  console.log(`\n[Phase 2/4] Ingesting ${experiences.length} Experiences & ${education.length} Education documents...`)
  for (const doc of experiences) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest experience ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }
  for (const doc of education) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest education ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }

  // Fase 3: Projects & Architecture Decisions
  console.log(`\n[Phase 3/4] Ingesting ${projects.length} Projects & ${adrs.length} ADRs...`)
  for (const doc of projects) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest project ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }
  for (const doc of adrs) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest ADR ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }

  // Fase 4: Achievements
  console.log(`\n[Phase 4/4] Ingesting ${achievements.length} Achievements...`)
  for (const doc of achievements) {
    try {
      await client.createOrReplace(doc)
      succeeded++
    } catch (err: any) {
      console.error(`Failed to ingest achievement ${doc._id}:`, err.message)
      errors.push({ id: doc._id, error: err.message })
      failed++
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\nMigration completed in ${duration}s. Succeeded: ${succeeded}, Failed: ${failed}`)

  return {
    attempted: allDocuments.length,
    succeeded,
    failed,
    errors,
    duration,
  }
}


