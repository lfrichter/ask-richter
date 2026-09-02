# META_SPEC — ask-richter (pt-BR)

> 🇧🇷 **Tradução de Leitura.**  
> A versão canônica e autoritativa deste documento é: `../../META_SPEC.md`.  
> Em caso de divergência, a versão canônica em inglês prevalece.

**Versão:** 2.1.0  
**Status:** Ativo  
**Última Atualização:** 2026-09-02  
**Responsável:** Luis Fernando Richter  

---

# 1. Identidade Do Projeto

## 1.1 Nome
`ask-richter`

## 1.2 Descrição Em Uma Frase
> Um chatbot de portfólio inteligente e interativo que transforma a trajetória profissional, projetos de engenharia e liderança técnica de Luiz F. Richter em um assistente conversacional RAG autoritativo.

## 1.3 Problema
Currículos tradicionais e sites de portfólio estáticos oferecem experiências de leitura unidimensionais e passivas. Recrutadores técnicos, gerentes de engenharia e lideranças executivas necessitam de respostas rápidas, precisas e verificáveis para dúvidas específicas — como liderança arquitetural, stacks tecnológicas específicas (ex: PHP/Laravel, Node.js/TypeScript, Python, orquestração de LLMs) e impacto real de projetos — sem navegar por documentos estáticos densos.

## 1.4 Usuários-Alvo
* **Recrutadores Técnicos & Headhunters:** Buscando níveis de senioridade específicos, competências verificadas e trajetórias de carreira.
* **Gerentes de Engenharia & VPs de Engenharia:** Avaliando maturidade arquitetural, frameworks de decisão, escopo de liderança e resolução de problemas reais.
* **Engenheiros de Software Pares & Colaboradores:** Explorando interesses técnicos compartilhados, projetos open-source e metodologias de engenharia.

---

# 2. Visão

## 2.1 Declaração De Visão
Entregar um portfólio interativo padrão ouro, com zero alucinações, impulsionado por arquitetura Serverless RAG moderna que demonstra excelência em engenharia de software, resiliência operacional robusta e governança automatizada sob o AI Engineering Framework v2.1.

## 2.2 Impacto Mensurável De Negócio
* **Zero Alucinações:** 100% das afirmações sobre histórico de carreira, projetos e certificações são estritamente fundamentadas na base de conhecimento verificada.
* **Acesso Conversacional Instantâneo:** Tempo de resposta mediano entre 1s e 2s para perguntas em linguagem natural em Inglês, Português e Espanhol.
* **Custo Zero de Infraestrutura:** Arquitetura Serverless V2 eliminando custos de máquinas virtuais 24/7 e latências de spin-down.

---

# 3. Escopo

## 3.1 Dentro Do Escopo (In Scope)
* **RAG Conversacional Multilíngue (M15):** Geração de respostas em linguagem natural estritamente no idioma da pergunta do usuário (Inglês, Português, Espanhol), utilizando dados factuais recuperados.
* **Busca Vetorial em TypeScript Puro (`TSVectorStore`):** Similaridade de cosseno em memória sobre embeddings Gemini de 768 dimensões, eliminando dependências nativas em C++ (`faiss-node`).
* **Busca Léxica em TypeScript Puro (`SimpleTfIdf`):** Correspondência rápida de palavras-chave eliminando o Naive Bayes legado e dependências pesadas.
* **Motor de Resiliência e Descongelamento Operacional (ADR-0009):** Detecção automática de inatividade do Supabase, classificação estrita em 7 estados e restauração server-side via Supabase Management API.
* **Verificação Unificada de Qualidade (Jidoka):** Verificação paralela de tipagem, linting e build via `npm run jidoka` em todos os workspaces do Turborepo.
* **Toolkit Offline de Ingestão de Conhecimento:** Scripts CLI em `apps/backend/src/scripts/` para chunking semântico de Markdown, geração de embeddings, exportação de vetores e sincronização com Supabase Storage.

## 3.2 Fora Do Escopo (Out of Scope)
* **Capacidades Genéricas de Chatbot Público:** Responder perguntas de conhecimento geral não relacionadas à carreira ou projetos de Luis Fernando Richter.
* **Autenticação Persistente de Usuários:** Exigir login ou coletar dados pessoais de recrutadores.
* **Reindexação Vetorial em Tempo Real em Produção:** A reindexação é um fluxo de engenharia estritamente offline; instâncias de produção executam consultas read-only sobre JSONs de vetores estáticos.
* **Acesso do Cliente à Supabase Management API:** Navegadores web NUNCA devem portar ou utilizar tokens administrativos (`SUPABASE_MANAGEMENT_TOKEN`).

---

# 4. Princípios Arquiteturais Invioláveis

1. **Serverless V2 Nativo Primeiro (ADR-0007):** Toda execução de produção ocorre em rotas serverless do Next.js 15 App Router na Vercel.
2. **Zero Render Fallback em Produção:** Em produção, todas as requisições DEVEM usar endpoints relativos nativos (`/api/*`). O Render é estritamente legado.
3. **Regra de Ouro da Não-Inferência (ADR-0009):** Nunca classificar exceções genéricas de rede, timeout ou DNS como `PAUSED`. A evidência deve ser explícita.
4. **Motor em TypeScript Puro:** Os algoritmos de recuperação RAG (`TSVectorStore`, `SimpleTfIdf`) DEVEM permanecer em TypeScript puro sem bindings binários C++.
5. **Camada de IA Provider-Agnostic (ADR-0005 & ADR-0006):** As interações com IA são mediadas por interfaces abstratas (`LLMProvider`, `EmbeddingProvider`) com criação centralizada via Factory.
6. **Isolamento de Contexto WSCI (World-Scope Context Isolation):** Manter separação estrita de escopos entre `frontend`, `backend` e `infra`.
7. **Disciplina de Qualidade Jidoka:** Nenhum código é consolidado sem passar pela suíte completa de testes e pelo comando `npm run jidoka`.

---

# 5. Restrições Tecnológicas

* **Runtime / Linguagem:** Node.js `>= 22.0.0`, TypeScript `5.8.3`
* **Gerenciador de Pacotes & Monorepo:** `npm@11.4.2` workspaces, Turborepo `2.10.8`
* **Frameworks:** Next.js `15.5.22` (App Router, React 19), Tailwind CSS `3.4.17`, Framer Motion `12.23.12`
* **Banco de Dados & Storage:** Supabase PostgreSQL, Supabase Storage (bucket `faiss-index`), Supabase Management API v1
* **Infraestrutura:** Vercel (Produção primária Serverless)
* **Provedores de IA:** Google GenAI API (`@google/genai` 2.17.1, `gemini-3.6-flash`, `gemini-embedding-2`); Fallbacks: OpenRouter, Hugging Face, Ollama local

---

# 6. Critérios De Conclusão (Definition of Done)

* [ ] Requisitos e critérios de aceite verificados
* [ ] Testes relevantes executados e passando (`npm test --workspace=frontend`, `npm test --workspace=backend`)
* [ ] Validação Jidoka / Andon Cord bem-sucedida (`npm run jidoka`) com exit code 0
* [ ] Sem regressões não explicadas
* [ ] Documentação sincronizada (Canônica em inglês `META_SPEC.md` e localizada `docs/pt-br/META_SPEC.md`)
