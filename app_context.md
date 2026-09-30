# App Context Snapshot

**Generated on:** 2026-09-30  
**Application Name:** Ask Richter — AI Career Agent & Structured Knowledge Platform

---

## 1. Application Scope & Purpose

O **Ask Richter** é um Agente de Carreira com Inteligência Artificial (*AI Career Agent*) e plataforma de conhecimento estruturado projetado para responder consultas técnicas, profissionais e biográficas sobre a trajetória, arquitetura de sistemas, projetos entregues, competências e decisões de engenharia de Luís Fernando Richter.

### Domínio e Core Business Logic
1. **Atendimento Especializado a Recrutadores e Engenheiros:** Processa consultas em linguagem natural nos idiomas Inglês (EN), Português (PT) e Espanhol (ES), mantendo alinhamento estrito de idioma (*Language Parity - M15*) entre a pergunta e a resposta.
2. **Fundamentação Factual Estrita (Anti-Hallucination):** Responde exclusivamente com base nas evidências factuais presentes no repositório de conhecimento, com abstenção explícita quando uma informação não constar nos dados.
3. **Desambiguação Ontológica de Projetos vs. Formação:** Diferencia rigorosamente projetos de software em produção de cursos, certificações ou estudos acadêmicos.
4. **Resiliência e Continuidade Operacional:** Gerencia o ciclo de vida e restauração server-side de instâncias pausadas do Supabase e executa RAG 100% Serverless com inicialização ultrarrápida (*cold start* < 50ms).

---

## 2. Tech Stack & Dependencies

* **Frontend:**
  * **Framework:** Next.js 15.5.22 (React 19.1.0 / 19.1.1, App Router).
  * **Estilização & UI:** Vanilla CSS, TailwindCSS 3.4.17 (com plugins de tipografia e animação), Lucide React 0.536.0, Framer Motion 12.23.12.
  * **Gerenciamento de Estado:** React Hooks nativos (`useState`, `useReducer`, `useCallback`, `useRef`), Server Actions e Route Handlers (`/api/chat`, `/api/supabase/status`, `/api/supabase/restore`).
  * **Build & Bundler:** Turbopack / Webpack integrado ao Next.js, Turborepo 2.10.8.

* **Backend:**
  * **Runtime & Linguagem:** Node.js (>= 22.0.0), TypeScript 5.8.3 executado via `tsx`.
  * **Protocolos de API:** REST / HTTP Streaming (Server-Sent Events para geração de tokens no chat).
  * **Camada de Orquestração AI Legada/Scripts:** `@langchain/core` (0.3.72), `@langchain/community` (0.3.53), `natural` (8.1.0) para tokenização e TF-IDF.
  * **Sanity Studio (`apps/studio`):** Sanity v3.78.0 com React 19, TypeScript e CLI integrada (`sanity.cli.ts`).

* **Database & Caching:**
  * **Sanity Content Lake (Nova Camada de Conhecimento):** Dataset `production` (Project ID: `q19ey6yx`), schemas tipados (`skill`, `experience`, `project`, `education`, `achievement`, `architectureDecision`), consultas declarativas em GROQ e integridade referencial via grafo acíclico.
  * **Supabase (Camada Relacional & Logs):** PostgreSQL remoto acessado via `@supabase/supabase-js` (2.53.0), tabela `client_errors` para telemetria de erros, máquina de 7 estados e restore server-side.
  * **Armazenamento Vetorial & Léxico em Memória (RAG V2):** `TSVectorStore` (`docstore.json` + `vectors.json` de 768 dimensões) sem dependências C++/binárias, viabilizando execução Serverless na Vercel.

* **Infrastructure & DevOps:**
  * **Monorepo:** Turborepo 2.10.8 gerenciando `apps/frontend`, `apps/backend`, `apps/studio`, `apps/web`, `apps/docs` e pacotes compartilhados (`@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`).
  * **Hospedagem & Deployment:** Vercel (Edge/Serverless Runtime para Frontend/RAG) e Sanity Cloud (Content Lake).
  * **Esteira de Qualidade (Jidoka):** Pipeline automatizada (`npm run jidoka`) validando typecheck, linting e builds em todos os 8 pacotes com Full Turbo.

