---
status: permanent
tags: 
date: 2025-08-05
project: 
related: 
prompt: 
Version: "1.0"
---
### 1\. Plano de Implementação: Do Zero ao Chat Inteligente

#### ✅ Fase 1: Configuração e Preparação do Ambiente

  - [ ] **1.1. Atualizar Dependências do Backend:** Navegue até `apps/backend` e instale as bibliotecas necessárias.

    ```bash
    npm install faiss-node langchain openai dotenv
    ```

      * **`faiss-node`:** Para criar e ler o índice vetorial local.
      * **`langchain`:** Usaremos seus utilitários para carregar e fragmentar (chunking) os documentos de forma eficiente.
      * **`openai`:** A biblioteca oficial que usaremos para nos comunicar com a API do OpenRouter, que é compatível com a da OpenAI.
      * **`dotenv`:** Para gerenciar as variáveis de ambiente (`.env`).

  - [ ] **1.2. Estruturar a Base de Conhecimento:** Dentro de `apps/backend/src/`, crie uma pasta chamada `knowledge-base`.

  - [ ] **1.3. Adicionar os Documentos:** Mova todos os seus arquivos `.md` (CV, Projetos, etc.) para dentro da pasta `apps/backend/src/knowledge-base/`.

  - [ ] **1.4. Configurar Variáveis de Ambiente:** Crie o arquivo `apps/backend/.env` e adicione sua chave do OpenRouter. Você também precisará de uma chave da OpenAI exclusivamente para gerar os embeddings, que é um serviço que o OpenRouter não provê.

    ```env
    # apps/backend/.env
    OPENROUTER_API_KEY="sua_chave_aqui_do_openrouter"
    OPENAI_API_KEY="sua_chave_aqui_da_openai_para_embeddings"
    ```

#### ✅ Fase 2: Script de Indexação (O Trabalho Offline)

  - [ ] **2.1. Criar o Script de Indexação:** Crie o arquivo `apps/backend/src/scripts/generate-index.ts`. Este script será executado uma única vez para gerar o banco vetorial.
  - [ ] **2.2. Carregar os Documentos:** No script, use o `DirectoryLoader` do LangChain para carregar todos os arquivos da pasta `knowledge-base`.
  - [ ] **2.3. Fragmentar os Documentos (Chunking):** Utilize o `RecursiveCharacterTextSplitter` do LangChain para quebrar os documentos em "chunks" de tamanho consistente, com uma sobreposição (overlap) para não perder o contexto entre eles.
  - [ ] **2.4. Gerar os Embeddings:** Configure o `OpenAIEmbeddings` do LangChain, usando o modelo `text-embedding-3-small` e sua chave da OpenAI.
  - [ ] **2.5. Construir e Salvar o Índice FAISS:** Use o `FaissStore.fromDocuments()` para passar os chunks e o modelo de embeddings. Isso criará o índice vetorial em memória. Em seguida, use o método `save()` para persistir o índice em um arquivo (ex: `faiss.index`) na pasta `apps/backend/src/`.

#### ✅ Fase 3: Modificação da API do Backend (A Lógica Online)

  - [ ] **3.1. Carregar o Índice FAISS:** Na sua aplicação Express (`apps/backend/src/index.ts`), importe e carregue o arquivo `faiss.index` para a memória quando o servidor iniciar.
  - [ ] **3.2. Configurar o Cliente OpenRouter:** Configure a biblioteca `openai` para usar a API do OpenRouter. A beleza é que você só precisa mudar a `baseURL` e passar a chave correta.
    ```typescript
    import OpenAI from 'openai';

    const openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    ```
  - [ ] **3.3. Implementar a Lógica RAG no Endpoint `/api/chat`:**
      - [ ] Receber a pergunta do usuário.
      - [ ] Gerar o embedding da pergunta usando `OpenAIEmbeddings`.
      - [ ] Fazer uma busca por similaridade no índice FAISS carregado (`similaritySearchVectorWithScore`).
      - [ ] Pegar o texto dos `k` chunks mais relevantes retornados.
      - [ ] Montar o prompt final, injetando os chunks como contexto.
      - [ ] Fazer a chamada para `openrouter.chat.completions.create()`, especificando o `model` desejado (ex: `meta-llama/llama-3-8b-instruct`).
      - [ ] Retornar a resposta do modelo para o frontend.

