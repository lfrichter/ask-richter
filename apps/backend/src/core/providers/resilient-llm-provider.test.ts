import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LLMProvider } from './interfaces/llm-provider.js';
import { ResilientLLMProvider } from './resilient-llm-provider.js';
import { GeminiLLMProvider } from './gemini/gemini-llm-provider.js';
import { ProviderFactory } from '../factory/provider-factory.js';

class MockLLMProvider implements LLMProvider {
  name: string;
  private attempts = 0;
  private failCount: number;
  private errorToThrow: any;
  private responseText: string;

  constructor(name: string, responseText = 'OK', failCount = 0, errorToThrow: any = new Error('503 Service Unavailable')) {
    this.name = name;
    this.responseText = responseText;
    this.failCount = failCount;
    this.errorToThrow = errorToThrow;
    if (typeof errorToThrow === 'object' && errorToThrow !== null) {
      errorToThrow.status = errorToThrow.status || 503;
    }
  }

  async generate(_systemPrompt: string, _userMessage: string): Promise<string> {
    this.attempts++;
    if (this.attempts <= this.failCount) {
      throw this.errorToThrow;
    }
    return this.responseText;
  }

  getAttempts() {
    return this.attempts;
  }
}

describe('ResilientLLMProvider & GeminiLLMProvider Resilience', () => {
  it('A. Deve retornar a resposta do provedor primário quando este tiver sucesso imediato', async () => {
    const primary = new MockLLMProvider('gemini', 'Resposta Gemini');
    const resilient = new ResilientLLMProvider(primary, ['openrouter'], () => new MockLLMProvider('openrouter'));

    const result = await resilient.generate('sys', 'user');
    assert.equal(result, 'Resposta Gemini');
    assert.equal(primary.getAttempts(), 1);
  });

  it('B/C. GeminiLLMProvider deve realizar retentativas e obter sucesso se erro for transitório (503/429)', async () => {
    process.env.NODE_ENV = 'test';
    let attempts = 0;
    const mockAi = {
      models: {
        generateContent: async () => {
          attempts++;
          if (attempts === 1) {
            const err: any = new Error('503 Service Unavailable');
            err.status = 503;
            throw err;
          }
          return { text: 'Sucesso após retentativa' };
        },
      },
    };

    const provider = new GeminiLLMProvider('dummy-key', 'gemini-3.6-flash', mockAi);
    const result = await provider.generate('sys', 'user');

    assert.equal(result, 'Sucesso após retentativa');
    assert.equal(attempts, 2);
  });

  it('D. GeminiLLMProvider deve esgotar retentativas se erro 503 persistir por 3 vezes', async () => {
    process.env.NODE_ENV = 'test';
    let attempts = 0;
    const mockAi = {
      models: {
        generateContent: async () => {
          attempts++;
          const err: any = new Error('503 High Demand');
          err.status = 503;
          throw err;
        },
      },
    };

    const provider = new GeminiLLMProvider('dummy-key', 'gemini-3.6-flash', mockAi);
    await assert.rejects(
      async () => {
        await provider.generate('sys', 'user');
      },
      (err: any) => {
        assert.equal(err.status, 503);
        return true;
      }
    );
    assert.equal(attempts, 3);
  });

  it('E. Deve acionar o fallback para OpenRouter se o Gemini falhar completamente', async () => {
    const primary = new MockLLMProvider('gemini', '', 999, new Error('503 Service Unavailable'));
    const openrouter = new MockLLMProvider('openrouter', 'Resposta OpenRouter');

    const providerMap: Record<string, LLMProvider> = { openrouter };
    const resilient = new ResilientLLMProvider(primary, ['openrouter'], (name) => providerMap[name]!);

    const result = await resilient.generate('sys', 'user');
    assert.equal(result, 'Resposta OpenRouter');
    assert.equal(openrouter.getAttempts(), 1);
  });

  it('F. Deve tentar HuggingFace se Gemini e OpenRouter falharem', async () => {
    const primary = new MockLLMProvider('gemini', '', 999);
    const openrouter = new MockLLMProvider('openrouter', '', 999);
    const huggingface = new MockLLMProvider('huggingface', 'Resposta HuggingFace');

    const providerMap: Record<string, LLMProvider> = { openrouter, huggingface };
    const resilient = new ResilientLLMProvider(primary, ['openrouter', 'huggingface'], (name) => providerMap[name]!);

    const result = await resilient.generate('sys', 'user');
    assert.equal(result, 'Resposta HuggingFace');
    assert.equal(huggingface.getAttempts(), 1);
  });

  it('G. Deve lançar erro SERVICE_UNAVAILABLE (503) se todos os provedores da cadeia falharem', async () => {
    const primary = new MockLLMProvider('gemini', '', 999);
    const openrouter = new MockLLMProvider('openrouter', '', 999);

    const providerMap: Record<string, LLMProvider> = { openrouter };
    const resilient = new ResilientLLMProvider(primary, ['openrouter'], (name) => providerMap[name]!);

    await assert.rejects(
      async () => {
        await resilient.generate('sys', 'user');
      },
      (err: any) => {
        assert.equal(err.status, 503);
        assert.equal(err.code, 'SERVICE_UNAVAILABLE');
        return true;
      }
    );
  });

  it('H. Deve ignorar provedor de fallback sem credenciais e passar para o próximo', async () => {
    const primary = new MockLLMProvider('gemini', '', 999);
    const huggingface = new MockLLMProvider('huggingface', 'Resposta HuggingFace');

    const resilient = new ResilientLLMProvider(primary, ['openrouter', 'huggingface'], (name) => {
      if (name === 'openrouter') {
        throw new Error('OPENROUTER_API_KEY não está definida');
      }
      return huggingface;
    });

    const result = await resilient.generate('sys', 'user');
    assert.equal(result, 'Resposta HuggingFace');
    assert.equal(huggingface.getAttempts(), 1);
  });

  it('I. Deve lançar o erro original do primário se nenhum fallback estiver configurado', async () => {
    const errOriginal = new Error('Erro Específico Gemini');
    const primary = new MockLLMProvider('gemini', '', 999, errOriginal);
    const resilient = new ResilientLLMProvider(primary, [], () => primary);

    await assert.rejects(
      async () => {
        await resilient.generate('sys', 'user');
      },
      (err: any) => {
        assert.equal(err.message, 'Erro Específico Gemini');
        return true;
      }
    );
  });

  it('J. Deve utilizar Ollama como fallback quando disponível localmente', async () => {
    const primary = new MockLLMProvider('gemini', '', 999);
    const ollama = new MockLLMProvider('ollama', 'Resposta Ollama Local');

    const resilient = new ResilientLLMProvider(primary, ['ollama'], () => ollama);

    const result = await resilient.generate('sys', 'user');
    assert.equal(result, 'Resposta Ollama Local');
    assert.equal(ollama.getAttempts(), 1);
  });

  it('ProviderFactory.getLLMProvider deve ler AI_FALLBACK_PROVIDERS sem instanciar fallbacks no startup', () => {
    const oldPrimary = process.env.AI_PROVIDER;
    const oldFallbacks = process.env.AI_FALLBACK_PROVIDERS;
    const oldOpenRouterKey = process.env.OPENROUTER_API_KEY;

    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'dummy-key';
    process.env.AI_FALLBACK_PROVIDERS = 'openrouter,huggingface,ollama';
    delete process.env.OPENROUTER_API_KEY;

    const provider = ProviderFactory.getLLMProvider();
    assert.equal(provider.name, 'gemini');

    process.env.AI_PROVIDER = oldPrimary;
    process.env.AI_FALLBACK_PROVIDERS = oldFallbacks;
    process.env.OPENROUTER_API_KEY = oldOpenRouterKey;
  });
});
