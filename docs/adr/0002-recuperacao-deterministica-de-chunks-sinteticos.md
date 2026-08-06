# ADR-0002: Recuperação Determinística de Chunks Sintéticos via Docstore

- **Status:** Aprovado  
- **Data:** 2026-08-05  
- **Autor:** Antigravity (Chief of Staff / Agente Orquestrador)  
- **Escopo:** Backend (`apps/backend/src/index.ts`, `apps/backend/src/scripts/generate-index.ts`)

---

## 1. Contexto e Problema

No pipeline RAG do **AskRichter**, a solicitação de listagem geral de projetos (`LIST_PROJECTS`) depende de um documento sintético contendo o índice oficial de todos os projetos documentados.

Durante os testes, identificou-se que a chamada ao FAISS via `vectorStore.similaritySearch(originalQuery, 1, { source: 'synthetic_project_list' })`:
1. Executava a busca por distância vetorial no C++ (`faiss-node`) **antes** da aplicação dos filtros em JavaScript.
2. Com `Top-K = 1`, o FAISS recuperava apenas o vetor numericamente mais próximo (ex: a nota do projeto "Spider"), e a posterior tentativa de filtrar por metadados descartava esse vetor, resultando em falha silenciosa ou retorno do chunk errado.
3. Além disso, o script de geração `generate-index.ts` salvava o índice apenas em `/tmp/faiss_index`, deixando os diretórios de fallback local (`apps/backend/faiss_index` e `apps/backend/src/faiss_index`) dessincronizados do código-fonte.

---

## 2. Decisão

Decidimos alterar o mecanismo de ingestão e recuperação de documentos sintéticos da seguinte forma:

1. **Busca Determinística no Docstore (`findSyntheticProjectListDoc`):**
   - Para o plano de consulta `LIST_PROJECTS`, substituímos a busca vetorial probabilística por uma inspeção determinística direta no `vectorStore.docstore` em memória (`metadata.source === 'synthetic_project_list'`).
   - Se o documento sintético estiver presente na memória, ele é retornado com score 1.0 sem passar pelo cálculo de distância de cosseno/L2. Caso não seja encontrado, o sistema recorre graciosamente ao `hybridRetriever`.

2. **Sincronização Automatizada do Índice FAISS no Build:**
   - O script `generate-index.ts` foi atualizado para persistir a base vetorial e o `docstore.json` gerados tanto em `/tmp/faiss_index` quanto nos diretórios de fallback do projeto (`apps/backend/faiss_index` e `apps/backend/src/faiss_index`).

---

## 3. Consequências

### Positivas:
- **Precisão Determinística (100%):** Elimina a dependência de distância vetorial para a listagem sintética, garantindo que o assistente sempre receba o índice oficial de projetos.
- **Sincronismo de Build:** Os arquivos de índice vetorial no repositório permanecem sempre em alinhamento com os scripts de geração.

### Mitigações / Trade-offs:
- O `docstore` precisa estar devidamente mantido na memória da instância do Node.js.
