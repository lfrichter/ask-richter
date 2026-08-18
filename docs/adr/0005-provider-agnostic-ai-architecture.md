# ADR-0005: Arquitetura de IA Provider-Agnostic e Migração de Embeddings para Gemini

- **Status:** Aprovado  
- **Data:** 2026-08-18  
- **Autor:** Antigravity (Chief of Staff / Agente Orquestrador)  
- **Escopo:** Backend (`apps/backend/src/core/providers/`, `apps/backend/src/core/factory/`, `apps/backend/src/index.ts`, `generate-index.ts`)

---

## 1. Contexto e Problema

Anteriormente, a aplicação AskRichter dependia diretamente da OpenAI API para geração de embeddings vetoriais (`text-embedding-3-small`, 1536 dimensões) e ramificava chamadas de LLM através de condições `if (provider === ...)` espalhadas pelo código do backend.

Essa abordagem apresentava limitações:
1. **Acoplamento a Vendor:** Dependência financeira e operacional da OpenAI para o runtime da aplicação.
2. **Falta de Abstração Centralizada:** O roteamento de LLMs entre Ollama, OpenRouter e Hugging Face continha lógicas condicionais duplicadas e fallbacks implícitos.
3. **Gerenciamento de Compatibilidade de Índices:** Inexistência de verificação estrita de metadados entre o modelo de embedding ativo e a dimensão do índice vetorial FAISS carregado.

---

## 2. Decisão

Decidimos refatorar a camada de inteligência artificial adotando uma **Arquitetura Provider-Agnostic** estruturada via Design Pattern **Factory**:

1. **Abstração por Interfaces (`LLMProvider` e `EmbeddingProvider`):**
   - Criamos contratos explícitos em `apps/backend/src/core/providers/interfaces/`.
   - Implementamos provedores concretos: `GeminiLLMProvider` (`gemini-3.6-flash`), `GeminiEmbeddingProvider` (`gemini-embedding-2`, 768 dimensões), `OllamaLLMProvider` (`mistral:7b`), `OpenRouterLLMProvider` e `HuggingFaceLLMProvider`.

2. **Fábrica Centralizada (`ProviderFactory`):**
   - Centralizamos a criação e validação condicional de variáveis de ambiente (`AI_PROVIDER` e `EMBEDDING_PROVIDER`).
   - Mantivemos a independência total entre a seleção do LLM e do Embedding Provider.

3. **Validação Fail-Fast do Manifest FAISS (`manifest.json`):**
   - Atualizamos o `manifest.json` para armazenar a identidade completa do embedding (`provider`, `model`, `dimension`, `schemaVersion: 1`).
   - No startup em `index.ts`, o servidor valida a compatibilidade entre o índice persistido e o `EmbeddingProvider` ativo. Se houver divergência de dimensão ou provedor, a inicialização falha imediatamente (`Fail-Fast`) informando a necessidade de reconstrução via `npm run build-index`.

4. **Desativação do Runtime OpenAI:**
   - A dependência direta da OpenAI no runtime foi desativada, migrando o padrão de produção para Gemini (`gemini-3.6-flash` e `gemini-embedding-2`).

---

## 3. Consequências

### Positivas:
- **Zero Dependência da OpenAI no Runtime:** Redução de custos operacionais utilizando os Free Tiers do Google Gemini API.
- **Flexibilidade e Testabilidade:** Suporte transparente a Ollama (desenvolvimento local), OpenRouter e Hugging Face sem alterar a pipeline de RAG.
- **Segurança de Índice FAISS:** Garantia estrita de que o backend nunca carregará silenciosamente um índice vetorial gerado com embeddings de dimensões incompatíveis.

### Trade-offs:
- **Necessidade de Reindexação:** A mudança da dimensão de embedding de 1536 (OpenAI) para 768 (Gemini) exige a reconstrução do índice FAISS local e sincronização com Supabase Storage.
