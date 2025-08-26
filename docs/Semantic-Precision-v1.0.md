---
status: permanent
tags:
  - AI/Gemini25Pro
date: 2025-08-25
project: 
related: 
prompt:
---

### **🗺️ Plano de Ação v1.0: Rumo à Precisão Semântica**

**🎯 Objetivo:** Resolver a "desconexão semântica", permitindo que o chatbot responda a perguntas complexas e cruzadas (ex: "quais projetos usam Laravel?") com precisão.

---

#### **🚀 Fase 1: Enriquecimento de Metadados e Contexto (Fundação)**

Esta fase é a mais crítica, pois cria a base de dados inteligente que as outras fases irão consumir.

* [ ] **Tarefa 1.1: 🧠 Atualizar o Splitter para Injeção de Contexto**
    * **Ação:** Modificar a função `customMarkdownSplitter` no arquivo `generate-index.ts`.
    * **Lógica:**
        * A função deverá primeiro identificar o `project_name` (o título `### 🚀`).
        * Para cada projeto, ela irá iterar pelas seções (`####`) e criar os chunks.
        * **Crucial:** O `project_name` extraído será **injetado como metadado em todos os chunks** pertencentes àquele projeto.
        * (Opcional, v1.1) Extrair e adicionar `technologies: string[]` aos metadados dos chunks da seção "Pilha de Tecnologias".

* [ ] **Tarefa 1.2: 🏗️ Implementar a Orquestração do Contexto (Context Assembly)**
    * **Ação:** Criar a função `assembleStructuredContext` no arquivo `index.ts`.
    * **Lógica:**
        * Esta função receberá a lista de chunks recuperados da busca vetorial.
        * Ela irá agrupar os chunks pelo `metadata.project_name`.
        * O resultado será uma string formatada e muito mais legível para o LLM, com os projetos claramente separados, como no exemplo do Claude.
        * Substituir a lógica atual de `structuredContext` pela chamada a esta nova função.

* [ ] **Tarefa 1.3: 🔄 Re-indexar a Base de Conhecimento**
    * **Ação:** Após implementar a Tarefa 1.1, executar o comando `npm run build-index --workspace=backend`.
    * **Resultado:** O índice FAISS será recriado com os novos metadados enriquecidos, preparando o terreno para a nova lógica de orquestração.

---

#### **🔬 Fase 2: Implementação do Motor de Decomposição de Consultas (Inteligência)**

Esta fase torna o sistema proativo, permitindo que ele "entenda" perguntas complexas e crie um plano para respondê-las.

* [ ] **Tarefa 2.1: 💡 Criar o Motor de Decomposição (`Query Decomposition Engine`)**
    * **Ação:** Implementar a função `decomposeQuery` no arquivo `index.ts`.
    * **Lógica:**
        * Inicialmente, esta função conterá uma lógica simples baseada em regex para identificar padrões de perguntas (ex: "projetos [tecnologia]").
        * Para esses padrões, ela retornará um plano de ação estruturado (`QueryPlan`), como o sugerido.
        * Para perguntas simples, ela retornará um plano de ação padrão (`{ type: 'SIMPLE_SEARCH', ... }`).

* [ ] **Tarefa 2.2: ⚙️ Integrar o Motor ao Fluxo da API**
    * **Ação:** Modificar a rota `/api/chat` no arquivo `index.ts`.
    * **Lógica:**
        * A primeira etapa dentro da rota será chamar `decomposeQuery(question)`.
        * Com base no plano retornado, a API executará os passos definidos (recuperar, filtrar, extrair), em vez de apenas fazer uma busca vetorial simples.

---

#### **🧪 Fase 3: Validação e Benchmark**

Medir o sucesso de forma objetiva.

* [ ] **Tarefa 3.1: 📈 Definir os Casos de Teste (Benchmark)**
    * **Ação:** Criar um conjunto de 5 a 10 perguntas que representem os pontos fracos atuais, que servirão como nosso benchmark para validar as melhorias.
    * **Exemplos:**
        1.  "Me mostre projetos laravel ou React"
        2.  "Me de a lista de projetos laravel"
        3.  "Qual tecnologia ele usa no frontend"
        4.  "Me de a lista de projetos e me fale alguma tecnologia utilizada em cada um"
        5.  "Qual projeto utilizou Testcontainers para testes de integração?"

* [ ] **Tarefa 3.2: 📊 Executar e Medir o Sucesso**
    * **Ação:** Após a conclusão de cada fase (especialmente a Fase 1), executar as perguntas do benchmark e comparar as respostas com os resultados anteriores.
    * **Critério de Sucesso:** A capacidade do chatbot de responder corretamente a pelo menos 80% das perguntas do benchmark.