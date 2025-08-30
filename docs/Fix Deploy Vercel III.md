---
status: permanent
tags:
  - AI/Gemini25Pro
date: 2025-08-29
project: 
related: 
prompt:
---
Analisando este novo log, vejo uma pista crucial. O erro mudou novamente, e isso é uma ótima notícia, pois nos dá uma nova direção.

O erro anterior era um problema de sintaxe JSX. O erro de agora é muito mais específico e técnico: `TypeError: Cannot read properties of null (reading 'useContext')`.

### 🕵️‍♂️ **Análise do Erro: O Que Aconteceu?**

1.  **O Gatilho:** O erro acontece durante a fase de "prerendering" da Vercel, especificamente ao tentar gerar as páginas de erro estáticas (`/404` e `/500`).
2.  **A Fonte:** O stack trace aponta para uma biblioteca chamada `styled-jsx`. Esta é uma biblioteca de CSS-in-JS que o Next.js costumava usar por padrão em versões mais antigas, mas que pode entrar em conflito com versões mais novas do React e do Next.js se não estiver configurada corretamente.
3.  **A Causa Provável:** O erro `Cannot read properties of null (reading 'useContext')` dentro de um processo de renderização do lado do servidor (como o `prerendering` da Vercel) quase sempre indica um **conflito de versões do React**. É provável que uma de suas dependências (possivelmente uma mais antiga) esteja trazendo uma versão do `styled-jsx` que, por sua vez, espera uma versão do React diferente da que está instalada no seu projeto (`React 18`, via Next.js 14). Durante a renderização no servidor, duas versões do React tentam coexistir, uma delas acaba com um contexto `null`, e a aplicação quebra.

Lembrando do seu histórico, já enfrentamos problemas de build na Vercel que não ocorriam localmente. Esta parece ser mais uma manifestação desse tipo de problema de ambiente/dependência.

### 🗺️ **Plano de Ação: Diagnóstico do Conflito de Dependências**

Vamos criar um plano de ação para a Gemini CLI encontrar e resolver este conflito. A abordagem será a de um detetive: encontrar o culpado (`styled-jsx`), descobrir quem o trouxe para o projeto e forçar uma resolução.

  * [ ] **Tarefa 1: 🔍 Encontrar a Origem do `styled-jsx`**

      * **Ação:** Precisamos descobrir qual dependência no seu projeto está incluindo a biblioteca `styled-jsx`. O comando `npm list` é perfeito para isso.
      * **Comando:** `npm list styled-jsx --workspace=frontend`

  * [ ] **Tarefa 2: 🔬 Verificar Duplicatas do React**

      * **Ação:** Vamos verificar se existem múltiplas versões do React instaladas no monorepo, o que é a causa mais comum deste erro de `useContext`.
      * **Comando:** `npm list react`

  * [ ] **Tarefa 3: 🛠️ Forçar uma Resolução Única (se necessário)**

      * **Ação:** Se a Tarefa 2 revelar múltiplas versões do React, usaremos a mesma estratégia que usamos no backend: o `overrides` no `package.json` da raiz do projeto. Isso forçará todo o monorepo a usar uma única e consistente versão do React.
      * **Exemplo de Código (a ser adicionado no `package.json` da raiz):**
        ```json
        "overrides": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          // ... outras overrides que já temos
        }
        ```
      * **Ação Pós-Modificação:** Será necessário rodar o `turbo_reset` novamente para aplicar a nova regra.

  * [ ] **Tarefa 4: 🚀 Atualização Controlada do Next.js (se necessário)**

      * **Ação:** Conflitos como este são frequentemente resolvidos ao atualizar para a versão patch mais recente do Next.js, que pode incluir correções de compatibilidade com o ecossistema.
      * **Comando:** `npm install next@latest --workspace=frontend`
      * **Ação Pós-Modificação:** Fazer o commit da alteração e tentar o deploy na Vercel novamente.

  * [ ] **Tarefa 5: ❌ Desabilitar `styled-jsx` (como último recurso)**

      * **Ação:** Se você não está usando `styled-jsx` diretamente (o que é provável, já que você usa Tailwind CSS), e o conflito persistir, podemos instruir o Next.js a não usá-lo.
      * **Código (a ser adicionado em `apps/frontend/next.config.mjs`):**
        ```js
        const nextConfig = {
          compiler: {
            styledJsx: false,
          },
        };
        export default nextConfig;
        ```
      * **Lógica:** Esta é a opção "nuclear", que desativa completamente a funcionalidade, eliminando a fonte do erro.
