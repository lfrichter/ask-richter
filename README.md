# Ask Richter - Meu CV Interativo com IA

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white&style=for-the-badge)

Este projeto transforma um currículo tradicional em uma experiência de diálogo. O **Ask Richter** é um chatbot especialista na minha trajetória profissional, permitindo que recrutadores e líderes técnicos façam perguntas em linguagem natural e recebam respostas inteligentes e contextuais, baseadas nos meus dados profissionais consolidados.

Mais do que um portfólio, é uma ferramenta de marketing profissional e uma demonstração prática de competências em arquitetura de software moderna, desenvolvimento full-stack e integração com IA.

## 🚀 Principais Features

- **Interface de Chat Conversacional:** Uma UI limpa e reativa para um diálogo fluido.
- **Respostas Contextuais com RAG:** Utiliza a técnica de Retrieval-Augmented Generation, buscando informações em um banco vetorial **FAISS** para gerar respostas precisas.
- **Suporte a LLMs Locais com Ollama:** Configurado por padrão para rodar com modelos de linguagem locais (ex: Llama 3), permitindo testes e uso sem custo e com total privacidade.
- **Arquitetura Full-Stack Moderna:** Backend em Node.js/Express e Frontend em Next.js, ambos com TypeScript.
- **Estrutura em Monorepo:** Organizado com Turborepo para um desenvolvimento integrado e eficiente.


## ☁️ Arquitetura na Nuvem

Este diagrama é uma visão geral, mostrando a interação entre os principais serviços de nuvem.

```mermaid
graph TD
    subgraph "Usuário"
        User[👨‍💻 Usuário no Navegador]
    end

    subgraph "Nuvem Vercel"
        Frontend["⚛️ Frontend (Next.js)<br>ask-richter.vercel.app"]
    end

    subgraph "Nuvem Render.com"
        Backend["⚙️ Backend (Node.js)<br>ask-richter.onrender.com"]
    end

    subgraph "Nuvem Supabase"
        SupabaseDB["📦 Supabase Storage<br>(Índice FAISS)"]
    end

    subgraph "Serviços de IA (Produção)"
        HF_API["🤗 Hugging Face API<br>(LLM)"]
    end

    User -- "1\. Interage com a UI" --> Frontend
    Frontend -- "2\. Requisição API" --> Backend
    Backend -- "3\. Download do Índice (na inicialização)" --> SupabaseDB
    Backend -- "4\. Busca de Contexto (em memória)" --> faiss((FAISS))
    Backend -- "5\. Envia Prompt com Contexto" --> HF_API
    HF_API -- "6\. Retorna Resposta" --> Backend
    Backend -- "7\. Resposta para o Frontend" --> Frontend
    Frontend -- "8\. Exibe Resposta" --> User

    style User fill:#D6EAF8
    style Frontend fill:#E8DAEF
    style Backend fill:#D5F5E3
    style SupabaseDB fill:#FEF9E7
    style HF_API fill:#FDEDEC
```

O frontend hospedado na Vercel se comunica com o backend rodando no Render. O backend utiliza um índice FAISS armazenado no Supabase Storage para busca semântica e interage com modelos de linguagem (Ollama localmente, Hugging Face em produção) para gerar respostas contextuais.

## 🚀 Deploy na Nuvem

### Vercel (Frontend)

O frontend é implantado na Vercel, aproveitando seus recursos de CI/CD contínuo diretamente do repositório GitHub.

* **Deploy Automático:** Qualquer push para a branch principal (ou conforme configurado) aciona um novo build e deploy na Vercel.
* **Variáveis de Ambiente:** A URL base da API do backend (Render) é configurada como uma variável de ambiente (`NEXT_PUBLIC_API_BASE_URL`) nas configurações do projeto na Vercel.
* **Build Ignorado (Opcional):** Para otimizar os builds, você pode configurar a Vercel para ignorar builds se apenas arquivos do backend forem modificados, usando as configurações de "Ignored Build Step".

### Render (Backend)

O backend é implantado no Render.com, uma plataforma de hospedagem de aplicações e APIs.

