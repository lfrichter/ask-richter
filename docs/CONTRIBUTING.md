---
status: permanent
tags:
  - AI/FrameworkIA
date: 2026-09-02
project: ask-richter
version: "2.1"
---
# Guia de Contribuição — Ask Richter (AI Engineering Framework v2.1)

Obrigado pelo seu interesse em contribuir com o projeto **Ask Richter**!  
Este projeto opera sob a governança estrita do **AI Engineering Framework v2.1** e do protocolo Zero-Trust/Jidoka definidos em [`AGENTS.md`](../AGENTS.md).

---

## 1. Governança e Hierarquia de Autoridade

Antes de modificar qualquer arquivo, todo colaborador e agente de IA deve respeitar a precedência estrita:

1. Restrições de segurança do sistema e do usuário
2. AI Engineering Framework v2.1
3. [`META_SPEC.md`](../META_SPEC.md) (versão em português: [`docs/pt-br/META_SPEC.md`](pt-br/META_SPEC.md))
4. Decisões Arquiteturais Aprovadas ([`docs/adr/`](adr/))
5. Arquitetura Atual do Sistema ([`.ai/setup/project-context.md`](../.ai/setup/project-context.md) e [`docs/architect.md`](architect.md))
6. Requisitos / PRDs
7. Tarefa / Plano atual (`TASK` / `PLAN`)
8. Código existente
9. Preferências do agente/desenvolvedor

> **Regra Fundamental:** Nunca ignore ou substitua uma regra de nível superior silenciosamente. Em caso de divergência: **PARE → identifique o conflito → solicite alinhamento**.

---

## 2. Visão Geral da Arquitetura (Serverless V2)

- **Frontend & Serverless RAG Engine ([`apps/frontend`](../apps/frontend)):** Next.js 15 (App Router, React 19) rodando nativamente na Vercel. Utiliza busca vetorial por similaridade de cosseno em TypeScript puro ([`TSVectorStore`](../apps/frontend/src/lib/rag/ts-vector-store.ts)), busca léxica em TypeScript puro ([`SimpleTfIdf`](../apps/frontend/src/lib/rag/hybrid-retriever.ts)) e geração de resposta com alinhamento multilíngue (M15) via Google GenAI (`gemini-3.6-flash`).
- **Resiliência do Supabase (ADR-0009):** Máquina de estados estrita com 7 estados (`READY`, `PAUSED`, `WAKING`, `UNAVAILABLE`, `TIMEOUT`, `AUTH_ERROR`, `UNKNOWN`) e recuperação server-side via Supabase Management API v1.
- **Invariante Anti-Render:** O Render legado NUNCA deve ser chamado em produção. Todas as chamadas de produção utilizam rotas relativas nativas Vercel (`/api/*`).
- **Toolkit Offline & Base de Conhecimento ([`apps/backend`](../apps/backend)):** Contém os arquivos Markdown consolidados da carreira (`src/knowledge-base/`), scripts CLI de indexação e embeddings (`src/scripts/generate-index.ts`, `src/scripts/export-vectors.ts`) e suite agnóstica de provedores (`ProviderFactory`).

---

## 3. Configuração do Ambiente Local

### 3.1 Pré-requisitos
- **Node.js:** Versão >= 22 (recomendado Node.js 22 LTS).
- **npm:** Versão 11.x ou superior.
- **Ollama (Opcional para desenvolvimento local offline):**
  ```bash
  ollama pull deepseek-r1:8b
  ```

### 3.2 Instalação das Dependências
Na raiz do monorepo:
```bash
npm install
```

### 3.3 Variáveis de Ambiente

1. **Frontend Serverless ([`apps/frontend/.env.local`](../apps/frontend/.env.example)):**
   ```env
   GEMINI_API_KEY="sua-chave-gemini"
   GEMINI_MODEL="gemini-3.6-flash"
   NEXT_PUBLIC_SUPABASE_URL="https://[SEU-PROJETO].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"
   SUPABASE_MANAGEMENT_TOKEN="sbp_seu-token-management"
   SUPABASE_PROJECT_REF="seu-project-ref"
   ```

2. **Backend / Toolkit Offline ([`apps/backend/.env`](../apps/backend/.env.example)):**
   ```env
   AI_PROVIDER="ollama" # ou "gemini"
   AI_FALLBACK_PROVIDERS="gemini,openrouter,huggingface"
   EMBEDDING_PROVIDER="gemini"
   GEMINI_API_KEY="sua-chave-gemini"
   GEMINI_MODEL="gemini-3.6-flash"
   GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
   SUPABASE_URL="https://[SEU-PROJETO].supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
   SUPABASE_BUCKET_NAME="faiss-index"
   ```

### 3.4 Executando em Desenvolvimento
A partir da raiz do monorepo:
```bash
# Inicia o frontend serverless em http://localhost:3000
npm run dev

# Ou isolado pelo Turborepo
npm run dev --workspace=frontend
```

---

## 4. Padrões de Engenharia & Protocolo Jidoka

### 4.1 Princípios de Desenvolvimento
- **Pense Antes de Codificar:** Inspecione o código relevante, identifique premissas e variáveis desconhecidas antes de alterar arquivos.
- **Evidência Antes de Suposição:** Nunca presuma o comportamento de um componente quando ele puder ser testado ou inspecionado.
- **Alterações Cirúrgicas:** Mantenha o foco estrito na tarefa solicitada. Não formate código não relacionado, não introduza dependências novas sem necessidade e não realize refatorações especulativas.
- **Zero Alucinações / Grounding:** Respostas do assistente devem ser estritamente fundamentadas no contexto do banco vetorial.

### 4.2 Suíte de Testes Automatizados
Antes de abrir Pull Requests ou consolidar alterações:
```bash
# Executa os 65 testes do frontend (Roteamento, Paridade, Caos Supabase, Multilíngue M15)
npm test --workspace=frontend

# Executa os 19 testes do backend (Provider Factory, Resiliência LLM, Embeddings)
npm test --workspace=backend
```

### 4.3 Validação Unificada Jidoka (Andon Cord)
O monorepo utiliza um comando único que roda em paralelo `check-types`, `lint` e `build` via Turborepo:
```bash
npm run jidoka
```
> 🛑 **Se `npm run jidoka` falhar (exit code != 0):** O ciclo de entrega deve ser imediatamente interrompido. Identifique a causa raiz e corrija na origem antes de prosseguir.

---

## 5. Política de Idioma da Documentação

Seguindo a Seção 13 de [`AGENTS.md`](../AGENTS.md):
- A documentação canônica e autoritativa do projeto é escrita em **inglês** (`META_SPEC.md`).
- A pasta `docs/pt-br/` contém a representação localizada para leitura humana.
- Agentes de IA e desenvolvedores devem manter equivalência semântica rigorosa entre as versões canônica e traduzida.