#### ✅ Fase 4: Integração e Melhorias no Frontend

  - [ ] **4.1. Conectar com o Backend:** Garanta que o `useChat` do Vercel AI SDK no seu frontend (`apps/frontend`) está configurado para fazer as requisições para o seu endpoint `/api/chat`.
  - [ ] **4.2. (Opcional) Seletor de Modelos:** Adicione um `<select>` ou botões no frontend para que o usuário possa escolher qual dos modelos gratuitos ele quer usar na conversa (Llama 3 8B, Mistral 7B, etc.). Essa escolha seria enviada na requisição para o backend.

-----

### 2\. Modelos Gratuitos Adicionais no OpenRouter

Além da sua lista, o OpenRouter oferece outros modelos gratuitos de alta qualidade que você pode adicionar:

  - **Nous Research:** Hermes 2 Pro Llama-3 8B
  - **Phind:** Phind CodeLlama v2

-----

### 3\. Estrutura de Pastas Sugerida

A estrutura do seu backend ficará mais robusta e organizada assim:

```
/apps/backend/
├── src/
│   ├── api/
│   │   └── routes/
│   │       └── chat.ts       // Lógica do endpoint de chat
│   ├── core/
│   │   └── openrouter.ts   // Configuração do cliente OpenRouter
│   ├── knowledge-base/
│   │   ├── CV.md
│   │   └── Projects.md
│   ├── scripts/
│   │   └── generate-index.ts // Nosso script para criar o índice
│   ├── index.ts              // Ponto de entrada da aplicação Express
│   └── faiss.index           // O arquivo do banco vetorial gerado
├── .env
├── package.json
└── tsconfig.json
```

-----

### 4\. Atualização do Documento `CONTRIBUTING.md`

Aqui está a seção "Contexto do Projeto" atualizada para o seu `CONTRIBUTING.md`.

\<details\>
\<summary\>Clique para ver a atualização do CONTRIBUTING.md\</summary\>

```markdown
## 1. Contexto do Projeto

**Ask Richter** é um "CV Interativo", um chatbot especialista na minha trajetória profissional. O objetivo é transformar um currículo estático em uma ferramenta de marketing poderosa e memorável, onde recrutadores, líderes técnicos e outros profissionais possam fazer perguntas em linguagem natural e obter respostas detalhadas e contextuais sobre minhas experiências, projetos e competências.

A aplicação utiliza uma arquitetura **RAG (Retrieval-Augmented Generation)** para fornecer respostas precisas. As informações do meu CV e projetos são processadas, fragmentadas e convertidas em vetores (embeddings), que são armazenados em um banco de dados vetorial local **FAISS**.

Quando um usuário faz uma pergunta, a aplicação busca os trechos de informação mais relevantes no banco FAISS e os injeta como contexto em um prompt para um Large Language Model (LLM), garantindo respostas focadas e baseadas em fatos.

#### Arquitetura e Stack Tecnológica:
- **Estrutura:** Monorepo gerenciado com Turborepo.
- **Backend:** API RESTful desenvolvida em **Node.js** com **Express.js** e **TypeScript**. Responsável por:
    - Um script offline para indexar documentos no banco vetorial **FAISS**.
    - Um endpoint online para orquestrar o fluxo RAG.
- **Frontend:** Interface de chat reativa desenvolvida com **Next.js** e **TypeScript**, utilizando o **Vercel AI SDK**.
- **Integração de IA:**
    - **LLM Gateway:** **OpenRouter** é utilizado para acessar uma variedade de modelos de linguagem.
    - **Modelos Utilizados (Gratuitos):** Meta Llama 3 (8B, 70B), Mistral (7B), Mixtral (8x7B), Google Gemma (7B), OpenChat 3.5, entre outros.
    - **Embeddings:** O modelo `text-embedding-3-small` da OpenAI é usado para a vetorização dos documentos.
- **Deploy:** O backend será hospedado no **Render.com** (via Docker) e o frontend na **Vercel**.
```

\</details\>

Este plano detalhado te dá um caminho claro e estruturado. Cada fase é um marco importante. Estou à disposição para detalhar qualquer um desses pontos quando você começar a implementação.
