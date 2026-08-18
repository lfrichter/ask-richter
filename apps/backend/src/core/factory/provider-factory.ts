import { EmbeddingProvider } from '../providers/interfaces/embedding-provider.js';
import { LLMProvider } from '../providers/interfaces/llm-provider.js';
import { GeminiLLMProvider } from '../providers/gemini/gemini-llm-provider.js';
import { GeminiEmbeddingProvider } from '../providers/gemini/gemini-embedding-provider.js';
import { OllamaLLMProvider } from '../providers/ollama/ollama-llm-provider.js';
import { OpenRouterLLMProvider } from '../providers/openrouter/openrouter-llm-provider.js';
import { HuggingFaceLLMProvider } from '../providers/huggingface/huggingface-llm-provider.js';
import { ResilientLLMProvider } from '../providers/resilient-llm-provider.js';

export class ProviderFactory {
  /**
   * Obtém uma única instância de LLMProvider sem encadeamento de fallback.
   */
  static getSingleLLMProvider(providerName: string): LLMProvider {
    const activeProvider = providerName.toLowerCase();

    switch (activeProvider) {
      case 'gemini':
        return new GeminiLLMProvider();

      case 'ollama':
        return new OllamaLLMProvider();

      case 'openrouter':
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('[ProviderFactory] Provedor "openrouter" selecionado, mas OPENROUTER_API_KEY não está definida.');
        }
        return new OpenRouterLLMProvider();

      case 'huggingface':
        if (!process.env.HUGGINGFACE_API_KEY) {
          throw new Error('[ProviderFactory] Provedor "huggingface" selecionado, mas HUGGINGFACE_API_KEY não está definida.');
        }
        return new HuggingFaceLLMProvider();

      default:
        throw new Error(`[ProviderFactory] Provedor de LLM não suportado ou inválido: '${activeProvider}'. Provedores válidos: gemini, ollama, openrouter, huggingface.`);
    }
  }

  /**
   * Obtém a instância do LLMProvider configurado, incluindo o encadeamento de fallback
   * se a variável de ambiente AI_FALLBACK_PROVIDERS estiver definida.
   */
  static getLLMProvider(providerName?: string): LLMProvider {
    const primaryName = providerName || process.env.AI_PROVIDER || 'gemini';
    const primaryProvider = ProviderFactory.getSingleLLMProvider(primaryName);

    const fallbacksEnv = process.env.AI_FALLBACK_PROVIDERS || '';
    const fallbackNames = fallbacksEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (fallbackNames.length === 0) {
      return primaryProvider;
    }

    return new ResilientLLMProvider(
      primaryProvider,
      fallbackNames,
      (name) => ProviderFactory.getSingleLLMProvider(name)
    );
  }

  /**
   * Obtém a instância do EmbeddingProvider configurado.
   * Se providerName não for informado, lê process.env.EMBEDDING_PROVIDER (padrão: 'gemini').
   */
  static getEmbeddingProvider(providerName?: string): EmbeddingProvider {
    const activeProvider = (providerName || process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();

    switch (activeProvider) {
      case 'gemini':
        return new GeminiEmbeddingProvider();

      default:
        throw new Error(`[ProviderFactory] Provedor de Embedding não suportado ou inválido: '${activeProvider}'. Provedor válido: gemini.`);
    }
  }
}
