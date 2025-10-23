Gemini, tenho uma segunda otimização de RAG para implementar, com base em uma nova ideia.

**Arquivo-alvo:** `Projects-Consolidated.md`

**Problema:** Os títulos dos projetos (ex: `### 🚀 Canaoaves...`) não contêm a palavra "projeto", o que pode enfraquecer a relevância semântica dos chunks quando o usuário pergunta especificamente sobre "projetos".

**Tarefa:** Faça uma busca e substituição em todo o arquivo `Projects-Consolidated.md` para adicionar o prefixo "Projeto:" a cada título de projeto.

**Instruções:**

1.  Encontre todas as linhas que começam com `### 🚀`.
2.  Substitua-as pelo seguinte formato: `### 🚀 Projeto: [Nome do Projeto]`

**Exemplos:**

* **DE:** `### 🚀 Canaoaves: Plataforma Colaborativa para a Comunidade de Observadores de Aves`
* **PARA:** `### 🚀 Projeto: Canaoaves: Plataforma Colaborativa para a Comunidade de Observadores de Aves`

* **DE:** `### 🚀 EuPizza: Plataforma SaaS de Atendimento por Voz - BRNow`
* **PARA:** `### 🚀 Projeto: EuPizza: Plataforma SaaS de Atendimento por Voz - BRNow`

* **DE:** `### 🚀 Ask Richter: Meu CV Interativo com IA`
* **PARA:** `### 🚀 Projeto: Ask Richter: Meu CV Interativo com IA`

...e assim por diante para todos os projetos no arquivo.
