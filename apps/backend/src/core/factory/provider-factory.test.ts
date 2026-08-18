import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderFactory } from './provider-factory.js';

describe('ProviderFactory', () => {
  it('deve retornar OllamaLLMProvider para provider ollama', () => {
    const provider = ProviderFactory.getLLMProvider('ollama');
    assert.equal(provider.name, 'ollama');
  });

  it('deve lançar erro se OPENROUTER_API_KEY estiver ausente', () => {
    const oldKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    assert.throws(
      () => ProviderFactory.getLLMProvider('openrouter'),
      /OPENROUTER_API_KEY não está definida/
    );
    process.env.OPENROUTER_API_KEY = oldKey;
  });

  it('deve lançar erro se HUGGINGFACE_API_KEY estiver ausente', () => {
    const oldKey = process.env.HUGGINGFACE_API_KEY;
    delete process.env.HUGGINGFACE_API_KEY;
    assert.throws(
      () => ProviderFactory.getLLMProvider('huggingface'),
      /HUGGINGFACE_API_KEY não está definida/
    );
    process.env.HUGGINGFACE_API_KEY = oldKey;
  });

  it('deve retornar GeminiLLMProvider quando GEMINI_API_KEY estiver definida', () => {
    const oldKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'dummy-key';
    const provider = ProviderFactory.getLLMProvider('gemini');
    assert.equal(provider.name, 'gemini');
    process.env.GEMINI_API_KEY = oldKey;
  });

  it('deve retornar GeminiEmbeddingProvider com dimensão 768', () => {
    const oldKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'dummy-key';
    const provider = ProviderFactory.getEmbeddingProvider('gemini');
    assert.equal(provider.name, 'gemini');
    assert.equal(provider.dimension, 768);
    assert.equal(provider.modelName, 'gemini-embedding-2');
    process.env.GEMINI_API_KEY = oldKey;
  });
});
