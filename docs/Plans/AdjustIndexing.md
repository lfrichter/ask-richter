Gemini, estamos enfrentando um problema persistente e específico com consultas sobre "Vue.js" no nosso RAG chatbot ("Ask Richter"). Apesar de várias correções no indexador (`generate-index.ts`) e na API (`index.ts`), as respostas para "projetos Vue" continuam sendo alucinações genéricas ou listando projetos incorretos (como SmartShorts), ignorando os projetos corretos (Twin Quest, Kpro After Sales, Huktup) que *parecem* ter "Vue.js" nos metadados após a última indexação.

**Problema Central:** Falha em retornar a lista correta de projetos que usam Vue.js, indicando um erro na cadeia RAG (extração de metadados, classificação de intenção, filtragem, ou confabulação do LLM devido a contexto falho).

**Arquivos Principais:**
1.  `apps/backend/src/scripts/generate-index.ts` (Funções: `customMarkdownSplitter`, `parseTechnologiesFromChunk`, `addCleanedTech`)
2.  `apps/backend/src/index.ts` (Funções: `decomposeQuery`, `smartSearch`, `assembleStructuredContext`, handler `app.post('/api/chat', ...)`)

**Tarefa:**
Por favor, revise e ajuste o código nesses dois arquivos com o objetivo específico de **corrigir a busca por projetos Vue.js**. Siga estes passos:

1.  **Revisar `parseTechnologiesFromChunk` e `addCleanedTech` (`generate-index.ts`):**
    * Verifique se a extração das seções relevantes (`techRelevantContent` em `customMarkdownSplitter`) está correta para os arquivos `.md` dos projetos Twin Quest, Kpro, Huktup.
    * **Crucial:** Analise a lógica dentro de `addCleanedTech`. Garanta que strings como "Vue.js", "Vue 3", "Vue 3 (Composition API)" sejam **corretamente limpas, normalizadas para "Vue.js"** e **não sejam filtradas** pela `ignoreList` ou outras lógicas de descarte. Adicione logs *dentro* de `addCleanedTech` para mostrar o input e o output *antes* de adicionar ao `techSet`.
    * Garanta que a lista `technologies` final nos metadados dos chunks de Twin Quest, Kpro, Huktup contenha "Vue.js". Adicione logs no final de `customMarkdownSplitter` para confirmar isso (como já temos).

2.  **Revisar `decomposeQuery` (`index.ts`):**
    * Confirme que `'vue.js'` (minúsculo) está na lista `knownTechnologies`.
    * Avalie a lógica/regex para `PROJECT_TECHNOLOGY_SEARCH`. Ela está capturando de forma confiável perguntas como "projetos Vue", "projetos em Vue.js", "quais usam Vue"? **Reforce essa lógica** se necessário para garantir a classificação correta. Adicione logs para confirmar a intenção detectada.

3.  **Revisar `smartSearch` (`index.ts`):**
    * No `case 'PROJECT_TECHNOLOGY_SEARCH'`, verifique se a `filterFunction` está comparando `t.toLowerCase() === technology.toLowerCase()` corretamente e se `technology` realmente contém "vue.js" (minúsculo) quando essa intenção é detectada. Adicione logs para mostrar o valor de `technology` e o número de chunks encontrados *após* a filtragem, mas *antes* do agrupamento `uniqueProjects`.

4.  **Aplicar Correções:** Implemente as mudanças necessárias no código com base na sua análise para garantir que os metadados sejam gerados corretamente e que a API use esses metadados de forma eficaz para filtrar projetos Vue.js.

**Objetivo Final:** Após aplicar as correções, reindexar e reiniciar o servidor, uma pergunta como "Quais projetos usam Vue.js?" deve acionar `PROJECT_TECHNOLOGY_SEARCH`, usar o filtro de metadados e retornar a lista correta (Twin Quest, Kpro After Sales, Huktup, e a menção na experiência da Full Comms).
