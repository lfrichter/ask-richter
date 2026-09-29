# ADR-0010 — Tri-Retrieval Engine & Sanity Content Lake

**Status:** Accepted  
**Data:** 29 de Setembro de 2026  
**Milestone:** M4.1-B Consolidation  
**Supersedes:** ADRs 0005/0006 only where explicitly applicable to retrieval orchestration  

---

## 1. Contexto

O Ask Richter originalmente utilizava uma base de conhecimento predominantemente baseada em documentos Markdown e recuperação vetorial em memória através do `TSVectorStore`.

Essa arquitetura demonstrou capacidade de operação Serverless e permanece funcional como mecanismo de fallback, porém não representa adequadamente relações estruturadas entre entidades de conhecimento, como:

- projetos e tecnologias;
- experiências e projetos;
- decisões arquiteturais e projetos;
- achievements e experiências;
- relações secundárias entre entidades do conhecimento profissional.

Além disso, a evolução do sistema introduziu a necessidade de separar três classes distintas de recuperação:

1. consultas factuais e estruturadas;
2. consultas relacionais que exigem múltiplos hops;
3. consultas semânticas de formato livre.

Era necessário introduzir uma fonte de conhecimento estruturada sem comprometer a resiliência previamente estabelecida do RAG Serverless V2.

---

## 2. Decisão

O Ask Richter adota o **Sanity Content Lake como fonte primária e canônica de conhecimento estruturado** e passa a utilizar uma arquitetura de **Tri-Retrieval Engine**, composta por três estratégias especializadas de recuperação:

### 2.1 M2 — Structured Retrieval

O mecanismo estruturado utiliza consultas GROQ declarativas e tipadas para responder consultas factuais e determinísticas.

Características:

- consultas pré-definidas;
- ausência de interpolação arbitrária de strings;
- classificação explícita de intenção;
- timeout controlado;
- formatação estruturada do contexto;
- token budget;
- estados explícitos de sucesso, fallback, ausência de evidência e erro.

---

### 2.2 M4 — Agentic Multi-Hop Retrieval

O mecanismo agêntico é utilizado quando a política de elegibilidade determina que a consulta exige exploração relacional entre entidades.

O `KnowledgeGraphRetriever` executa uma travessia determinística e estritamente read-only do grafo de conhecimento.

A execução é limitada por invariantes explícitos:

- `MAX_TOOL_HOPS = 2`;
- `MAX_TOOL_CALLS = 4`;
- `GLOBAL_TIMEOUT_MS = 4000`;
- detecção de ciclos;
- zero mutation;
- ferramentas exclusivamente de leitura;
- proveniência dos resultados.

O M4 não representa uma etapa obrigatória após o M2. Sua seleção ocorre através da política de elegibilidade agêntica.

---

### 2.3 M3 — Semantic Retrieval

O mecanismo semântico atende consultas abertas/free-form utilizando os Dataset Embeddings do Sanity Content Lake.

A recuperação combina, conforme a estratégia selecionada:

- similaridade semântica;
- relevância lexical;
- score;
- deduplicação de entidades;
- metadados estruturados;
- token budget estrito.

O objetivo é recuperar contexto semanticamente relevante sem exigir que a consulta corresponda a uma intenção estruturada previamente conhecida.

---

### 2.4 Fallback — TSVectorStore

O `TSVectorStore` permanece temporariamente como mecanismo de continuidade operacional.

Ele não é considerado a fonte primária de conhecimento.

Seu papel é fornecer degradação controlada quando uma engine Sanity não puder concluir a recuperação devido a:

- timeout;
- indisponibilidade;
- erro de infraestrutura;
- falha de comunicação;
- condição explicitamente classificada como recuperável.

A ausência legítima de evidência não deve ser confundida com indisponibilidade da engine.

---

## 3. Modelo de Roteamento

A arquitetura não implementa uma cascata linear obrigatória em que toda consulta percorre M2 → M4 → M3.

O roteamento é **seletivo e determinístico**, baseado na classificação de intenção e na política de elegibilidade:

```text
                         User Query
                              │
                              ▼
                  Intent / Eligibility Layer
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Structured         Agentic          Free-form
            M2                M4                M3
        GROQ Retrieval    Multi-Hop Graph   Semantic Search
             │                │                │
             └────────────────┼────────────────┘
                              │
                  recoverable retrieval failure
                              │
                              ▼
                       TSVectorStore
                          Fallback
```

A seleção de uma engine não implica que as demais sejam executadas sequencialmente.

---

## 4. Invariantes Arquiteturais

### 4.1 Factual Abstention

O sistema deve distinguir:

```text
NO EVIDENCE
```

