# Regra de Governança: Registro Obrigatório de Log de Reindexação

## Diretriz
Toda e qualquer operação de geração ou atualização de índice vetorial FAISS (`generate-index.ts`) DEVE obrigatoriamente registrar os metadados e o status da execução no log auditável [`docs/INDEXING_LOG.md`](file:///Users/master/projects/chatbot/ask-richter/docs/INDEXING_LOG.md) e gerar o manifesto [`manifest.json`](file:///Users/master/projects/chatbot/ask-richter/apps/backend/faiss_index/manifest.json).

## Requisitos Inegociáveis:
1. **Geração de Manifest**: O arquivo `manifest.json` com `timestamp`, `embeddingModel`, `sourceDocumentsCount`, `totalChunks`, `uploadedToSupabase` e `bucketName` deve ser salvo em todas as pastas de índice.
2. **Registro em `docs/INDEXING_LOG.md`**: Ao término da execução (seja local ou com upload `--upload`), o script ou assistente deve registrar uma nova entrada em `docs/INDEXING_LOG.md`.
3. **Upload no Supabase**: Quando a flag `--upload` for fornecida, o arquivo `manifest.json` também deve ser enviado ao bucket do Supabase Storage (`faiss-index`).
