# Regras do Projeto Ask Richter

## 1. Governança e Especificação
- A constituição do projeto está definida no arquivo [`.askrichter-spec.md`](file:///.askrichter-spec.md).
- Decisões arquiteturais são registradas via ADRs em [`docs/adr/`](file:///docs/adr/).

## 2. Pipeline de Reindexação & Supabase Storage
- **Registro Obrigatório de Log**: Ao final de toda reindexação do banco vetorial FAISS (`generate-index.ts`), é OBRIGATÓRIO:
  1. Gerar o arquivo `manifest.json` com os metadados do índice.
  2. Gravar e atualizar a entrada de log auditável em [`docs/INDEXING_LOG.md`](file:///docs/INDEXING_LOG.md).
  3. Quando executado com a flag `--upload`, fazer o upload de `docstore.json`, `faiss.index` e `manifest.json` para o bucket `faiss-index` no Supabase Storage.
  4. Garantir que o projeto Supabase esteja ativo/descongelado antes do upload.

## 3. Protocolo Jidoka (Andon Cord)
- Antes de consolidar commits ou concluir tarefas, validar a saúde do monorepo executando `npm run jidoka`.
