# M5 Post-Fix HTTP Smoke

## Baseline

- **Branch**: `main`
- **Commit**: `835a19bd7ed7b1258e7979bfc9834e4831374a0f`
- **Working Tree**:
  - `apps/frontend/src/lib/rag/hybrid-retriever.ts` (modified)
  - `apps/frontend/src/lib/server/sanity/chat-integration.test.ts` (modified)
  - `apps/frontend/src/lib/server/sanity/queries.ts` (modified)

## Automated Validation

- **`npm test`**: 150 passed, 0 failed, 16 suites (100% PASS)
- **`npm run check-types`**: 0 errors across all 8 packages (100% PASS)

## HTTP Tests

| ID | Query | Expected Engine / Intent | Actual Engine / Intent | HTTP | Matched Count | Fallback | Latency (ms) | Result |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Main** | `Quais são os projetos em que o Richter atuou?` | `M2_STRUCTURED` / `LIST_PROJECTS` | `M2_STRUCTURED` / `LIST_PROJECTS` | 200 | 18 | `false` | 601 ms | **PASS** |
| **R1** | `Quais são os projetos em que o Richter atuou?` | `M2_STRUCTURED` / `LIST_PROJECTS` | `M2_STRUCTURED` / `LIST_PROJECTS` | 200 | 18 | `false` | 601 ms | **PASS** |
| **R2** | `Em quais projetos o Richter atuou?` | `M2_STRUCTURED` / `LIST_PROJECTS` | `M2_STRUCTURED` / `LIST_PROJECTS` | 200 | 18 | `false` | 361 ms | **PASS** |
| **R3** | `Quais projetos usam Laravel?` | `M2_STRUCTURED` / `PROJECT_BY_TECH` | `M2_STRUCTURED` / `PROJECT_BY_TECH` | 200 | 8 | `false` | 393 ms | **PASS** |
| **R4** | `Quais projetos usam React?` | `M2_STRUCTURED` / `PROJECT_BY_TECH` | `M2_STRUCTURED` / `PROJECT_BY_TECH` | 200 | 4 | `true` (fallback_success) | 706 ms | **PASS** |

## Main Incident Validation

- **Incidente Original**: A pergunta `"Quais são os projetos em que o Richter atuou?"` falhava no classificador de substrings do M2, caindo indevidamente no motor semântico M3 (Free-form), que retornava apenas 1 projeto (`Ask Richter`).
- **Validação Pós-Fix**: No teste HTTP real em `/api/chat`, a requisição foi classificada deterministicamente como `engine=M2_STRUCTURED` com `intent=LIST_PROJECTS`. O Sanity Content Lake retornou todos os **18 projetos cadastrados** (`matched_count=18`, `estimated_tokens=1496`, `fallback=false`).
- **Status do Incidente**: **RESOLVIDO**.

## Cardinality

Para a pergunta principal `"Quais são os projetos em que o Richter atuou?"`:

- **`retrieved_count`**: 18 (catálogo completo retornado pelo Sanity GROQ via M2)
- **`declared_total`**: `NOT_DECLARED`
- **`listed_count`**: 7 projetos apresentados na resposta inicial respeitando estritamente a Regra de Paginação e Carga Cognitiva do System Prompt (`"Se o contexto retornar uma lista longa (mais de 7 projetos), NUNCA liste todos de uma vez. Escolha e liste apenas os 7 mais relevantes. Ao final da lista, adicione OBRIGATORIAMENTE uma frase no idioma da pergunta convidando o usuário a explorar o restante."`).

Projetos listados na resposta:
1. `Ask Richter - AI Career Agent`
2. `ASO Healthcare Management System (ASO)`
3. `Autonomous SAP Fiori/GUI Automation PoC (Accenture)`
4. `BrNow Voice Support SaaS & AI Platform`
5. `FTD Corporate Portal, E-commerce & Intranet (Editora FTD)`
6. `Fanoty Football App Migration & OPTA API (Evoke Mobile)`
7. `Financial Analysis & Stock Intelligence AI Agent`

Frase de fechamento para paginação incluída:
> *"Se quiser explorar o restante dos projetos, sinta-se à vontade para perguntar!"*

## Conclusion

**Classificação**: **`GREEN`**

Todos os critérios objetivos foram satisfeitos:
1. Routing correto para M2 Structured (`LIST_PROJECTS` e `PROJECT_BY_TECH`).
2. Retrieval estruturado completo do Sanity Content Lake (`matched_count=18`, `fallback=false`).
3. Resposta final multi-projeto contextualizada e formatada.
4. HTTP 200 em todas as execuções.
5. Zero regressões no suite automatizado (150/150 testes passando).
