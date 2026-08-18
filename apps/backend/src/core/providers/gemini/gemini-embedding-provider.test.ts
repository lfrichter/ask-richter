import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { retryWithBackoff, GeminiEmbeddingProvider } from './gemini-embedding-provider.js';

describe('GeminiEmbeddingProvider & retryWithBackoff', () => {
  it('deve executar com sucesso na primeira tentativa se não houver erro', async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      return 'sucesso';
    }, 3, 10);

    assert.equal(result, 'sucesso');
    assert.equal(calls, 1);
  });

  it('deve realizar retentativas em caso de erro 429 e ter sucesso', async () => {
    let calls = 0;
    const result = await retryWithBackoff(async () => {
      calls++;
      if (calls < 3) {
        const error = new Error('429 Quota exceeded: RESOURCE_EXHAUSTED');
        (error as any).status = 429;
        throw error;
      }
      return 'sucesso_pos_429';
    }, 4, 10);

    assert.equal(result, 'sucesso_pos_429');
    assert.equal(calls, 3);
  });

  it('deve falhar imediatamente sem retentativas em erro definitivo 401', async () => {
    let calls = 0;
    await assert.rejects(
      async () => {
        await retryWithBackoff(async () => {
          calls++;
          const error = new Error('401 API_KEY_INVALID');
          (error as any).status = 401;
          throw error;
        }, 5, 10);
      },
      (err: any) => {
        assert.equal(err.status, 401);
        return true;
      }
    );
    assert.equal(calls, 1); // Sem retentativas para 401
  });

  it('deve instanciar GeminiEmbeddingProvider com metadados corretos', () => {
    const provider = new GeminiEmbeddingProvider('dummy-key', 'gemini-embedding-2', 768);
    assert.equal(provider.name, 'gemini');
    assert.equal(provider.modelName, 'gemini-embedding-2');
    assert.equal(provider.dimension, 768);
  });
});
