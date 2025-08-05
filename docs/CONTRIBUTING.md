---
status: permanent
tags:
  - AI/Gemini25Pro
date: 2025-08-05
project:
related:
prompt:
Version: "1.0"
---
# Guia de Contribuição - Ask Richter

Primeiramente, obrigado pelo seu interesse em contribuir com o projeto **Ask Richter**\! Este documento fornece um conjunto de diretrizes para garantir que o desenvolvimento seja coeso, de alta qualidade e alinhado com os objetivos do projeto.

## Sumário

1.  [Contexto do Projeto](https://www.google.com/search?q=%231-contexto-do-projeto)
2.  [Como Contribuir](https://www.google.com/search?q=%232-como-contribuir)
3.  [Regras e Padrões de Desenvolvimento](https://www.google.com/search?q=%233-regras-e-padr%C3%B5es-de-desenvolvimento)
      - [3.1 Filosofia e Mentalidade](https://www.google.com/search?q=%2331-filosofia-e-mentalidade)
      - [3.2 Boas Práticas de Código](https://www.google.com/search?q=%2332-boas-pr%C3%A1ticas-de-c%C3%B3digo)
      - [3.3 Padrões de Arquitetura](https://www.google.com/search?q=%2333-padr%C3%B5es-de-arquitetura)
      - [3.4 Workflow de Desenvolvimento](https://www.google.com/search?q=%2334-workflow-de-desenvolvimento)

## 1\. Contexto do Projeto

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

Este plano detalhado te dá um caminho claro e estruturado. Cada fase é um marco importante. Estou à disposição para detalhar qualquer um desses pontos quando você começar a implementação.

## 2\. Como Contribuir

O desenvolvimento segue um fluxo padrão baseado em Git:

1.  Crie uma `issue` descrevendo a `feature` ou `bug`.
2.  Crie um `branch` a partir do `main` com um nome descritivo (ex: `feature/add-health-check` ou `fix/chat-streaming-error`).
3.  Desenvolva a funcionalidade no seu `branch`, seguindo todas as regras deste guia.
4.  Garanta que todos os testes estão passando.
5.  Abra um `Pull Request` (PR) para o `main`, referenciando a `issue` original.

## 3\. Regras e Padrões de Desenvolvimento

Estas regras são a espinha dorsal do projeto e devem ser seguidas rigorosamente.

### 3.1 Filosofia e Mentalidade

  - **Compreensão Profunda:** Antes de escrever uma linha de código, entenda completamente o requisito ou o bug. Leia a documentação, investigue o código existente e, se necessário, faça perguntas.
  - **Simplicidade Acima de Tudo:** Evite complexidade desnecessária. O código deve ser simples, claro, objetivo e expressivo. Crie abstrações (como Interfaces) apenas quando for estritamente necessário para reduzir acoplamento.
  - **Foco na Causa Raiz:** Ao depurar, não trate apenas os sintomas. Investigue até encontrar a causa raiz do problema e aplique uma solução definitiva.

### 3.2 Boas Práticas de Código

  - **Clean Code e SOLID:** O código deve ser legível, de fácil manutenção e seguir os cinco princípios SOLID sempre que aplicável. Nomes de variáveis, funções e classes devem ser claros e expressivos.
  - **Testes Abrangentes:** A prática de TDD (Test-Driven Development) é encorajada. Testes devem cobrir não apenas o "caminho feliz", mas também todos os casos de borda (edge cases) relevantes. A robustez da solução é verificada pela qualidade de seus testes.
  - **Commits Semânticos:** Os commits devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Isso mantém o histórico do Git limpo e permite a automação de changelogs. (Ex: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
  - **Tratamento de Erros:** Erros devem ser tratados de forma explícita e elegante. Evite blocos `try/catch` genéricos. Forneça mensagens de erro claras que ajudem na depuração.

### 3.3 Padrões de Arquitetura

  - **Monorepo:** A estrutura do projeto é um monorepo. Utilize os `workspaces` e os pacotes compartilhados (`packages/`) para código comum, especialmente para tipos e interfaces do TypeScript, garantindo consistência entre o frontend e o backend.
  - **Desenvolvimento "Type-Safe":** O TypeScript é usado de ponta a ponta. Evite o uso de `any` a todo custo. Defina interfaces e tipos claros para todas as estruturas de dados, especialmente para as que cruzam a fronteira entre API e cliente.
  - **API Stateless:** O backend deve ser `stateless`. A autenticação (se aplicável no futuro) e a sessão devem ser gerenciadas via tokens (como JWT).
  - **Gestão de Configuração:** NUNCA "hardcode" chaves de API, segredos ou outras configurações sensíveis. Utilize variáveis de ambiente e um arquivo `.env` (que deve estar no `.gitignore`).

### 3.4 Workflow de Desenvolvimento

1.  **Investigação Primeiro:** Antes de alterar qualquer código, leia os arquivos `README.md`, este `CONTRIBUTING.md` e qualquer outra documentação pertinente para obter contexto completo.
2.  **Planeje Antes de Codificar:** Desenvolva um plano de ação claro, passo a passo, antes de iniciar a implementação. Divida o problema em tarefas menores e gerenciáveis.
3.  **Implementação Incremental:** Faça alterações pequenas e testáveis. Valide cada passo antes de prosseguir. Isso facilita a depuração e o controle de versão.
4.  **Debugging Eficaz:** Use `console.log` ou o debugger da IDE para inspecionar o estado do programa. Adicione mensagens descritivas para entender o fluxo. **Lembre-se de remover todos os logs de debug antes de commitar.**
5.  **Gestão de Dependências:** Utilize sempre as versões mais recentes e estáveis das dependências. Antes de instalar, verifique a compatibilidade com o restante do projeto. Não faça downgrade de pacotes como forma de resolver um problema.
6.  **Não Poluir o Projeto:** Evite commitar arquivos de teste, scripts temporários (`.sh`, `makefiles` isolados) ou qualquer outro artefato que não seja parte da solução final. Mantenha a raiz do projeto limpa.
