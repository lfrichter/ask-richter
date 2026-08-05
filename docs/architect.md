# Index de Arquitetura & Mapa Mental — AskRichter

> **Documento de Referência:** Mapa Mental e Índice da Arquitetura do Projeto AskRichter  
> **Constituição:** [.askrichter-spec.md](file:///Users/master/projects/chatbot/ask-richter/.askrichter-spec.md)

---

## 1. Visão Geral da Arquitetura

O **AskRichter** é construído como um monorepo modular utilizando **Turborepo**. A aplicação combina um **Frontend em Next.js 15** hospedado na Vercel com um **Backend em Node.js / Express** hospedado no Render.com. O motor de busca contextual baseia-se na técnica de **Retrieval-Augmented Generation (RAG)** com vetorização FAISS persistida no **Supabase Storage**.

```mermaid
graph LR
    SubGraphFrontend["App Frontend (Next.js 15)"] -- REST API --> SubGraphBackend["App Backend (Express + LangChain)"]
    SubGraphBackend -- Leitura do Índice --> FAISS["Índice FAISS em /tmp"]
    SubGraphBackend -- Startup Sync --> Supabase["Supabase Storage (faiss-index)"]
    SubGraphBackend -- Inferencia LLM --> OpenRouter["OpenRouter / HF / Ollama API"]
```

---

## 2. Taxonomia de Componentes

### 2.1 Apps (`/apps`)
- **[`backend`](file:///Users/master/projects/chatbot/ask-richter/apps/backend/package.json):** API REST em Express, RAG Pipeline com FAISS e LangChain, roteamento multi-provedor de LLMs.
- **[`frontend`](file:///Users/master/projects/chatbot/ask-richter/apps/frontend/package.json):** Interface de usuário reativa em Next.js 15, i18n, componentes Tailwind CSS/Framer Motion.

### 2.2 Infraestrutura & Configurações Globais
- **[`render.yaml`](file:///Users/master/projects/chatbot/ask-richter/render.yaml):** Definição de build e runtime do serviço backend no Render.com.
- **[`vercel.json`](file:///Users/master/projects/chatbot/ask-richter/vercel.json):** Configurações de deploy do frontend na Vercel.
- **[`turbo.json`](file:///Users/master/projects/chatbot/ask-richter/turbo.json):** Pipeline de tarefas Turborepo (build, dev, lint, check-types).

---

## 3. Índice de ADRs (Architecture Decision Records)

Todas as decisões arquiteturais e mudanças estruturais no projeto são registradas de forma imutável e numerada no diretório [`docs/adr/`](file:///Users/master/projects/chatbot/ask-richter/docs/adr/).

| Registro | Título | Data | Status |
| :--- | :--- | :--- | :--- |
| [ADR-0001](file:///Users/master/projects/chatbot/ask-richter/docs/adr/0001-meta-spec-e-governanca-de-arquitetura.md) | Definição da Meta Spec, Isolamento WSCI e Protocolo Jidoka | 2026-08-05 | Aprovado |

---

## 4. Engenharia de Contexto WSCI (Isolamento de Escopo & Worktrees)

Ao atuar em qualquer tarefa, siga a divisão estrita de escopo:
1. **Scope `Frontend`**: [`apps/frontend/`](file:///Users/master/projects/chatbot/ask-richter/apps/frontend/) (Comando isolado: `npm run dev --workspace=frontend`).
2. **Scope `Backend`**: [`apps/backend/`](file:///Users/master/projects/chatbot/ask-richter/apps/backend/) (Comando isolado: `npx turbo run dev --filter=backend`).
3. **Scope `Infra`**: Configurações na raiz do repositório ([`render.yaml`](file:///Users/master/projects/chatbot/ask-richter/render.yaml), [`vercel.json`](file:///Users/master/projects/chatbot/ask-richter/vercel.json), [`package.json`](file:///Users/master/projects/chatbot/ask-richter/package.json)).
4. **Refatorações Estruturais:** Criar Git Worktree física antes de iniciar: `git worktree add ../askrichter-<feature>-refactor -b <feature>-refactor`.

---

## 5. Protocolo Jidoka (Andon Cord Checkpoint Unificado)

Antes de considerar qualquer tarefa finalizada ou consolidar alterações, execute o comando único da corda do Andon:

```bash
npm run jidoka
```

Este comando executa a pipeline unificada no Turborepo (`check-types`, `lint` e `build` em paralelo com grafo de dependências). Qualquer erro (exit code != 0) dispara o gatilho automático do **Andon Cord: Halt & Reset Limpo**.
