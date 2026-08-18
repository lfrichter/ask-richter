import { LLMProvider } from './interfaces/llm-provider.js';

export class ResilientLLMProvider implements LLMProvider {
  readonly name: string;
  private primaryProvider: LLMProvider;
  private fallbackProviderNames: string[];
  private getProviderByName: (name: string) => LLMProvider;

  constructor(
    primaryProvider: LLMProvider,
    fallbackProviderNames: string[] = [],
    getProviderByName: (name: string) => LLMProvider
  ) {
    this.primaryProvider = primaryProvider;
    this.name = primaryProvider.name;
    this.fallbackProviderNames = fallbackProviderNames.filter(
      (n) => n.toLowerCase() !== primaryProvider.name.toLowerCase()
    );
    this.getProviderByName = getProviderByName;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    console.log(`[AI] Primary provider: ${this.primaryProvider.name}`);
    try {
      return await this.primaryProvider.generate(systemPrompt, userMessage);
    } catch (primaryErr: any) {
      const primaryMessage = primaryErr?.message || String(primaryErr);
      console.warn(
        `[AI] Primary provider ${this.primaryProvider.name} failed: ${primaryMessage}`
      );

      if (this.fallbackProviderNames.length === 0) {
        throw primaryErr;
      }

      for (const fallbackName of this.fallbackProviderNames) {
        console.log(`[AI] Falling back to provider: ${fallbackName}`);
        try {
          const fallbackProvider = this.getProviderByName(fallbackName);
          const result = await fallbackProvider.generate(systemPrompt, userMessage);
          console.log(`[AI] Provider ${fallbackName} succeeded.`);
          return result;
        } catch (fallbackErr: any) {
          const fallbackMessage = fallbackErr?.message || String(fallbackErr);
          console.warn(
            `[AI] Fallback provider ${fallbackName} failed: ${fallbackMessage}`
          );
        }
      }

      const allFailedErr = new Error(
        'Todos os provedores de IA configurados falharam temporariamente. Por favor, tente novamente.'
      );
      (allFailedErr as any).status = 503;
      (allFailedErr as any).code = 'SERVICE_UNAVAILABLE';
      throw allFailedErr;
    }
  }
}
