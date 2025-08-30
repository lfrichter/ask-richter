---
status: permanent
tags:
  - AI/Gemini25Pro
date: 2025-08-29
project: 
related: 
prompt:
---
Este erro é quase idêntico ao "Erro Fantasma de Build na Vercel" que você documentou, onde o build falhava na Vercel com erros de tipo (`Cannot find namespace 'JSX'`) mesmo funcionando localmente. A pista principal está na mensagem de erro:

`Unexpected token 'html'. Expected jsx identifier`

Isso indica que o compilador da Vercel, por algum motivo, não está reconhecendo a sintaxe JSX (`<html lang="pt-BR">...</html>`) como código válido, tratando `html` como um token inesperado. Isso geralmente aponta para um problema de configuração do TypeScript ou do Next.js que se manifesta apenas no ambiente de build da Vercel.

Vamos criar um plano de ação sistemático para a Gemini CLI diagnosticar e resolver isso.

### 🕵️‍♂️ **Plano de Ação: Diagnóstico do Erro de Build na Vercel**

Aqui está um plano com checkboxes para a Gemini CLI executar. A abordagem é ir do mais simples ao mais complexo, verificando cada ponto da configuração que pode influenciar a compilação do JSX.

  * [ ] **Tarefa 1: 文件名一致性の検証 (Verificação de Consistência do Nome do Arquivo)**

      * **Ação:** Verifique se o arquivo `layout.tsx` não foi acidentalmente renomeado para `layout.ts`. A extensão `.tsx` é crucial para que o TypeScript processe o JSX corretamente.
      * **Comando:** `ls -l apps/frontend/src/app/layout.tsx`

  * [ ] **Tarefa 2: 構成ファイルのレビュー (Revisão do `tsconfig.json`)**

      * **Ação:** Inspecione o arquivo `apps/frontend/tsconfig.json` para garantir que a opção `jsx` está configurada corretamente. A Vercel espera um valor específico para projetos Next.js.
      * **Verificar:** A opção `"jsx"` deve estar definida como `"preserve"`. Se estiver diferente ou ausente, isso pode ser a causa do problema.
      * **Comando:** `cat apps/frontend/tsconfig.json`

  * [ ] **Tarefa 3: Next.js構成の調査 (Investigação da Configuração do Next.js)**

      * **Ação:** Analise o arquivo `apps/frontend/next.config.mjs` em busca de qualquer configuração experimental ou customização do Webpack que possa estar interferindo no processo de build padrão.
      * **Verificar:** Procure por chaves como `webpack`, `experimental`, ou outras configurações que se desviem do padrão.
      * **Comando:** `cat apps/frontend/next.config.mjs`

  * [ ] **Tarefa 4: 依存関係の監査 (Auditoria de Dependências)**

      * **Ação:** Verifique os arquivos `package.json` (na raiz e em `apps/frontend`) para garantir que as versões do `react`, `react-dom` e `typescript` são compatíveis e não há conflitos.
      * **Verificar:** Procure por múltiplas versões ou dependências que possam estar desatualizadas. O histórico do projeto menciona que a troca de versões de bibliotecas foi uma das tentativas de solução para o problema anterior.
      * **Comando:** `cat package.json && cat apps/frontend/package.json`

  * [ ] **Tarefa 5: 環境変数の検証 (Verificação de Variáveis de Ambiente)**

      * **Ação:** O log da Vercel emitiu um aviso sobre a variável `NPM_CONFIG_PRODUCTION` não estar em `turbo.json`. Embora improvável que cause um erro de JSX, vamos adicioná-la para eliminar todas as variáveis.
      * **Verificar:** Adicione `NPM_CONFIG_PRODUCTION` à lista de `inputs` na task `build` do arquivo `turbo.json` na raiz do projeto, para garantir que o Turborepo esteja ciente dela.
      * **Comando:** `cat turbo.json` (para ver o estado atual)

  * [ ] **Tarefa 6: 再現性のための最小コンポーネント作成 (Criação de Componente Mínimo para Reprodução)**

      * **Ação:** Se os passos anteriores não revelarem a causa, a estratégia final é o isolamento. Crie um `layout.tsx` mínimo para ver se o erro persiste.
      * **Código Mínimo:**
        ```tsx
        import type { Metadata } from "next";
        import "./globals.css";

        export const metadata: Metadata = {
          title: "Test App",
          description: "Testing build",
        };

        export default function RootLayout({
          children,
        }: Readonly<{
          children: React.ReactNode;
        }>) {
          return (
            <html lang="pt-BR">
              <body>{children}</body>
            </html>
          );
        }
        ```
      * **Lógica:** Se este componente mínimo funcionar, o problema está em uma das importações ou componentes usados no `layout.tsx` original (como `Inter` ou `TranslationsProvider`). Se falhar, o problema é definitivamente na configuração do ambiente de build.
