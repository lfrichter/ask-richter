# Ask Richter - Meu CV Interativo com IA

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

Este projeto transforma um currículo tradicional em uma experiência de diálogo. O **Ask Richter** é um chatbot especialista na minha trajetória profissional, permitindo que recrutadores e líderes técnicos façam perguntas em linguagem natural e recebam respostas inteligentes e contextuais, baseadas nos meus dados profissionais consolidados.

Mais do que um portfólio, é uma ferramenta de marketing profissional e uma demonstração prática de competências em arquitetura de software moderna, desenvolvimento full-stack e integração com IA.

## 🚀 Principais Features

- **Interface de Chat Conversacional:** Uma UI limpa e reativa para um diálogo fluido.
- **Respostas Contextuais com RAG:** Utiliza a técnica de Retrieval-Augmented Generation, buscando informações em um banco vetorial **FAISS** para gerar respostas precisas.
- **Gateway de LLMs com OpenRouter:** Flexibilidade para usar diversos modelos de linguagem como Llama 3, Mistral, Gemma, entre outros.
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

  - **Node.js:** Versão LTS (recomenda-se usar um gerenciador como `nvm`).
  - **npm:** Versão compatível com a sua instalação do Node.js.

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
# Em apps/backend/.env
OPENROUTER_API_KEY="sua_chave_aqui_do_openrouter"
OPENAI_API_KEY="sua_chave_aqui_da_openai_para_embeddings"
```

#### 4\. Geração do Banco Vetorial

Antes de iniciar a aplicação, você precisa gerar o índice vetorial com os seus documentos. A partir da **raiz do projeto**, execute:

```bash
npm run build-index --workspace=backend
```

Este comando criará o arquivo `faiss.index` no diretório `apps/backend/src`, que será usado pela aplicação para as buscas de similaridade.

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
