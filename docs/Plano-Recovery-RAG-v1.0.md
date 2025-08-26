---
status: permanent
tags:
  - AI/Gemini25Pro
date: 2025-08-20
project: 
related: 
prompt: "[[Otimização de Recuperação RAG v0.9]] A análise do Claude é extremamente completa e nos oferece um leque de estratégias de nível profissional. É o mapa perfeito para transformarmos o AskRichter de um chatbot funcional em uma ferramenta de IA de alta precisão.Concordo 100% com a abordagem priorizada. Vamos traduzir essa estratégia em um plano de ação claro e executá-lo passo a passo, começando pelas mudanças de maior impacto."
---
### Plano de Ação: Rumo à Recuperação Inteligente

Seguiremos o plano de implementação em fases, garantindo que cada melhoria seja validada antes de passarmos para a próxima.

---

### 🚀 Fase 1: Implementação da Busca Híbrida Simples (Solução Imediata)

**🎯 Objetivo:** Resolver de forma definitiva o problema de listar todos os projetos, implementando a estratégia de **Documentos Sintéticos** combinada com uma **Classificação de Intenção** simples.

#### ✅ **Tarefa 1.1: Criar o Documento Sintético de Projetos**
Vamos ensinar nosso script de indexação a criar um "índice remissivo" automático com o nome de todos os projetos.

- [x] **Ação:** Implementar a função `createProjectListDocument` no script de indexação.
- [x] **Arquivo a ser Modificado:** `apps/backend/src/scripts/generate-index.ts`
- [x] **Lógica:** A função lerá todos os arquivos, extrairá os nomes dos projetos (linhas com `### 🚀`) e criará um novo `Document` especial contendo apenas a lista de nomes. Este documento será vetorizado junto com os outros.

#### ✅ **Tarefa 1.2: Implementar o Roteador de Buscas Inteligente**
Vamos ensinar nossa API a entender o *tipo* de pergunta que o usuário está fazendo.

- [x] **Ação:** Implementar a lógica de `detectListQuery` e `smartSearch` na nossa API.
- [x] **Arquivo a ser Modificado:** `apps/backend/src/index.ts`
- [x] **Lógica:** Antes de fazer a busca vetorial, uma função simples verificará se a pergunta do usuário parece ser um pedido de listagem ("liste todos", "quais os projetos", etc.).
    - [x] **Se for uma listagem:** A busca será direcionada para encontrar o nosso novo documento sintético.
    - [x] **Se for outra pergunta:** A busca continuará normalmente, procurando os detalhes do projeto.

---

### 🔍 Fase 2: Otimização da Relevância (Avançado)

**🎯 Objetivo:** Melhorar a precisão para perguntas mais complexas ou ambíguas, que não foram resolvidas na Fase 1.

#### ✅ **Tarefa 2.1: Expandir a Consulta (Query Expansion)**
Vamos enriquecer a pergunta do usuário com sinônimos para aumentar as chances de encontrar o conteúdo correto.

- [x] **Ação:** Implementar a função `expandQuery`.
- [x] **Arquivo a ser Modificado:** `apps/backend/src/index.ts`
- [x] **Lógica:** Se um usuário perguntar sobre "tecnologias", a busca também incluirá termos como "stack", "framework", "biblioteca", etc.

#### ✅ **Tarefa 2.2: Implementar o Pipeline Multi-Etapas**
- [x] Vamos formalizar o nosso "roteador" da Fase 1 em um sistema mais robusto que pode classificar a intenção do usuário em múltiplas categorias (listar projetos, detalhes de um projeto, perguntas sobre tecnologia) e adaptar a estratégia de busca para cada uma.

---

### 🔬 Fase 3: Busca Híbrida Real (Máxima Precisão)

**🎯 Objetivo:** Alcançar o estado da arte em recuperação, combinando a busca por significado (vetorial) com a busca por palavras-chave (BM25).

#### ✅ **Tarefa 3.1: Integrar a Busca por Palavras-Chave (BM25)**
Esta é a otimização mais avançada, a ser implementada apenas se necessário.

- [x] **Ação:** Adicionar a biblioteca `natural` ao projeto e implementar a classe `HybridRetriever`.
- [x] **Lógica:** Os resultados da busca vetorial (semântica) e da busca BM25 (palavras-chave) serão combinados e re-ranqueados para produzir a lista final de chunks mais relevantes.

---

### Próximo Passo Imediato

Vamos começar agora mesmo com a **Fase 1**. Vou preparar e lhe entregar o código modificado para os arquivos `generate-index.ts` e `index.ts` para implementarmos as **Tarefas 1.1 e 1.2**.

Esta primeira fase tem uma chance altíssima (como o Claude disse, 99%) de resolver o problema principal que estamos enfrentando.
