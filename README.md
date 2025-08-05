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
- **Respostas Contextuais com IA:** Utiliza um modelo de linguagem (LLM) da OpenAI para interpretar perguntas e formular respostas com base no meu CV.
- **Arquitetura Full-Stack Moderna:** Backend em Node.js/Express e Frontend em Next.js, ambos com TypeScript.
- **Desenvolvimento Type-Safe:** Código 100% tipado, com tipos e interfaces compartilhados entre o cliente e o servidor para máxima robustez.
- **Estrutura em Monorepo:** Organizado com Turborepo para um desenvolvimento integrado e eficiente.

## 🛠️ Stack Tecnológica

| Camada               | Tecnologia                        | Descrição                                                                                                  |
| :------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Backend**          | Node.js, Express.js, TypeScript   | API RESTful responsável pela lógica de negócio e comunicação com o serviço de IA.                          |
| **Frontend**         | Next.js, React, Tailwind CSS      | Interface de usuário reativa e moderna, utilizando o Vercel AI SDK para a gestão do estado do chat.        |
| **DevOps & Tooling** | Turborepo, Docker, Vercel, Render | Monorepo para gestão do código, Docker para conteinerização do backend e deploy em plataformas otimizadas. |

## 🏗️ Arquitetura do Sistema

O fluxo de dados é projetado para ser simples e desacoplado, garantindo uma comunicação eficiente entre o usuário e o serviço de IA.

```mermaid
graph TD
    subgraph "Usuário (Recrutador)"
        Frontend["🌐 Interface de Chat (Next.js)"]
    end

    subgraph "Aplicação (Monorepo)"
        Backend["🔌 API Backend (Node.js/Express)"]
        Loader["📄 Loader do CV (lê o CV.md)"]
        PromptEngine["⚙️ Motor de Prompt"]
    end

    subgraph "Serviços Externos"
        IA_API["🤖 API do LLM (OpenAI)"]
    end

    Frontend -- "1\. Envia pergunta do usuário" --> Backend
    Backend -- "2\. Carrega contexto do CV" --> Loader
    Backend -- "3\. Cria o prompt final" --> PromptEngine
    Backend -- "4\. Envia prompt para a IA" --> IA_API
    IA_API -- "5\. Retorna resposta gerada" --> Backend
    Backend -- "6\. Envia resposta para o Frontend" --> Frontend

```

## ⚙️ Rodando o Projeto Localmente

Para executar o projeto no seu ambiente de desenvolvimento, siga os passos abaixo.

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/seu-usuario/ask-richter.git](https://github.com/seu-usuario/ask-richter.git)
    cd ask-richter
    ```

2.  **Instale as dependências:**
    Na raiz do monorepo, o Turborepo gerencia a instalação para todos os `apps` e `packages`.

    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Você precisará de uma chave de API da OpenAI. Crie um arquivo `.env` na raiz da aplicação do backend (`apps/backend/.env`) a partir do exemplo:

    ```
    # Em apps/backend/.env
    OPENAI_API_KEY="sua_chave_aqui"
    ```

4.  **Execute o Ambiente de Desenvolvimento:**
    Este comando iniciará o backend e o frontend simultaneamente.

    ```bash
    npm run dev
    ```

      - O frontend estará disponível em `http://localhost:3000`.
      - O backend estará disponível em `http://localhost:3001`.

## 🤝 Como Contribuir

Este é um projeto pessoal, mas estou aberto a sugestões e melhorias. Para garantir a qualidade e a consistência do código, por favor, siga as diretrizes detalhadas no nosso **[Guia de Contribuição](https://www.google.com/search?q=CONTRIBUTING.md)**.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
