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

Este projeto transforma um currículo tradicional em uma experiência de diálogo. O **Ask Richter** é um chatbot especialista na minha trajetória profissional, permitindo que recrutadores e líderes técnicos façam perguntas em linguagem natural e recebam respostas inteligentes e contextuais, baseadas nos meus dados profissionais consolidados.

Mais do que um portfólio, é uma ferramenta de marketing profissional e uma demonstração prática de competências em arquitetura de software moderna, desenvolvimento full-stack e integração com IA.

## 🚀 Principais Features

- **Interface de Chat Conversacional:** Uma UI limpa e reativa para um diálogo fluido.
- **Respostas Contextuais com RAG:** Utiliza a técnica de Retrieval-Augmented Generation, buscando informações em um banco vetorial **FAISS** para gerar respostas precisas.
- **Suporte a LLMs Locais com Ollama:** Configurado por padrão para rodar com modelos de linguagem locais (ex: Llama 3), permitindo testes e uso sem custo e com total privacidade.
- **Arquitetura Full-Stack Moderna:** Backend em Node.js/Express e Frontend em Next.js, ambos com TypeScript.
- **Estrutura em Monorepo:** Organizado com Turborepo para um desenvolvimento integrado e eficiente.

## 🛠️ Stack Tecnológica

| Camada               | Tecnologia                          | Descrição                                                                                                      |
| :------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Backend**          | Node.js, Express.js, TypeScript     | API RESTful responsável pela lógica RAG e comunicação com o OpenRouter.                                        |
| **Frontend**         | Next.js, React, Tailwind CSS        | Interface de usuário reativa, utilizando o Vercel AI SDK para a gestão do estado do chat.                      |
| **IA & Dados**       | FAISS, LangChain, OpenAI Embeddings | FAISS para o banco vetorial local, LangChain para orquestração de dados e OpenAI para a geração de embeddings. |
| **DevOps & Tooling** | Turborepo, Docker, Vercel, Render   | Monorepo para gestão do código, Docker para conteinerização e deploy em plataformas otimizadas.                |

## 🏗️ Arquitetura do Sistema

O fluxo de dados é projetado para ser simples e desacoplado, garantindo uma comunicação eficiente entre o usuário e o serviço de IA.

```mermaid
graph TD
    subgraph "Fase 1: Indexação (Offline)"
        A1(Fonte de Dados<br>CV.md, Projetos.md) --> A2(Chunking<br>Fragmentação por Seção)
        A2 --> A3(Modelo de Embedding<br>text-embedding-3-small)
        A3 --> A4(Banco de Dados Vetorial<br>FAISS)
    end

    subgraph "Fase 2: Consulta (Online)"
        B1(Usuário faz pergunta) --> B2(Frontend<br>Next.js)
        B2 --> B3(Backend<br>Node.js API)
        B3 --> B4(Modelo de Embedding)
        B4 -- "Vetor da pergunta" --> B5(Busca no Banco Vetorial)
        A4 -- "Chunks relevantes" --> B5
        B5 --> B6(Montagem do Prompt<br>Contexto + Pergunta)
        B6 --> B7(LLM via OpenRouter<br>Llama 3, Mistral, etc.)
        B7 --> B3
        B3 --> B2
    end
````

## ⚙️ Rodando o Projeto Localmente

Para executar o projeto no seu ambiente de desenvolvimento, siga os passos abaixo.

#### 1\. Pré-requisitos

  - **Node.js:** Versão LTS (recomenda-se `nvm`).
  - **npm:** Versão compatível com Node.js.
  - **Ollama:** A aplicação requer o [Ollama](https://ollama.com/) instalado e rodando localmente.
      - Após instalar, puxe um modelo de linguagem no seu terminal:
        ```bash
        ollama pull llama3
        ```

#### 2\. Instalação

Clone o repositório e instale as dependências a partir da raiz do monorepo.

```bash
git clone [https://github.com/seu-usuario/ask-richter.git](https://github.com/seu-usuario/ask-richter.git)
cd ask-richter
npm install
```

#### 3\. Variáveis de Ambiente

Navegue até a pasta do backend (`apps/backend`) e crie o seu arquivo `.env` a partir do exemplo.

```bash
cd apps/backend
cp .env.example .env
```

Agora, edite o arquivo `.env` e adicione suas chaves de API.

```env
# Chave da OpenAI (APENAS para gerar os embeddings, não para o chat)
OPENAI_API_KEY="sk-..."

# Provedor de IA padrão. Mude para 'huggingface' para usar a API externa.
AI_PROVIDER="ollama"

# URL da sua instância Ollama
OLLAMA_BASE_URL="http://localhost:11434"

# (Opcional) Chave da Hugging Face, se for usar
HUGGINGFACE_API_KEY="hf_..."
```

#### 4. Geração do Banco Vetorial

O processo de indexação pode ser executado de duas formas, dependendo do seu ambiente.

**Modo 1: Geração Apenas Local (para Desenvolvimento)**

Neste modo, o índice é criado na sua máquina e usado diretamente pelo backend. É ideal para rodar o projeto localmente sem dependências externas.

!["Store Faiss.index"](https://i.imgur.com/KRuhmbs.png)

1.  Certifique-se de que as variáveis de ambiente do Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) **não** estejam definidas no seu arquivo `apps/backend/.env`.
2.  Execute o comando de build a partir da **raiz do projeto**:
    ```bash
    npm run build-index --workspace=backend
    ```
O script criará o índice no diretório `/tmp/faiss_index` e exibirá um erro ao tentar fazer o upload para o Supabase, o que é esperado. O servidor local usará esse índice automaticamente.

**Modo 2: Geração Local com Upload para o Supabase (para Produção/Deploy)**

Este modo é usado para gerar o índice e enviá-lo para um armazenamento persistente (Supabase Storage), de onde ele pode ser baixado por um ambiente de produção (ex: Render, Vercel).

!["Faiss.index in the Supabase"](https://i.imgur.com/h7KmEJY.png)

1.  Adicione as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_BUCKET_NAME` ao seu arquivo `apps/backend/.env`.
2.  Execute o mesmo comando:
    ```bash
    npm run build-index --workspace=backend
    ```
O script criará o índice localmente e, em seguida, fará o upload dos arquivos para o seu bucket no Supabase, tornando-os disponíveis para download em ambientes de produção.

#### 5\. Execução

Com tudo configurado, inicie o ambiente de desenvolvimento a partir da **raiz do projeto**:

```bash
npm run dev
```

O Turborepo iniciará os dois serviços:

  - O frontend estará disponível em `http://localhost:3000`.
  - O backend estará disponível em `http://localhost:3001`.

## 🤝 Como Contribuir

Este é um projeto pessoal, mas estou aberto a sugestões e melhorias. Para garantir a qualidade e a consistência do código, por favor, siga as diretrizes detalhadas no nosso **[Guia de Contribuição](https://www.google.com/search?q=CONTRIBUTING.md)**.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.