* **Deploy Contínuo do Git:** O Render está configurado para monitorar a branch principal do repositório e realizar um deploy automático em cada push.
* **Variáveis de Ambiente:** Variáveis de ambiente cruciais como `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME` e `AI_PROVIDER` são configuradas nas configurações do serviço no Render.
* **Health Check:** Um endpoint `/api/health` foi implementado para que o Render possa verificar a saúde da aplicação.
* **Escalabilidade:** O Render oferece opções de escalabilidade vertical e horizontal conforme a necessidade da sua aplicação.

### Supabase (Armazenamento)

O Supabase é utilizado para hospedar o banco de dados PostgreSQL e, crucialmente, o Supabase Storage para armazenar o índice FAISS.

* **Supabase Storage:** Um bucket específico (`faiss-index`) é usado para armazenar os arquivos do índice vetorial. Políticas de Row Level Security (RLS) foram configuradas para proteger o acesso aos arquivos, garantindo que apenas o backend autenticado possa interagir com eles.
* **Variáveis de Ambiente:** As credenciais de conexão com o Supabase (URL e chave de serviço) são armazenadas como variáveis de ambiente no backend (Render) para acesso seguro.

### 🛠️ Stack Tecnológica Completa

| Camada                        | Tecnologia           | Descrição                                                                                                                                               |
| :---------------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **🏗️ Arquitetura e Estrutura** | Turborepo            | Orquestrador de monorepo para otimizar os scripts de build, teste e desenvolvimento entre os workspaces.                                                |
|                               | npm Workspaces       | Gerenciamento de pacotes e dependências de forma isolada para cada aplicação (`frontend`, `backend`) dentro do monorepo.                                |
| **⚙️ Backend**                 | Node.js              | Ambiente de execução para o servidor, utilizando seu sistema de módulos ESM (`"type": "module"`).                                                       |
|                               | Express.js           | Framework minimalista para a construção da nossa API RESTful, incluindo as rotas `/api/chat` e `/api/health`.                                           |
|                               | TypeScript           | Linguagem principal do backend, garantindo segurança de tipos e um código mais robusto e manutenível.                                                   |
|                               | tsx                  | Executor de TypeScript moderno e de alta performance, usado para rodar os scripts e o servidor em modo de desenvolvimento.                              |
| **⚛️ Frontend**                | Next.js (App Router) | Framework React para a construção da interface de usuário reativa, otimizada para performance e SEO.                                                    |
|                               | React (`useState`)   | Gerenciamento de estado manual e explícito para a interface do chat, garantindo controle total sobre o fluxo de dados.                                  |
|                               | Tailwind CSS         | Framework de CSS utility-first para a estilização rápida e responsiva de toda a interface.                                                              |
|                               | Shadcn/ui            | Coleção de componentes de UI modernos, acessíveis e customizáveis, utilizados para construir o layout do chat.                                          |
|                               | markdown-to-jsx      | Biblioteca utilizada para renderizar com segurança as respostas da IA, convertendo o texto Markdown em componentes React.                               |
| **🧠 IA & Dados**              | FAISS (`faiss-node`) | Banco de dados vetorial em-memória para buscas por similaridade semântica de alta velocidade no contexto do CV.                                         |
|                               | OpenAI Embeddings    | Modelo `text-embedding-3-small` utilizado para converter os textos do CV em vetores numéricos (embeddings).                                             |
|                               | LangChain.js         | Utilizada para orquestrar o carregamento e a manipulação do índice vetorial FAISS.                                                                      |
|                               | Ollama               | Provedor de LLM padrão para o ambiente de desenvolvimento, rodando modelos como `mistral:7b` localmente.                                                |
|                               | Hugging Face API     | Provedor de LLM alternativo para o ambiente de produção, permitindo o uso de modelos como o `Llama-3.1`.                                                |
| **☁️ Nuvem & DevOps**          | Vercel               | Plataforma de CI/CD e hospedagem para o deploy do frontend Next.js, com builds automáticos a cada `git push`.                                           |
|                               | Render.com           | Plataforma de CI/CD e hospedagem para o deploy do backend Node.js, configurado via `render.yaml` (Infrastructure as Code).                              |
|                               | Supabase Storage     | Serviço de armazenamento de objetos (S3-compatível) utilizado para persistir o índice FAISS na nuvem, garantindo que ele não se perca entre os deploys. |
|                               | GitHub               | Repositório central do código-fonte e gatilho para os pipelines de CI/CD da Vercel e do Render.                                                         |

