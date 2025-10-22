---
status: permanent
tags:
  - Project/askRichter
  - AI/Gemini25Pro
date: 2025-08-20
project: 
related: 
prompt:
---
### Plano de Ação: Garantindo a Fidelidade do "Ask Richter"

Nosso objetivo é transformar o chatbot em uma fonte de verdade confiável. Para isso, vamos atuar em três frentes: garantir que o índice esteja sempre atualizado, melhorar a forma como a IA o utiliza e nos dar ferramentas para ver o que ela está "pensando".

#### ✅ Passo 1: Garantir um Índice Sempre Atualizado (Limpeza Automática)

A causa mais provável é que o nosso script `build-index` não está apagando os arquivos antigos antes de criar os novos. Com o tempo, a pasta do índice pode acumular "lixo" de dados antigos. Vamos tornar nosso script mais robusto.

  - [ ] **Ação: Atualizar o `generate-index.ts`**

      - Abra o arquivo `apps/backend/src/scripts/generate-index.ts`.
      - Vamos adicionar uma etapa de limpeza no início da função `run()` para garantir que a pasta do índice seja completamente apagada antes de qualquer nova geração.

    **Arquivo:** `apps/backend/src/scripts/generate-index.ts`

    ```typescript
    // ... (imports)
    import fs from 'fs'; // Garanta que o 'fs' está importado

    // ... (código de configuração do Supabase, etc.)

    const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

    // ... (função uploadIndexToSupabase)

    async function run() {
      try {
        // --- ETAPA DE LIMPEZA ADICIONADA AQUI ---
        console.log(`[LIMPEZA] Verificando e limpando o diretório de índice antigo em: ${FAISS_INDEX_PATH}...`);
        if (fs.existsSync(FAISS_INDEX_PATH)) {
            fs.rmSync(FAISS_INDEX_PATH, { recursive: true, force: true });
            console.log('[LIMPEZA] Diretório antigo removido com sucesso.');
        }
        fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });
        
        console.log('Iniciando processo de indexação...');
        // ... (o resto da sua lógica de build do índice continua aqui)
        
        await vectorStore.save(FAISS_INDEX_PATH);
        console.log(`Índice FAISS salvo localmente em: ${FAISS_INDEX_PATH}`);

        await uploadIndexToSupabase(FAISS_INDEX_PATH);

      } catch (error) {
        console.error('Ocorreu um erro durante o processo de indexação e upload:', error);
        process.exit(1);
      }
    }

    run();
    ```

-----

#### ✅ Passo 2: Aprimorar a Engenharia de Prompt (Instruções Mais Rígidas)

Vamos dar instruções ainda mais claras à IA para que ela priorize a relevância e a cronologia dos fatos, e para que ela nos mostre sua fonte.

  - [ ] **Ação: Atualizar o `systemPrompt` no `index.ts`**

      - Abra o arquivo `apps/backend/src/index.ts`.
      - Substitua o `systemPrompt` pela versão aprimorada abaixo.

    **Arquivo:** `apps/backend/src/index.ts`

    ```typescript
    // ... (código anterior da rota /api/chat)

          // --- PROMPT APRIMORADO COM REGRAS MAIS RÍGIDAS ---
          const systemPrompt = `Você é o "Ask Richter", um assistente de carreira especialista na trajetória de Luis Fernando Richter.

          **Regras Estritas e Inquebráveis:**
          1.  **Fonte da Verdade Absoluta:** Baseie TODAS as suas respostas exclusivamente no "Contexto" fornecido. Não use nenhum conhecimento externo.
          2.  **Perspectiva:** Fale sobre Luis Fernando Richter SEMPRE na terceira pessoa (use "ele", "Luis"). NUNCA use "você".
          3.  **Cronologia:** Ao ser perguntado sobre projetos "recentes" ou "últimos", preste atenção às datas no contexto para dar a resposta mais atual.
          4.  **Citação de Fontes:** No final de cada resposta, adicione uma seção chamada "Fontes Consultadas" e liste os títulos dos projetos ou seções do CV que você usou do contexto para formular a resposta.
          5.  **Recusa Segura:** Se a resposta não estiver no contexto, recuse-se a responder, dizendo: "Com base nas informações que tenho, não consigo responder a essa pergunta."`;
          
          const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta do usuário: ${question}`;

    // ... (resto do código da rota)
    ```

-----

#### ✅ Passo 3: Adicionar "Logs de Depuração de Contexto" (Ver o que a IA Vê)

Esta é a ferramenta mais poderosa para depurar o RAG. Vamos fazer a API imprimir no console do backend exatamente quais pedaços de informação ela está recuperando do FAISS e enviando para o LLM.

  - [ ] **Ação: Adicionar um `console.log` no `index.ts`**

      - Ainda no arquivo `apps/backend/src/index.ts`, adicione um log logo após a busca no `vectorStore`.

    **Arquivo:** `apps/backend/src/index.ts`

    ```typescript
    // ... (código anterior da rota /api/chat)

          console.log(`[API] Pergunta recebida: "${question}"`);
          const searchResults = await vectorStore.similaritySearch(question, 4);
          const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');
          
          // --- LOG DE DEPURAÇÃO DE CONTEXTO ---
          console.log("================ CONTEXTO RECUPERADO PARA A IA ================");
          console.log(context);
          console.log("=============================================================");

          const systemPrompt = `...`; // Nosso prompt aprimorado

    // ... (resto do código da rota)
    ```

### Próximos Passos

1.  **Aplique** as alterações nos arquivos `generate-index.ts` e `index.ts`.
2.  **Rode o `build-index` novamente** para garantir que você tem um índice limpo e atualizado:
    ```bash
    npm run build-index --workspace=backend
    ```
3.  **Inicie o servidor** com `npm run dev`.
4.  **Teste no frontend** e **observe o terminal do backend**.

Agora, quando você fizer a pergunta, o terminal do backend irá te mostrar o `CONTEXTO RECUPERADO PARA A IA`. Isso nos permitirá ver se a busca vetorial está trazendo os projetos corretos. Com as novas regras do prompt, a resposta da IA deverá ser muito mais fidedigna.
