# 📊 Log de Reindexação do Banco Vetorial (FAISS & Supabase Storage)

Este documento atua como o registro oficial auditável das reindexações da base de conhecimento Markdown do **Ask Richter**, compiladas no índice vetorial FAISS e persistidas no **Supabase Storage** (`faiss-index` bucket).

---

## 📅 Histórico de Reindexações

### 🚀 17 de Agosto de 2026 - 15:23:05 BRT

- **Executado por**: Script Automatizado (`generate-index.ts`)
- **Comando**: `npx tsx apps/backend/src/scripts/generate-index.ts --yes --upload`
- **Modelo de Embedding**: OpenAI `text-embedding-3-small`
- **Documentos de Origem** (`apps/backend/src/knowledge-base/`):
  - `CV-Consolidated.md`
  - `Experience-Consolidated.md`
  - `Education-Certifications-Consolidated.md`
  - `PoC-Challenges-SideProjects-Consolidated.md`
- **Métricas da Reindexação**:
  - **Documentos Fonte**: 4 arquivos Markdown
  - **Chunks Semânticos**: 400 chunks
  - **Chunk Sintético**: 1 resumo sintético de projetos
  - **Total de Chunks FAISS**: 401 chunks
  - **Projetos Mapeados**: 29 projetos
- **Arquivos Persistidos no Supabase Storage (`faiss-index` bucket)**:
  - `docstore.json`
  - `faiss.index`
  - `manifest.json`
- **Status da Sincronização Supabase**: ✅ **Sucesso (HTTP 200 / Upsert Concluído)**

---

### 🚀 17 de agosto de 2026 - 15:23:23 BRT

- **Executado por**: Script Automatizado (`generate-index.ts`)
- **Comando**: `npx tsx apps/backend/src/scripts/generate-index.ts --yes --upload`
- **Modelo de Embedding**: OpenAI `text-embedding-3-small`
- **Documentos Fonte**: 4 arquivos Markdown
- **Total de Chunks Semânticos**: 401 chunks
- **Bucket Supabase**: `faiss-index`
- **Status do Upload Supabase**: ✅ **Sucesso**

---

### 🚀 18 de agosto de 2026 - 11:57:14 BRT

- **Executado por**: Script Automatizado (`generate-index.ts`)
- **Comando**: `npx tsx apps/backend/src/scripts/generate-index.ts -- --yes --upload`
- **Modelo de Embedding**: Provedor `gemini`
- **Documentos Fonte**: 4 arquivos Markdown
- **Total de Chunks Semânticos**: 401 chunks
- **Bucket Supabase**: `faiss-index`
- **Status do Upload Supabase**: ✅ **Sucesso**

---