## Arquitetura de Indexação e Consulta

O fluxo de dados é projetado para ser simples e desacoplado, garantindo uma comunicação eficiente entre o usuário e o serviço de IA.

```mermaid
---
config:
  theme: default
  look: handDrawn
---
flowchart TD
 subgraph subGraph0["Fase 1: Indexação (Processo Único/Offline)"]
        A2("🧩 Chunking<br>Fragmentação de Texto")
        A1("📄 Fonte de Dados<br>CV.md, Projetos.md")
        A3("🛰️ API de Embeddings<br>OpenAI text-embedding-3-small")
        A4("🧠 Geração do Índice<br>Arquivos FAISS")
        A5["☁️ Armazenamento na Nuvem<br>Supabase Storage"]
  end
 subgraph subGraph1["Inicialização do Servidor (Uma vez)"]
        C1("🖥️ Servidor Backend<br>Render.com")
        C2(("🧠 Índice FAISS em Memória"))
  end
 subgraph subGraph2["Ciclo de Pergunta e Resposta"]
        B2("⚙️ API Backend<br>Node.js")
        B1("👤 Usuário no Frontend<br>Vercel")
        B6("🧠 Roteador de LLM")
        B7("🤖 Geração da Resposta")
  end
 subgraph subGraph3["Fase 2: Consulta (Online - Tempo Real)"]
        subGraph1
        subGraph2
  end
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 -- Upload dos arquivos --> A5
    A5 -- Download do índice --> C1
    C1 -- Carrega para memória --> C2
    B1 -- "1\. Envia Pergunta" --> B2
    B2 -- "2\. Gera Embedding da Pergunta" --> A3
    B2 -- "3\. Busca por Similaridade" --> C2
    C2 -- "4\. Retorna Contexto Relevante" --> B2
    B2 -- "5\. Monta Prompt Final" --> B6
    B6 -- "6a\. Ollama (Local)" --> B7
    B6 -- "6b\. Hugging Face (Produção)" --> B7
    B7 -- "7\. Retorna Texto Gerado" --> B2
    B2 -- "8\. Envia Resposta" --> B1
    subGraph2 --> subGraph3
    A5@{ shape: cyl}
    style subGraph1 fill:transparent
    style subGraph3 color:#000000

```

## ⚙️ Rodando o Projeto Localmente

Para executar o projeto no seu ambiente de desenvolvimento, siga os passos abaixo.