de:

```text
RETRIEVAL ERROR
```

Quando uma engine executa corretamente, mas não encontra evidência factual suficiente, o sistema deve preservar o estado de ausência de evidência e permitir a abstenção explícita do LLM.

Falhas técnicas recuperáveis podem acionar o fallback definido pela orquestração.

Essa distinção impede que indisponibilidade técnica seja mascarada como ausência factual ou que ausência factual seja transformada artificialmente em evidência.

---

### 4.2 Zero Mutation

A recuperação agêntica é estritamente read-only.

O agente não possui ferramentas para:

- criar entidades;
- modificar documentos;
- excluir documentos;
- alterar schemas;
- modificar configurações do Content Lake.

---

### 4.3 Bounded Agentic Execution

Toda execução M4 deve permanecer dentro dos limites estabelecidos de:

- número de hops;
- número de tool calls;
- timeout global;
- detecção de ciclos.

---

### 4.4 Context Budget

As engines devem respeitar o orçamento máximo de contexto definido pelo sistema:

```text
CONTEXT_BUDGET_TOKENS = 2800
```

A recuperação não pode expandir indefinidamente o contexto fornecido ao LLM.

---

### 4.5 Proveniência

Os resultados de recuperação devem preservar informação suficiente para identificar:

- engine utilizada;
- intenção;
- latência;
- quantidade de resultados;
- estimativa de tokens;
- status;
- ocorrência de fallback.

---

### 4.6 Preservação do RAG Legado

A introdução do Sanity não deve quebrar o comportamento previamente validado do RAG Serverless V2.

O `TSVectorStore` permanece disponível durante a fase de coexistência controlada.

---

## 5. Governança da Fonte de Conhecimento

A arquitetura passa a estabelecer a seguinte hierarquia:

```text
Sanity Content Lake
        │
        │ Primary / Canonical
        ▼
Tri-Retrieval Engine
        │
        │ Resilience fallback
        ▼
TSVectorStore
        │
        └── Legacy / Transitional
```

O Sanity Content Lake é a fonte canônica para o conhecimento estruturado migrado durante M1/M1.5.

O `TSVectorStore` não deve receber automaticamente o status de fonte de verdade concorrente apenas por permanecer operacional como fallback.

---

## 6. Legado

Os componentes históricos associados à arquitetura baseada em Markdown/FAISS/LangChain permanecem no repositório quando necessários para:

- documentação histórica;
- reprodução de experimentos;
- operação offline;
- referência arquitetural.

Esses componentes são classificados como **legacy/offline** e não constituem o caminho primário de recuperação em produção.

---

## 7. Consequências Positivas

A decisão proporciona:

- conhecimento estruturado e semanticamente modelado;
- recuperação relacional multi-hop;
- busca semântica nativa no Content Lake;
- separação explícita entre classes de consulta;
- factual abstention;
- fallback resiliente;
- preservação do comportamento Serverless anteriormente validado;
- observabilidade da engine utilizada;
- possibilidade de evolução independente das estratégias de recuperação.

---

## 8. Trade-offs e Dívida Transitória

A arquitetura introduz complexidade adicional decorrente da coexistência de múltiplas engines.

Durante a fase de transição existem:

- duas camadas de armazenamento de conhecimento;
- maior complexidade de observabilidade;
- necessidade de manter o `TSVectorStore` atualizado enquanto ele permanecer como fallback;
- maior superfície de testes;
- necessidade de definir futuramente os critérios para eventual remoção do fallback legado.

A remoção do `TSVectorStore` não faz parte deste ADR.

---

## 9. Evidências do Fechamento M4.1-B

O estado arquitetural foi validado no fechamento do M4.1-B com:

| Evidência                 |          Resultado |
| ------------------------- | -----------------: |
| Testes automatizados      | **168 / 168 PASS** |
| Frontend                  |       **149 PASS** |
| Backend                   |        **19 PASS** |
| Jidoka / Turborepo        |   **14 / 14 PASS** |
| HTTP Smoke Tests          |     **5 / 5 PASS** |
| Áreas protegidas com diff |              **0** |
| Working Tree              |          **Clean** |
| Commit de consolidação    |          `ee5a85b` |

---

## 10. Status

**ACCEPTED**

Esta decisão formaliza a arquitetura de recuperação adotada até o fechamento do M4.1-B.

Qualquer alteração futura na responsabilidade do Sanity Content Lake, no roteamento entre M2/M4/M3 ou na função do `TSVectorStore` deverá ser registrada através de nova decisão arquitetural ou atualização formal desta ADR.

**Próximo marco:** documentação/snapshot pós-M4.1 e preparação controlada para merge.
