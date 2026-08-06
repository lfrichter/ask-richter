# ADR-0004: Isolamento de Escopo de Metadados de Tecnologia na Ingestão

- **Status:** Aprovado  
- **Data:** 2026-08-05  
- **Autor:** Antigravity (Chief of Staff / Agente Orquestrador)  
- **Escopo:** Backend (`apps/backend/src/scripts/generate-index.ts`)

---

## 1. Contexto e Problema

No script de chunking semântico `generate-index.ts`, o parser acumulava seções de tecnologias e atribuía o array `projectTechnologies` a todos os chunks gerados durante a iteração de um arquivo.

Isso gerava um **Vazamento de Escopo (Scope Bleed)** em chunks não-projeto (Cursos, Certificações e Formação):
1. Chunks de cursos (ex: "Laravel - Validation and Forms 📕") recebiam `metadata.technologies` contendo dezenas de tecnologias da carreira.
2. A string de conteúdo enriquecido (`enrichedContent`) injetava `[Tecnologias do Projeto: PHP, Laravel, ...]` mesmo em chunks marcados como `[Contexto - Histórico/Formação/Certificações]`.
3. Consequências:
   - **Falsos Positivos no FAISS:** O filtro por metadados de tecnologia em `PROJECT_TECHNOLOGY_SEARCH` trazia cursos em vez de projetos de software reais.
   - **Desorientação do LLM:** Ao ler "Tecnologias do Projeto" na instrução de um curso, o LLM listava cursos como se fossem projetos de software.

---

## 2. Decisão

Decidimos aplicar uma guarda estrita de escopo na montagem de metadados e conteúdo enriquecido:

1. **Guarda de Escopo `isSoftwareProject`:**
   - Definimos a condição booleana `isSoftwareProject = Boolean(projectData.projectName)` no loop principal de construção dos objetos `Document`.
   - `projectTechnologies` só é extraído e populado no array `metadata.technologies` se `isSoftwareProject === true`.

2. **Sanitização de `enrichedContent`:**
   - Chunks de projetos reais (`isSoftwareProject === true`) recebem os prefixos `[Contexto - Projeto: ...]` e `[Tecnologias do Projeto: ...]`.
   - Chunks de Cursos/Certificações/Formação (`isSoftwareProject === false`) recebem unicamente `[Contexto - Histórico/Formação/Certificações]`, omitindo inteiramente qualquer metadado ou marcação referente a projetos de software.

---

## 3. Consequências

### Positivas:
- **Zero Falsos Positivos em Buscas por Tecnologia:** `PROJECT_TECHNOLOGY_SEARCH` retorna estritamente projetos de software desenvolvidos.
- **Clareza para o LLM:** O contexto fornecido ao assistente reflete com fidelidade se a informação trata-se de um projeto de software ou de um curso/certificação.

### Mitigações / Trade-offs:
- Requer execução de `npm run build-index` sempre que novas regras de parser forem modificadas.