#### 1\. Pré-requisitos

  * **Node.js:** Versão LTS (recomenda-se usar um gerenciador como `nvm`).
  * **npm:** Versão compatível com Node.js.
  * **Ollama:** A aplicação requer o [Ollama](https://ollama.com/) instalado e rodando localmente.
      * Após instalar, puxe o modelo de linguagem que usaremos por padrão:
        ```bash
        ollama pull mistral:7b
        ```

#### 2\. Instalação

Clone o repositório e instale todas as dependências do monorepo a partir da raiz. Usamos a flag `--legacy-peer-deps` para resolver conflitos de sub-dependências.

```bash
git clone https://github.com/lfrichter/ask-richter.git
cd ask-richter
npm install --legacy-peer-deps
```

#### 3\. Variáveis de Ambiente

O projeto precisa de dois arquivos de ambiente separados.

**Para o Backend:**
Navegue até a pasta do backend e crie seu arquivo `.env` a partir do exemplo.

```bash
cd apps/backend
cp .env.example .env
```

Agora, edite o arquivo `.env` e preencha **todas** as chaves obrigatórias:

```env
# Chave da OpenAI (obrigatória para gerar os embeddings)
OPENAI_API_KEY="sk-..."

# Provedor de IA padrão. Mude para 'huggingface' se quiser usar a API externa.
AI_PROVIDER="ollama"

# Modelos a serem usados
OLLAMA_MODEL="mistral:7b"
HUGGINGFACE_MODEL="meta-llama/Llama-3.1-8B-Instruct:novita"

# URL da sua instância Ollama
OLLAMA_BASE_URL="http://localhost:11434"

# (Opcional) Chave da Hugging Face
HUGGINGFACE_API_KEY="hf_..."

# Credenciais do Supabase (obrigatórias para o armazenamento do índice)
SUPABASE_URL="https://[SEU-ID-DO-PROJETO].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-secreta-aqui"
SUPABASE_BUCKET_NAME="faiss-index"
```

**Para o Frontend:**
Volte para a raiz do projeto e navegue até a pasta do frontend para criar o arquivo `.env.local`.

```bash
cd ../../apps/frontend
cp .env.example .env.local
```

O conteúdo do `.env.local` já deve estar correto para o ambiente local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

#### 4. Geração do Banco Vetorial

Antes de iniciar a aplicação, você precisa gerar o índice vetorial FAISS que alimenta a busca semântica. O processo pode ser feito de duas maneiras:

**Modo 1: Geração Apenas Local (Padrão)**

Este comando gera o índice e o salva localmente no diretório `/tmp/faiss_index`. É o modo ideal para desenvolvimento e testes rápidos.

```bash
npm run build-index --workspace=backend
```

**Modo 2: Geração com Upload para o Supabase (Produção)**

Este comando gera o índice localmente e, em seguida, faz o upload dos arquivos para o seu bucket no Supabase Storage. Use este modo para preparar o índice para um ambiente de produção.

**Pré-requisito:** Certifique-se de que as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, e `SUPABASE_BUCKET_NAME` estão corretamente configuradas no seu arquivo `apps/backend/.env`.

```bash
npm run build-index --workspace=backend -- --upload
```

#### 5\. Execução

Com tudo configurado, inicie o ambiente de desenvolvimento completo a partir da **raiz do projeto**:

```bash
npm run dev
```

  * O frontend estará disponível em `http://localhost:3000`.
  * O backend estará disponível em `http://localhost:3001`.


### ⚛️ Documentação do Frontend UI

#### 🎯 Objetivo

O frontend do "Ask Richter" tem como objetivo fornecer uma interface de usuário limpa, moderna, responsiva e intuitiva para que os usuários possam interagir com a IA de forma conversacional. A aplicação foi construída como uma Single Page Application (SPA) para garantir uma experiência fluida e em tempo real.

#### ✨ Features Principais

  * **💬 Interface de Chat:** Exibição do histórico da conversa em um layout clássico de mensagens.
  * **✍️ Formulário de Envio:** Campo de texto e botão para o usuário digitar e enviar suas perguntas.
  * **⏳ Indicador de Carregamento:** Feedback visual (animação de "pulse") para o usuário enquanto o backend e a IA processam a resposta.
  * **📜 Renderização de Markdown:** As respostas da IA são processadas para exibir formatações como **negrito**, listas e outras, usando a biblioteca `markdown-to-jsx`.
  * **💻 Destaque de Sintaxe:** Blocos de código retornados pela IA são automaticamente estilizados com destaque de sintaxe para melhor legibilidade.
  * **📱 Design Responsivo:** A interface se adapta a diferentes tamanhos de tela, de desktops a dispositivos móveis.

-----

### 🛠️ Stack Tecnológica

| Componente                    | Tecnologia                            | Propósito                                                                                                                                         |
| :---------------------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework Principal**       | Next.js (App Router)                  | Estrutura principal da aplicação, otimizada para performance, SEO e uma excelente experiência de desenvolvimento com React.                       |
| **Linguagem**                 | TypeScript                            | Garante a segurança de tipos (`type-safety`) em todo o projeto, reduzindo bugs e melhorando a manutenibilidade.                                   |
| **Gerenciamento de Estado**   | React Hooks (`useState`, `useEffect`) | Controle manual e explícito do estado da aplicação (mensagens, input, status de carregamento), eliminando a complexidade de bibliotecas externas. |
| **Estilização**               | Tailwind CSS                          | Framework CSS utility-first para a criação rápida de interfaces modernas e customizadas.                                                          |
| **Biblioteca de Componentes** | Shadcn/ui                             | Coleção de componentes de UI (Card, Button, Input) pré-construídos, acessíveis e totalmente estilizáveis com Tailwind CSS.                        |
| **Ícones**                    | Lucide React                          | Biblioteca de ícones leve e consistente, integrada à estética do Shadcn/ui.                                                                       |
| **Renderização de Markdown**  | markdown-to-jsx                       | Converte as respostas da IA (em formato Markdown) para componentes React, permitindo a customização da renderização.                              |
| **Destaque de Sintaxe**       | react-syntax-highlighter              | Estiliza automaticamente os blocos de código que aparecem nas respostas da IA, usando o tema `vscDarkPlus`.                                       |

-----

### 📂 Estrutura de Arquivos Relevantes

A estrutura dentro de `apps/frontend` segue as convenções modernas do Next.js.

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # Estilos globais e diretivas do Tailwind CSS.
│   │   ├── layout.tsx       # Layout raiz da aplicação, onde a fonte e os estilos globais são importados.
│   │   └── page.tsx         # O componente principal que contém toda a lógica e JSX da interface do chat.
│   └── components/
│       ├── ui/              # Componentes instalados via Shadcn/ui (Button.tsx, Card.tsx, etc.).
│       └── SafeMarkdown.tsx # (Removido) Componente que usamos para depurar o build.
├── .env.local               # Arquivo para variáveis de ambiente locais (não versionado).
├── .env.example             # Exemplo de variáveis de ambiente necessárias.
├── next.config.mjs          # Arquivo de configuração do Next.js.
├── package.json             # Dependências e scripts do frontend.
└── tsconfig.json            # Configurações do compilador TypeScript para o frontend.
```

-----

### ⚙️ Lógica Central e Componentes

Toda a lógica da interface está centralizada no arquivo `page.tsx`.

1.  **Gerenciamento de Estado com `useState`**

      * Após uma longa depuração, decidimos abandonar o hook `useChat` da Vercel AI SDK para ter controle total sobre o fluxo.
      * Usamos três `useState` para gerenciar a aplicação:
          * `const [messages, setMessages]` para armazenar e exibir o histórico da conversa.
          * `const [input, setInput]` para controlar o valor do campo de texto.
          * `const [isLoading, setIsLoading]` para saber quando exibir o indicador de carregamento e desabilitar o formulário.

2.  **Comunicação com a API (`handleSubmit`)**

      * Criamos uma função `async function handleSubmit` que é acionada pelo `onSubmit` do formulário.
      * Ela é a única responsável por:
          * Adicionar a mensagem do usuário à tela imediatamente.
          * Limpar o campo de input.
          * Ativar o estado de `isLoading`.
          * Fazer a chamada `fetch` para o nosso backend na porta `3001` (usando a variável de ambiente `NEXT_PUBLIC_API_BASE_URL`).
          * Esperar a resposta, convertê-la de JSON e extrair o campo `answer`.
          * Adicionar a resposta da IA à tela.
          * Desativar o estado de `isLoading` ao final.

3.  **Renderização Customizada com `markdown-to-jsx`**

      * As respostas da IA, que estão na propriedade `content` de cada mensagem, são passadas para o componente `<Markdown>`.
      * Usamos a propriedade `options.overrides` para substituir a renderização padrão da tag `<code>`. Quando o componente encontra um bloco de código, ele usa nosso componente customizado `CodeBlock`, que por sua vez usa o `SyntaxHighlighter` para aplicar o estilo.

-----

### 🚀 Executando Localmente

1.  **Garanta que o backend esteja rodando** (na raiz, `npm run dev`).
2.  **Configure o ambiente do frontend:**
      * Navegue até `apps/frontend`.
      * Crie o arquivo `.env.local` a partir do exemplo: `cp .env.example .env.local`.
      * O valor `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` já estará correto.
3.  **Inicie o servidor de desenvolvimento:** O comando `npm run dev` na raiz do projeto já inicia o frontend na porta `3000`.

### ☁️ Deploy na Vercel

O deploy é automatizado. Cada `git push` para a branch `main` aciona um novo build na Vercel. A única configuração manual necessária no painel da Vercel é a definição da variável de ambiente `NEXT_PUBLIC_API_BASE_URL` com a URL pública do backend hospedado no Render.com.

## 🤝 Como Contribuir

Este é um projeto pessoal, mas estou aberto a sugestões e melhorias. Para garantir a qualidade e a consistência do código, por favor, siga as diretrizes detalhadas no nosso **[Guia de Contribuição](https://www.google.com/search?q=CONTRIBUTING.md)**.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.