* **Key Core Dependencies:**
  1. `@google/genai` (v2.17.1) / `@google/generative-ai` — Provedor primário de embeddings (`gemini-embedding-2`) e geração LLM (`gemini-2.5-flash` / `gemini-3.6-flash`).
  2. `sanity` (v3.78.0) — CMS headless, Content Lake e Studio de gerenciamento ontológico.
  3. `@supabase/supabase-js` (v2.53.0) — Cliente Supabase com isolamento de credenciais e telemetria.
  4. `natural` (v8.1.0) — Algoritmo de tokenização e TF-IDF para o retriever léxico serverless.
  5. `framer-motion` (v12.23.12) & `lucide-react` (v0.536.0) — Componentes visuais interativos e micro-animações do Chat UI.

---

## 3. Architecture & Design Patterns

O sistema adota uma arquitetura híbrida distribuída em Monorepo orientada a microsserviços e isolamento de responsabilidades:

```text
ask-richter/
├── apps/
│   ├── frontend/         # Next.js 15 App Router: UI de Chat, RAG Serverless V2, Status Supabase
│   ├── studio/           # Sanity Studio v3: Content Lake, Schemas Ontológicos e Scripts de Migração
│   ├── backend/          # Node.js/TS: Scripts de indexação legados, provedores de IA, knowledge-base MD
│   ├── web/              # Next.js 15: Landing Page e portfólio web
│   └── docs/             # Next.js 15: Documentação viva do ecossistema
├── packages/
│   ├── ui/               # Biblioteca de componentes visuais compartilhados (@repo/ui)
│   ├── eslint-config/    # Configurações canônicas de linting (@repo/eslint-config)
│   └── typescript-config/# Configurações base do TypeScript (@repo/typescript-config)
└── docs/
    ├── adr/              # Registros formais de Decisões Arquiteturais (ADR-0001 a ADR-0010)
    ├── snapshots/        # Snapshots de congelamento de baseline (2026-08-26, 2026-08-27, 2026-09-28, 2026-09-29)
    └── Plans/            # Planos e Roadmaps de Evolução Arquitetural
```

### Padrões Arquiteturais e Fluxo de Dados

1. **RAG Serverless V2 (`apps/frontend/src/app/api/chat/route.ts`):**
   * **Entrada:** Pergunta do usuário via POST/Stream.
   * **Vetorização:** Extração de vetor 768d via `GeminiEmbeddingService`.
   * **Roteamento de Intenções (`decomposeQuery`):**
     * `LIST_PROJECTS`: Busca determinística O(1) via synthetic chunk (`findSyntheticProjectListDoc`).
     * `PROJECT_TECHNOLOGY_SEARCH`: Filtragem booleana por metadados de tecnologia + similaridade por cosseno.
     * `SIMPLE_SEARCH`: `ServerlessHybridRetriever` combinando busca léxica TF-IDF e vetorial in-memory.
   * **Filtro de Diversidade & Token Budget:** Aplica teto de chunks por seção/projeto e poda para o orçamento máximo de 2.800 tokens.
   * **Geração:** Invocação do `GeminiLLMProvider` com System Prompt estrito contra alucinações e alinhamento multilíngue.

2. **Resiliência do Supabase e Máquina de 7 Estados (ADR-0009):**
   * Classificação determinística (`READY`, `PAUSED`, `WAKING`, `UNAVAILABLE`, `TIMEOUT`, `AUTH_ERROR`, `UNKNOWN`).
   * *Regra de Ouro da Não-Inferência:* Falhas de rede, DNS ou timeouts nunca são confundidas com projeto pausado.
   * Descongelamento protegido via endpoint server-side `/api/supabase/restore` (chamando a Management API da Supabase com token privado).

3. **Arquitetura Polimórfica e Fallback de Provedores de IA (ADR-0005 / ADR-0006):**
   * Camada agnóstica de provedores (`Gemini`, `OpenRouter`, `HuggingFace`, `Ollama`).
   * Mecanismo de retentativas exponenciais (`retryWithBackoff`) para erros transitórios (429/503) e fail-fast para erros de autenticação (401).

