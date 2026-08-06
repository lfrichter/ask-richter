# ADR-0003: Roteamento de Intenções por Tecnologia e Extração Multi-Tecnologia

- **Status:** Aprovado  
- **Data:** 2026-08-05  
- **Autor:** Antigravity (Chief of Staff / Agente Orquestrador)  
- **Escopo:** Backend (`apps/backend/src/index.ts`)

---

## 1. Contexto e Problema

O classificador de intenções do backend (`decomposeQuery`) utiliza regras para identificar o plano de execução apropriado (`LIST_PROJECTS`, `PROJECT_TECHNOLOGY_SEARCH`, `SIMPLE_SEARCH`).

Constatou-se uma falha de priorização no roteador:
1. Expressões genéricas de listagem (como "todos os projetos") eram avaliadas no início da função.
2. Quando um usuário perguntava "me mostre todos os projetos php e laravel", o roteador disparava o plano `LIST_PROJECTS` (com Top-K=1) devido ao trecho "todos os projetos", ignorando as tecnologias especificadas ("php" e "laravel").
3. Adicionalmente, a extração de tecnologias interrompia a busca na primeira correspondência (`break`), impossibilitando buscas por stacks compostas ou múltiplas tecnologias simultâneas.

---

## 2. Decisão

Decidimos reestruturar o roteador de intenções e a busca por metadados de tecnologia:

1. **Precedência da Busca por Tecnologia:**
   - A extração de tecnologias na função `decomposeQuery` passou a ser executada **antes** da checagem de palavras-chave genéricas de listagem.
   - Se uma ou mais tecnologias forem identificadas na pergunta, o plano retornado será obrigatoriamente `PROJECT_TECHNOLOGY_SEARCH`.

2. **Extração Multi-Tecnologia:**
   - O roteador agora analisa toda a query e acumula uma lista de tecnologias conhecidas (`technologies: string[]`), como `['PHP', 'Laravel']`.

3. **Filtragem por Metadados Expandida:**
   - A função `filterFunction` dentro do case `PROJECT_TECHNOLOGY_SEARCH` de `smartSearch` avalia se os metadados do chunk correspondem a qualquer uma das tecnologias solicitadas, retornando até `Top-K = 6` chunks mais relevantes respeitando o orçamento de tokens.

---

## 3. Consequências

### Positivas:
- **Resolução do Roteamento "Míope":** Perguntas específicas sobre tecnologias não são mais aprisionadas no balde genérico `LIST_PROJECTS`.
- **Suporte a Queries Complexas:** Permite realizar pesquisas ricas por múltiplas tecnologias (ex: PHP + Laravel, Vue + TypeScript).
- **Recuperação Adequada de Contexto:** Ao usar `PROJECT_TECHNOLOGY_SEARCH`, o sistema aplica o orçamento de Top-K=6, trazendo o histórico detalhado dos projetos correspondentes.

### Mitigações / Trade-offs:
- Exige manter a lista `knownTechnologies` alinhada com as tecnologias utilizadas nos projetos documentados.
