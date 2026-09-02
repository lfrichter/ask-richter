# ADR-0008: Modernização da Busca Léxica (Naive Bayes -> TF-IDF/BM25)

* **Status:** Aceito
* **Data:** 2026-08-26
* **Decisores:** Luis Fernando Richter, Equipe de Arquitetura AskRichter
* **Tags:** `rag`, `lexical-search`, `tf-idf`, `naive-bayes`, `adr-0007`

---

## Contexto e Problema

No RAG legado da aplicação (**Ask Richter**), o componente de busca por palavras-chave estava nomeado no código como `bm25`. No entanto, a auditoria de causalidade (ADR-0007 / Plan 1C) revelou que a classe subjacente utilizada era a `natural.BayesClassifier()`, um classificador Naive Bayes da biblioteca `natural`.

O Naive Bayes é projetado para classificação de documentos em categorias pré-definidas com base em probabilidades de palavras, enquanto buscadores léxicos em sistemas RAG (*Information Retrieval*) utilizam TF-IDF ou Okapi BM25 para calcular a frequência e raridade de termos específicos da consulta em tempo de busca.

Ao migrar a aplicação para um ambiente 100% Serverless na Vercel (ADR-0007), a biblioteca `natural` trazia dependências pesadas C++/WebWorker e warnings de empacotamento no Webpack.

---

## Decisão

Decidimos **formalizar e aprovar a substituição do Naive Bayes legado por um pontuador `SimpleTfIdf` em TypeScript puro**, isolando a evolução comportamental em um ADR próprio (ADR-0008), mantendo o ADR-0007 focado estritamente na migração de infraestrutura (Render/FAISS $\rightarrow$ Vercel/TS Cosine).

1. **Retriever Léxico em TS Puro (`SimpleTfIdf`)**:
   - Implementação sem dependências externas C++ ou WebWorkers.
   - Cálculo de Frequência de Termo ($TF$) e Frequência Inversa nos Documentos ($IDF$).
   - Tokenização e normalização Unicode NFD sem diacríticos (acentos).

2. **Independência Arquitetural**:
   - Não reproduzir propositalmente artefatos mal nomeados do legado (`natural.BayesClassifier`).
   - Manter a fusão por posições **RRF ($k=60$)**, o **Filtro de Diversidade por Projeto** e a **Orçamentação de Tokens (2800 max)** intactos.

---

## Consequências

### Positivas
* **Desempenho Léxico Focado em IR**: O TF-IDF pontua termos raros e palavras-chave específicas da busca com maior precisão do que probabilidades de Naive Bayes.
* **Compatibilidade Serverless Nível Zero Warning**: Nenhuma dependência nativa C++ ou aviso de empacotamento no Next.js/Vercel.
* **Separabilidade de Auditabilidade**: O ADR-0007 comprova 100.0% de paridade vetorial sem ser penalizado pela divergência proposital no motor léxico formalizada pelo ADR-0008.

### Negativas / Riscos Mitigados
* **Divergência de Ranking Léxico**: O Top-1 da busca léxica difere do legado. **Mitigação**: O benchmark end-to-end de 3 camadas comprovou que o contexto final entregue ao LLM e a factualidade das respostas geradas permanecem 100% corretos, grounded e de altíssima qualidade.
