Gemini, estamos enfrentando uma falha sistêmica no RAG que piorou após as últimas alterações, apesar de nossos esforços para limpar os dados de origem.

**Contexto:**
Realizamos várias alterações nos scripts `apps/backend/src/scripts/generate-index.ts` (indexador) e `apps/backend/src/index.ts` (API). Também limpamos os arquivos `.md` de origem (como remover "Vue" do projeto SmartShorts).

**Estado Atual (Péssimo):**
1.  **Consulta "mostre todos projetos laravel":** Retorna uma lista pequena (5 projetos, quando deveria retornar ~12). Pior, ela sofre de **contaminação de contexto**: a descrição do projeto "Twin Quest" é, na verdade, a descrição do projeto "Índicos".
2.  **Consulta "mostre projetos Vue":** Continua alucinando. Ela detecta a intenção correta (`PROJECT_TECHNOLOGY_SEARCH` para `vue.js`), mas o resultado final ainda lista projetos errados (como "Telegram Course Tools"), provando que o filtro de metadados não está sendo aplicado ou está sendo sobreposto.

**Análise da Causa Raiz (Com Base nos Logs):**
O problema é quádruplo e afeta os dois arquivos:

**Em `generate-index.ts` (Indexador):**
1.  **[BUG DE NOME] `customMarkdownSplitter`:** O regex para limpar os nomes dos projetos falhou. Os nomes no índice ainda estão "sujos" (ex: `🚀 Project: Huktup...`), o que quebra o agrupamento na API.
2.  **[BUG DE PARSING] `addCleanedTech`:** O parser de tecnologia ainda não remove emojis. Ele falha em processar strings como `🖥️ Vue.js` (do projeto Kpro After Sales), fazendo com que esse projeto não receba a tag "Vue.js".
3.  **[BUG DE AGRUPAMENTO] `customMarkdownSplitter`:** Os arquivos `CV-Consolidated.md` e `Experience-Consolidated.md` estão sendo agrupados incorretamente sob uma única chave genérica "project", poluindo os metadados.

**Em `index.ts` (API):**
4.  **[BUG DE CONTAMINAÇÃO] `assembleStructuredContext` / Re-ranker:** A lógica que agrupa os chunks (documentos) por `project_name` está misturando o `pageContent` (resumo) de um projeto com o nome de outro. Este é o bug mais crítico e causa a contaminação na resposta do Laravel.
5.  **[BUG DE FILTRO] `smartSearch` / `filterFunction`:** A função de filtro de metadados está falhando. Os logs do teste "Vue" mostram que a intenção foi detectada, mas os resultados (SmartShorts UI, Telegram) provam que o filtro `doc.metadata.technologies.includes('vue.js')` não está funcionando como esperado.

**META E TAREFA:**
Sua meta é **implementar e testar** as correções em `generate-index.ts` e `index.ts` até que o sistema funcione.

1.  **Corrija `generate-index.ts`:**
    * No `customMarkdownSplitter`, implemente um regex que **limpe todos os prefixos** (ex: `🚀 Project: `, `🚀 PoC: `, etc.) dos nomes dos projetos.
    * No `customMarkdownSplitter`, corrija o agrupamento de arquivos não-projeto (CV, Experience) para que usem uma chave única (ex: baseada no `source`), em vez de "project".
    * No `addCleanedTech` (dentro do `parseTechnologiesFromChunk`), adicione a limpeza de emojis/símbolos (ex: `.replace(/[^\p{L}\p{N}\s.\-+#/]/gu, '')`) **antes** da validação.
    * Garanta que o `parseTechnologiesFromChunk` leia **ambas** as tabelas (`Pilha de Tecnologias` E `Classificação de Conceitos`), agora que os dados da Classificação foram limpos.

2.  **Corrija `index.ts`:**
    * Adicione `'vue'` (além de `'vue.js'`) à lista `knownTechnologies` e normalize-o para `'vue.js'` na `decomposeQuery`.
    * **Corrija o bug de contaminação:** Revise `assembleStructuredContext` e `smartSearch` (case `PROJECT_TECHNOLOGY_SEARCH`). A lógica de agrupamento (`uniqueProjects.set`) e o re-ranking subsequente devem garantir que o `pageContent` (o resumo) recuperado pertença **inequivocamente** ao `project_name` ao qual está sendo associado.
    * **Corrija o bug do filtro:** Adicione logs *dentro* da `filterFunction` no `smartSearch` para depurar por que ela está retornando `true` para chunks que não deveriam corresponder.

3.  **Teste (Meta):**
    * Após aplicar as correções, sua implementação deve garantir que uma consulta por **"mostre todos projetos laravel"** ative o `PROJECT_TECHNOLOGY_SEARCH`, filtre corretamente o índice limpo, e retorne a lista completa dos ~12 projetos Laravel, **sem nenhuma contaminação** na descrição.
