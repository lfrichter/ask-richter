# ADR-0007: Eliminação do FAISS/Render & Migração para Serverless RAG em TypeScript (Vercel)

* **Status:** Aceito / Cutover Concluído (Vercel Primary 🟢, Render Fallback 🟡)
* **Data:** 2026-08-26
* **Decisores:** Luis Fernando Richter, Equipe de Arquitetura AskRichter
* **Tags:** `architecture`, `rag`, `serverless`, `vercel`, `faiss-elimination`, `ts-vector-search`

---

## Contexto e Problema

Anteriormente, o sistema de RAG do **Ask Richter** dependia de um microserviço em Express hospedado no Render.com (`apps/backend`). Esse backend utilizava a biblioteca nativa `faiss-node`, que compilava extensões C++ (`faiss.index`) para realizar buscas por similaridade vetorial.

Essa arquitetura apresentava dois gargalos críticos:
1. **Spin-down do Render Free Tier**: Apresentava latência de 30 a 50 segundos quando o contêiner entrava em repouso por inatividade.
2. **Dependências Nativas C++**: Impediam o empacotamento direto do RAG em ambientes Serverless modernos como a Vercel.

---

## Decisão

Decidimos **eliminar a dependência do servidor Express no Render e do binário C++ `faiss-node`**, migrando o RAG para um modelo **100% Serverless nativo na Vercel (Next.js App Router API Routes)**.

### Pilares da Implementação:
1. **Busca Vetorial por Cosseno em TS Puro (`TSVectorStore`)**:
   - Cálculo de similaridade de cosseno em TypeScript nativo sobre um dataset estático pré-vetorizado (`vectors.json`, 401 vetores de 768d no modelo `gemini-embedding-2`).
   - Comprovada **100.0% de paridade vetorial com o FAISS FlatIP** (Top-1: 100%, Top-3: 100%, Top-5: 100%, MRR: 1.000).

2. **Provedores de IA Serverless (`LLMProvider` & `EmbeddingService`)**:
   - Execução direta da API do Gemini (`gemini-2.5-flash` para geração e `gemini-embedding-2` para vetorização de queries) nas rotas Serverless do Next.js (`apps/frontend/src/app/api/chat/route.ts`).

3. **Preservação RAG & Separação Arquitetural**:
   - Preservados o re-ranking RRF ($k=60$), Filtro de Diversidade por Projeto, Orçamento de Tokens (~2800 tokens max) e System Prompts.
   - A modernização do lematizador léxico (`SimpleTfIdf`) foi isolada e formalizada no **ADR-0008**.

---

## Estado Atual da Operação (Cutover Concluído)

```text
                 Vercel Serverless (PRIMARY 🟢)
                 ├── /api/chat
                 ├── /api/health
                 ├── /api/ready
                 └── /api/supabase/status
                           │
                           ▼ (Fallback Opcional Durante Estabilização)
                   Render / Express (FALLBACK 🟡)
```

---

## Consequências

### Positivas
* **Eliminação de Cold-Start do Render**: As respostas chegam instantaneamente sem o tempo de inicialização de 50s do servidor Render.
* **Simplificação Operacional**: Aplicação 100% hospedada na Vercel com empacotamento estático e zero binários C++.
* **Paridade Vetorial Comprovada**: Zero regressão na busca por similaridade vetorial semântica.

### Próximos Passos (Janela de Estabilização & Retirement)
1. Monitorar a operação primária na Vercel durante a janela de estabilização.
2. Executar o desligamento final (*Render Retirement*) e limpeza do monorepo (`apps/backend` e `faiss-node`).