---

## 4. Integrations & External Services

1. **Google GenAI API:**
   * **Serviços:** `gemini-embedding-2` (768 dimensões) e `gemini-2.5-flash` / `gemini-3.6-flash`.
   * **Autenticação:** Chave de API de servidor (`GEMINI_API_KEY`).
2. **Sanity Content Lake:**
   * **Serviços:** Content Lake (Project `q19ey6yx`, Dataset `production`), GROQ Query Engine, Sanity Studio.
   * **Autenticação:** Token de usuário autenticado / Deploy via Sanity CLI e tokens de API via `@sanity/client`.
3. **Supabase Management API & Database:**
   * **Serviços:** PostgreSQL Database, REST API (`/rest/v1`), Management API (`/v1/projects/{ref}/restore`).
   * **Autenticação:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ACCESS_TOKEN`.
4. **Provedores de IA Secundários (Fallback):**
   * OpenRouter API (`OPENROUTER_API_KEY`), Hugging Face API (`HUGGINGFACE_API_KEY`), Ollama (Endpoint local `http://localhost:11434`).
5. **Vercel Platform:**
   * **Serviços:** Serverless Functions, Edge Network, CI/CD de deploy contínuo.

---

## 5. Testing & Quality Assurance

* **Testing Frameworks:**
  * Node.js Native Test Runner (`node:test` via `npx tsx --test`) para frontend e backend.
  * Turborepo pipeline para paralelização e caching de testes e linters.
* **Test Coverage (170 testes / 16 suítes — 100% Pass):**
  * **Frontend (151 testes):**
    * `server/sanity/agent-eligibility.test.ts` (14 testes): Elegibilidade de queries agênticas multi-hop e conexões em PT e EN.
    * `server/sanity/agent-integration.test.ts` (16 testes): Integração M4 Agentic no orquestrador e rota `/api/chat`.
    * `server/sanity/agent-planner.test.ts` (18 testes): Planejamento determinístico e validação de ferramentas permitidas.
    * `server/sanity/chat-integration.test.ts` (23 testes): Integração e despacho de intenções, abstenções factuais e paridade multilíngue/negativa (B12).
    * `server/sanity/knowledge-graph-retriever.test.ts` (18 testes): Travessia em grafo, expansão STAR, detecção de ciclos e limites.
    * `server/sanity/semantic-integration.test.ts` (10 testes): Integração M3 Semantic Retrieval e fallback de buscas livres.
    * `server/sanity/semantic-retriever.test.ts` (10 testes): Motor de busca semântica e cálculo de score.
    * `server/sanity/structured-retriever.test.ts` (10 testes): M2 Structured Retrieval, consultas GROQ e orçamentação de tokens.
    * `m15-multilingual.test.ts` (3 testes): Paridade e alinhamento multilíngue (EN/PT/ES).
    * `rag/parity.test.ts` (4 testes): Similaridade de cosseno, decomposição de queries e poda de tokens.
    * `routing.test.ts` (4 testes): Isolamento de rotas relativas na Vercel e invariantes de produção.
    * `supabase/chaos-verification.test.ts` (28 testes): Matriz de 22 cenários de caos, 5 invariantes comportamentais e Regra da Não-Inferência.
    * `supabase/restore-service.test.ts` (12 testes): Descongelamento via Management API e idempotência.
    * `supabase/status-classifier.test.ts` (14 testes): Classificação dos 7 estados da máquina de status.
  * **Backend (19 testes):**
    * `factory/provider-factory.test.ts` (5 testes): Instanciação de provedores dinâmicos.
    * `providers/gemini/gemini-embedding-provider.test.ts` (4 testes): Retentativas exponenciais de embeddings 768d.
    * `providers/resilient-llm-provider.test.ts` (10 testes): Resiliência e cascata de fallbacks de LLM.
