# ADR-0009: Máquina de Estados e Resiliência Operacional do Supabase (Fase 2)

* **Status:** Aceito
* **Data:** 2026-08-26
* **Decisores:** Luis Fernando Richter, Equipe de Arquitetura AskRichter
* **Tags:** `supabase`, `resilience`, `state-machine`, `serverless`, `fase-2`, `adr-0007`

---

## Contexto e Problema

Com a transição da aplicação **Ask Richter** para a arquitetura Serverless V2 na Vercel (ADR-0007), o banco de dados e armazenamento do Supabase operam no plano gratuito, estando sujeitos a congelamento automático por inatividade (*pause/freeze*).

No legado, qualquer exceção de rede (`fetch failed`, timeout ou erro DNS) era erroneamente colapsada em `isPaused: true`. Isso criava falsos positivos na interface, forçando a abertura do modal de descongelamento mesmo quando o Supabase estava online ou quando ocorria uma simples oscilação transitória de conexão.

Além disso, o modal legado utilizava `setInterval` para polling a cada 5 segundos, gerando requisições HTTP sobrepostas no navegador quando a latência de rede aumentava, o que resultava em estouro de timeouts e exceções `AbortError`.

---

## Decisão

Aprovamos e formalizamos a arquitetura de **Resiliência do Supabase (Fase 2)** composta por 5 Milestones (M9 a M13), estabelecendo os seguintes pilares:

### 1. Máquina de Estados e Classificador Centralizado (M10)
Criado o tipo estrito `SupabaseOperationalState` em `status-classifier.ts`:
- `READY`: Supabase online e operante.
- `PAUSED`: Projeto pausado/congelado no Supabase por inatividade (evidência explícita requerida).
- `WAKING`: Projeto em processo de restauração/inicialização de contêineres.
- `UNAVAILABLE`: Falha de rede/DNS/conexão recusada.
- `TIMEOUT`: Excesso de tempo limite de requisição.
- `AUTH_ERROR`: Chave JWT/API inválida ou revogada (HTTP 401/403).
- `UNKNOWN`: Erro não categorizado.

**Regra de Ouro da Não-Inferência**: NENHUM erro genérico de rede (`fetch failed`, `ENOTFOUND`, `ECONNREFUSED`), timeout (`AbortError`) ou falha de autenticação pode ser inferido como `PAUSED`. O estado `PAUSED` exige confirmação inequívoca e explícita do Supabase.

### 2. Recuperação Server-side via Supabase Management API (M11)
- Endpoint `POST /api/supabase/restore` criado no Next.js App Router.
- Credenciais administrativas (`SUPABASE_MANAGEMENT_TOKEN` e `SUPABASE_PROJECT_REF`) mantidas **estritamente no servidor**. Nenhuma secret administrativa é exposta via `NEXT_PUBLIC_*` ou retornada ao navegador.
- O aceite de restauração resulta no estado semântico `WAKING` (não `READY`), mantendo comando e observação desacoplados.

### 3. Trava de Idempotência e Transparência Técnica
- O `restore-service.ts` possui trava de idempotência em memória com janela deslizante de 10 segundos para suprimir rajadas de chamadas repetidas no mesmo processo.
- **Nota de Transparência Técnica Serverless**: A idempotência em memória é uma proteção *best-effort* por instância serverless na Vercel; a própria Supabase Management API e o tratamento de status HTTP 400/409/422 operam como segunda barreira (*source-of-truth*) contra restaurações duplicadas distribuídas.

### 4. UX Resiliente & Polling Sequencial Garantido (M12)
- Refatoração do `supabase-unfreeze-modal.tsx`: substituição completa de `setInterval` por um loop de polling sequencial assíncrono.
- **Garantia Inviolável**: NUNCA existe mais de uma probe `/api/supabase/status` em voo simultaneamente (`MAX_CONCURRENT_PROBES = 1`).
- Recuo progressivo (*progressive backoff*: 2s, 3s, 5s, 8s, 13s, teto 15s) e deadline de restauração de 90s com cancelamento limpo via `AbortController` individual por probe.

---

## Consequências e Resultados (M13 Chaos Matrix)

### Positivas
* **Eliminação de Falsos Positivos**: Erros de rede e timeouts agora exibem mensagens informativas sem forçar o modal de Supabase Pausado.
* **Eliminação do Polling Desordenado**: Fim das requisições sobrepostas e dos acúmulos de `AbortError` no navegador.
* **Segurança Total de Credenciais**: Token de gerenciamento isolado 100% no servidor Vercel.
* **100% de Aprovação Automatizada**: 57 testes unitários passando (15/15 M10, 11/11 M11, 28/28 M13 e 3/3 RAG parity) e `npm run jidoka` validado sem qualquer erro.

### Status da Fase 2
- **Engenharia de Software**: 🟢 *Implementation Complete & Verified*.
- **Gate Operacional de Produção**: Pronto para validação contra o ambiente ativo Vercel + Supabase antes do encerramento do Render legado.
