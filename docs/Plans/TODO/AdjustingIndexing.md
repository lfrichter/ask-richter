Gemini, nossos esforços anteriores falharam. Os resultados da busca por tecnologia estão inaceitáveis, com alucinações (ex: "Telegram Course Tools" para Vue) e contaminação de contexto (descrição do "Índicos" aparecendo no "Twin Quest").

O log da API revelou o bug central: estamos aplicando um re-ranking semântico em uma busca de metadados. O `smartSearch` encontra os 12 projetos Laravel, mas o re-ranker (`assembleStructuredContext`) descarta 9 deles.

Além disso, os logs de indexação mostram que o parser (`generate-index.ts`) ainda falha em limpar os nomes dos projetos (ex: `🚀 Project: ...`) e em extrair tecnologias com emojis (ex: `🖥️ Vue.js`).

**META:** Corrija os dois arquivos (`generate-index.ts` e `index.ts`) para que uma consulta por "mostre todos projetos laravel" retorne a lista completa dos ~12 projetos corretos, com suas descrições corretas.

---

**TAREFA 1: Corrigir o Indexador (`apps/backend/src/scripts/generate-index.ts`)**

1.  **Modifique `customMarkdownSplitter`:**
    * Altere o regex de identificação de projeto para **limpar todos os prefixos** e o emoji. Use algo como:
        `currentProjectName = sectionHeader.replace(/^(🚀 (PoC|Challenge|SideProject|Project): )/i, '').trim();`
    * Garanta que os chunks de `CV-Consolidated.md` e `Experience-Consolidated.md` sejam agrupados por uma chave única baseada na `source` (ex: `_non_project_${source}`), e não uma chave genérica "project".
    * Garanta que a lógica `techRelevantContent` acumule dados das seções:
        * `#### 🛠️ pilha de tecnologias (tech stack)`
        * `#### classificação de tecnologias e conceitos` (agora que os dados estão limpos)
        * `**skills & technologies**` (do CV)
        * `🛠️ 5. tabela de tecnologias utilizadas` (do Experience)

2.  **Modifique `parseTechnologiesFromChunk`:**
    * Dentro da função `addCleanedTech`, adicione a **"Correção do Emoji"** para remover símbolos não-padrão **antes** do filtro de validação:
        `.map(t => t.replace(/[^\p{L}\p{N}\s.\-+#/]/gu, '')) // <--- Adicione esta linha antes do .filter(t => /^[a-zA-Z.../)`
    * Garanta que a lógica de parsing de tabela processe **ambas** as tabelas (`isTechTable` e `isClassificationTable`).

---

**TAREFA 2: Corrigir a API (`apps/backend/src/index.ts`)**

1.  **Modifique `knownTechnologies`:**
    * Adicione `'vue'` à lista, para que ela contenha `['laravel', 'vue.js', 'vue', 'react', ...]`.

2.  **Modifique `decomposeQuery`:**
    * Garanta que se `tech === 'vue'`, ele normalize `foundTechnology` para `'vue.js'` antes de retornar o payload.

3.  **Modifique `assembleStructuredContext` (Correção Crítica):**
    * Esta função deve agora lidar com dois fluxos:
    * **Início da função:** Verifique `queryPlan.type`.
    * **If `(queryPlan.type === 'SIMPLE_SEARCH')`:** Mantenha a lógica existente -> re-rank, agrupa por projeto (Top-K=3), e formata.
    * **Else If `(queryPlan.type === 'PROJECT_TECHNOLOGY_SEARCH')`:**
        * **NÃO RE-RANQUEIE OS DOCUMENTOS.**
        * Implemente a lógica de agrupamento (`const uniqueProjects = new Map<string, Document[]>()`).
        * Itere sobre `contextDocs` e popule o `uniqueProjects` usando `doc.metadata.project_name` (que agora estará limpo).
        * Adicione um log: `console.log(`[API] Plano ${queryPlan.type}: ${uniqueProjects.size} projetos únicos encontrados. Formatando lista...`);`
        * Crie um array `projectContexts: string[]`.
        * Itere o `uniqueProjects.entries()`. Para cada `[projectName, chunks]`:
            * Encontre o "melhor" chunk de resumo: `let bestChunk = chunks.find(c => c.metadata.section_header.includes('RESUMO TÉCNICO')) || chunks.find(c => c.metadata.section_header.includes('Pilha de Tecnologias')) || chunks[0];`
            * Limpe o conteúdo do chunk (remova a primeira linha do header): `const chunkContent = bestChunk.pageContent.split('\n').slice(1).join('\n').trim();`
            * Adicione ao array: `projectContexts.push(`PROJETO: ${projectName}\n${chunkContent}`);`
        * **Retorne** a string final: `return projectContexts.join('\n\n');`

4.  **Verifique `PROMPT_TEMPLATE`:**
    * Garanta que a regra de formatação `* Projeto: [Nome Completo do Projeto]` esteja presente no prompt.

Execute estas correções. Após reindexar e reiniciar o servidor, teste "mostre todos projetos laravel". A resposta DEVE conter a lista completa dos 12 projetos, sem contaminação.