* **Quality & Governance Tools:**
  * ESLint 9 (Flat Config no Studio via `@sanity/eslint-config-studio`, ESLint clássico nos apps Next.js).
  * TypeScript 5.8.3 (`check-types` sem emissão em todos os 8 pacotes).
  * Protocolo Jidoka (`npm run jidoka` executando 14 tasks com Full Turbo).

---

## 6. Current State & Known Technical Debt

### 📌 Ponto de Virada Histórico: Snapshot 2026-09-28 (`docs/snapshots/snapshot - 2026-09-28.md`)
Em **28 de Setembro de 2026**, no commit `d13b4be`, foi realizado o congelamento formal do baseline pré-Sanity (**Milestone M0 — Baseline Freeze**). O snapshot garantiu a integridade inegociável de:
* 84 testes passando sem regressões;
* Motor RAG Serverless V2 plenamente operacional em produção;
* Isolamento total do Supabase e rotas da Vercel.

### 🚀 Marcos Concluídos: Plataforma Sanity (M1 a M6-B)
Em **29 e 30 de Setembro de 2026**, a arquitetura de conhecimento estruturado e recuperação semântica/agêntica/híbrida foi implementada, testada e consolidada de ponta a ponta:

1. **M1 Foundation (100% Concluído):**
   * **M1.1 (Studio Setup):** `apps/studio` configurado com Sanity v3.78.0, React 19 e ESLint 9.
   * **M1.2 (Modelagem Ontológica):** 6 schemas criados (`skill`, `experience`, `project`, `education`, `achievement`, `architectureDecision`).
   * **M1.3 (Deploy & Ingestão Piloto):** Schemas publicados no dataset `production` (`q19ey6yx`), 20 documentos piloto ingeridos com IDs determinísticos e prova de idempotência ($0 \to 20 \to 20$).
   * **M1.4 (Auditoria Semântica & Manifesto):** Auditoria dos 401 chunks legados (0 unmapped) e geração do manifesto `migration-manifest.json` com 101 documentos canônicos e 121 referências.
   * **M1.5 (Migração Integral):** Ingestão completa de todos os 101 documentos para o Content Lake via `full-ingest.ts` ($20 \to 101 \to 101$), com 121/121 referências resolvidas, integridade de proveniência 100% e zero caminhos absolutos.
   * **MCP Server Declarativo:** Servidor Sanity MCP configurado em `.agents/mcp_config.json`.

2. **M2 Structured Retrieval (100% Concluído — Gate GO):**
   * **Phase A (Módulo Isolado Server-Side):**
     * `client.ts`: Cliente HTTP nativo com `AbortController` (timeout de 2.500ms) e tipagem de erros.
     * `queries.ts`: 7 consultas GROQ declarativas sem interpolação de strings e classificador `detectStructuredIntent`.
     * `structured-retriever.ts`: Formatador de contexto com orçamento de tokens (`CONTEXT_BUDGET_TOKENS = 2800`).
     * `orchestrator.ts`: Máquina de fallback determinístico com status explícito (`success`, `fallback_success`, `no_evidence`, `retrieval_error`) e `abstained: true`.
   * **Phase B (Integração Cirúrgica no `/api/chat`):**
     * Roteamento de consultas estruturadas para o Sanity com fallback automático para `smartSearch` / `TSVectorStore`.
     * Abstenção explícita no endpoint (`[STATUS: NENHUMA EVIDÊNCIA FACTUAL ENCONTRADA NA BASE DE DADOS]`) eliminando alucinações.

