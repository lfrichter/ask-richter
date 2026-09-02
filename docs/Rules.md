# Regras do Projeto Ask Richter (AI Engineering Framework v2.1)

## 1. Governança e Autoridade
- A constituição primária e especificação canônica do projeto é definida no [`META_SPEC.md`](../META_SPEC.md) (versão localizada em [`docs/pt-br/META_SPEC.md`](pt-br/META_SPEC.md)).
- O código de conduta e limites operacionais dos Agentes de IA são regidos por [`AGENTS.md`](../AGENTS.md) (versão localizada em [`docs/pt-br/AGENTS.md`](pt-br/AGENTS.md)).
- O contexto técnico consolidado e comandos verificados residem em [`.ai/setup/project-context.md`](../.ai/setup/project-context.md).
- Todas as decisões arquiteturais são formalizadas e registradas de forma imutável via ADRs em [`docs/adr/`](adr/).
- Hierarquia de Autoridade: Regras de Sistema/Segurança > AI Engineering Framework > `META_SPEC.md` > ADRs Aprovadas > Arquitetura Atual > Requisitos/PRDs > Tarefa/Plano > Código Existente.

## 2. Arquitetura Serverless V2 & Invariantes de Roteamento
- **Produção Vercel:** O motor de RAG opera 100% Serverless no Next.js 15 App Router (`/api/chat`).
- **Invariante Anti-Render:** O Render legado NUNCA deve ser chamado em produção. Todas as chamadas do cliente web utilizam endpoints relativos (`/api/*`).
- **Resiliência do Supabase (ADR-0009):** NUNCA inferir falhas de rede, DNS ou timeout como `PAUSED`. O estado `PAUSED` requer evidência inequívoca da API.

## 3. Pipeline de Reindexação & Supabase Storage
- **Registro Obrigatório de Log**: Ao final de toda reindexação do banco vetorial (`generate-index.ts` / `export-vectors.ts`), é OBRIGATÓRIO:
  1. Gerar o arquivo `manifest.json` com os metadados do índice (dimensão: 768, modelo: `gemini-embedding-2`).
  2. Gravar e atualizar a entrada de log auditável em [`docs/INDEXING_LOG.md`](INDEXING_LOG.md).
  3. Quando executado com a flag `--upload`, fazer o upload de `docstore.json`, `vectors.json` e `manifest.json` para o bucket `faiss-index` no Supabase Storage.
  4. Garantir que o projeto Supabase esteja ativo/descongelado antes do upload.

## 4. Protocolo Jidoka (Andon Cord)
- Antes de consolidar commits, abrir PRs ou concluir tarefas, validar a saúde do monorepo executando o comando único:
  ```bash
  npm run jidoka
  ```
  Se qualquer etapa falhar (exit code != 0), o ciclo deve ser interrompido imediatamente para correção na raiz.

