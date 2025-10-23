Gemini, preciso implementar a correção em nosso script de RAG.

**Arquivo-alvo:** `apps/backend/src/scripts/generate-index.ts`

**Problema:** A busca vetorial (RAG) não está recuperando o "chunk sintético" que contém a lista de todos os projetos quando o usuário pergunta "me dê todos os projetos". Isso ocorre porque os chunks de descrição detalhada dos projetos estão ganhando a "batalha de relevância" na busca.

**Tarefa:** Modifique o script `generate-index.ts` para "engenheirar" o chunk sintético, tornando-o semanticamente mais forte.

**Instruções:**

1.  Localize a seção no script onde os `projectNames` são coletados e onde o `Document` sintético da lista de projetos é criado (deve estar perto do log `[SINTÉTICO] Documento criado com...`).

2.  O código atual provavelmente se parece com isto:

    ```typescript
    // (Alguma lógica para popular projectNames)
    const projectListString = projectNames.join(', ');
    const doc = new Document({
      pageContent: projectListString,
      metadata: { source: 'synthetic:project_list' },
    });
    allChunks.push(doc);
    ```

3.  Substitua essa lógica. Crie uma nova string de conteúdo (`enhancedContent`) que sirva como um "cabeçalho" semanticamente poderoso. Use este template exato:

    ```typescript
    // (Alguma lógica para popular projectNames)
    const projectListString = projectNames.join(', ');

    // NOVO CONTEÚDO APRIMORADO
    const enhancedContent = `
Título: Lista Completa de Todos os 23 Projetos.
Resumo: Este documento é o índice sintético oficial que lista o nome de todos os 23 projetos documentados na base de conhecimento.
Palavras-chave: todos os projetos, lista completa, índice de projetos, quantos projetos, listagem total.
Projetos: ${projectListString}
    `;

    // Crie o Document usando o conteúdo aprimorado
    const doc = new Document({
      pageContent: enhancedContent,
      metadata: {
        source: 'synthetic:project_list',
      },
    });
    allChunks.push(doc);
    ```

4.  Por favor, aplique essa modificação. Isso garantirá que, quando eu perguntar "Qual a lista completa de projetos?", o vetor dessa pergunta seja muito similar ao `enhancedContent`, fazendo com que este chunk seja recuperado pelo FAISS.