3. **M3 Semantic Retrieval & Hybrid Search (100% Concluído — Gate GO):**
   * **M3.1 (Habilitação de Dataset Embeddings no Content Lake):**
     * Dataset Embeddings nativos configurados e ativos no dataset `production` com projeção multi-tipo sem referências (`->`), status `ready` e embeddings gerenciados 100% pelo Sanity.
   * **Phase A (Módulo Isolado `SemanticRetriever`):**
     * `semantic-retriever.ts`: Motor de busca semântica, lexical e híbrida com cálculo de score via `text::semanticSimilarity($query)` + `score()`, deduplicação de entidades, formatação com metadados estruturados e poda estrita de tokens (`CONTEXT_BUDGET_TOKENS = 2800`).
     * Suíte T11–T20 em `semantic-retriever.test.ts` (10/10 PASS).
     * Avaliação empírica comparativa em 5 categorias demonstrando superioridade de recall contextual em modo `semantic`.
   * **Phase B (Integração no Orquestrador e `/api/chat`):**
     * `RetrievalOrchestrator.orchestrateFreeform()`: Roteamento de perguntas abertas/livres para o `SemanticRetriever` do Sanity com fallback transparente para `TSVectorStore` em caso de erro/timeout.
     * Suíte B11–B20 em `semantic-integration.test.ts` (10/10 PASS).

4. **M4 Agentic Capabilities & Knowledge Graph (100% Concluído — Gate GO):**
   * **Phase A (Motor Isolado de Grafo de Conhecimento):**
     * `knowledge-graph-retriever.ts`: Travessia determinística multi-hop (Hop 0, Hop 1 referências diretas, Hop 2 conexões secundárias e métricas STAR) com guardas estritas (`MAX_TOOL_HOPS = 2`, `MAX_TOOL_CALLS = 4`, `GLOBAL_TIMEOUT_MS = 4000`, detecção de ciclos e zero-mutation).
     * Suíte A1–A18 em `knowledge-graph-retriever.test.ts` (100% PASS).
   * **Phase B (Planejador Agêntico e Schemas de Ferramentas):**
     * `agent-planner.ts`: Schemas JSON formais para as 6 ferramentas de leitura (`ALLOWED_TOOLS`), planejamento determinístico, sanitização contra Prompt Injection e execução limitada.
     * Suíte B1–B18 em `agent-planner.test.ts` (100% PASS).
   * **Phase C (Integração da Tri-Retrieval Engine no `/api/chat`):**
     * `agent-eligibility.ts`: Política semântica estrutural para seleção de consultas relacionais multi-hop sem hardcodes de entidades.
     * `orchestrator.ts`: Adicionado `orchestrateAgentic()` com proveniência completa e fallback determinístico para `TSVectorStore`.
     * `route.ts`: Roteamento seletivo em 4 camadas (M2 Structured ➔ M4 Agentic ➔ M3 Semantic ➔ Fallback TSVectorStore).
     * Suíte C1–C16 em `agent-integration.test.ts` (100% PASS).

5. **M5 Smoke & Bug Resolution (100% Concluído):**
   * Resolução da quota do Tier 1, correção de schemas de retorno e validação HTTP em tempo real.

6. **M6 Full Regression Suite & M6-B Surgical Intent Routing Fix (100% Concluído — GREEN `c858972`):**
   * Resolução cirúrgica dos gaps de routing identificados na auditoria de regressão:
     - **T07:** Detecção de relacionamentos multi-entidade roteando para `M4_AGENTIC`.
     - **T10:** Guarda ordinal/específica (`isOrdinalOrRelational`) separando consultas pontuais de catálogo e roteando para `M3_SEMANTIC` com abstenção factual segura (Zero Hallucination).
     - **ML_EN:** Paridade multilíngue completa no vocabulário de projetos (`hasProjectContext`), permitindo que "Which projects use React?" ative `M2_STRUCTURED / PROJECT_BY_TECH` com paridade perfeita em relação ao PT e ES.
   * Execução e aprovação de 17/17 casos HTTP reais na suíte de regressão de ponta a ponta (`docs/Plans/Evolve-to-Sanity/Test-Runs/`).
   * Total de testes elevado para **170 testes verdes** (151 frontend + 19 backend) sem regressões.

### Débitos Técnicos Identificados & Áreas em Transição
1. **Coexistência de Fontes de Verdade em Transição:** O `TSVectorStore` (`docstore.json` / `vectors.json`) atua como fallback resiliente e secundário caso o Sanity Content Lake fique indisponível.
2. **Scripts Legados no Backend:** O diretório `apps/backend/src/scripts/` ainda possui ferramentas legadas do LangChain/FAISS mantidas como documentação histórica e toolkit offline.


