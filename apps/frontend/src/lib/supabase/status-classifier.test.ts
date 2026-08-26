import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifySupabaseStatus } from './status-classifier.js';

describe('Supabase Status Classifier (M10 Specification)', () => {
  // Caso A: Supabase READY
  it('Cenário A: Deve classificar HTTP 200 com resposta válida como READY', () => {
    const result = classifySupabaseStatus({ statusCode: 200 });
    assert.equal(result.state, 'READY');
    assert.equal(result.isReady, true);
    assert.equal(result.isPaused, false);
  });

  it('Cenário A: Deve classificar HTTP 204 como READY', () => {
    const result = classifySupabaseStatus({ statusCode: 204 });
    assert.equal(result.state, 'READY');
    assert.equal(result.isReady, true);
    assert.equal(result.isPaused, false);
  });

  // Caso B: Supabase PAUSED
  it('Cenário B: Deve classificar erro com assinatura explícita de projeto pausado como PAUSED', () => {
    const result = classifySupabaseStatus({
      statusCode: 503,
      responseBody: { isPaused: true, error: 'project_paused' },
    });
    assert.equal(result.state, 'PAUSED');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, true);
  });

  it('Cenário B: Deve classificar mensagem contendo "project is paused" como PAUSED', () => {
    const result = classifySupabaseStatus({
      statusCode: 503,
      errorMessage: 'Supabase Error: project is paused due to inactivity',
    });
    assert.equal(result.state, 'PAUSED');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, true);
  });

  // Caso C: Supabase WAKING
  it('Cenário C: Deve classificar resposta de restauração em andamento como WAKING', () => {
    const result = classifySupabaseStatus({
      statusCode: 202,
      responseBody: { status: 'restoring' },
    });
    assert.equal(result.state, 'WAKING');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  // Caso D: Timeout
  it('Cenário D: Deve classificar AbortError como TIMEOUT (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorName: 'AbortError',
      errorMessage: 'The operation was aborted',
    });
    assert.equal(result.state, 'TIMEOUT');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  it('Cenário D: Deve classificar erro ETIMEDOUT como TIMEOUT (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorMessage: 'connect ETIMEDOUT 127.0.0.1:5432',
    });
    assert.equal(result.state, 'TIMEOUT');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  // Caso E: Auth Error (401 / 403)
  it('Cenário E: Deve classificar HTTP 401 como AUTH_ERROR (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({ statusCode: 401 });
    assert.equal(result.state, 'AUTH_ERROR');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  it('Cenário E: Deve classificar HTTP 403 / Invalid API key como AUTH_ERROR (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      statusCode: 403,
      errorMessage: 'Invalid API key provided',
    });
    assert.equal(result.state, 'AUTH_ERROR');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  // Caso F: Network Failure (fetch failed / DNS / Connection Refused)
  it('Cenário F: Deve classificar "fetch failed" como UNAVAILABLE (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorMessage: 'TypeError: fetch failed',
    });
    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  it('Cenário F: Deve classificar ENOTFOUND (falha de DNS) como UNAVAILABLE (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorMessage: 'getaddrinfo ENOTFOUND xxx.supabase.co',
    });
    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  it('Cenário F: Deve classificar ECONNREFUSED como UNAVAILABLE (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorMessage: 'connect ECONNREFUSED 127.0.0.1:443',
    });
    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  it('Cenário F: Deve classificar HTTP 502/503 genérico sem assinatura como UNAVAILABLE (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({ statusCode: 503 });
    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  // Caso G: Erros genéricos / desconhecidos
  it('Cenário G: Deve classificar erro genérico como UNKNOWN (NÃO PAUSED)', () => {
    const result = classifySupabaseStatus({
      errorMessage: 'Unexpected memory corruption in buffer',
    });
    assert.equal(result.state, 'UNKNOWN');
    assert.equal(result.isReady, false);
    assert.equal(result.isPaused, false);
  });

  // PROPRIEDADE FUNDAMENTAL DA REGRA DE OURO
  it('PROPRIEDADE: Nenhum erro genérico de rede/timeout/auth pode ser inferido como PAUSED', () => {
    const nonPausedInputs = [
      { errorMessage: 'fetch failed' },
      { errorName: 'AbortError', errorMessage: 'timeout' },
      { errorMessage: 'ENOTFOUND' },
      { errorMessage: 'ECONNREFUSED' },
      { statusCode: 401 },
      { statusCode: 403 },
      { statusCode: 502 },
      { statusCode: 503 },
      { errorMessage: 'Internal error' },
    ];

    for (const input of nonPausedInputs) {
      const res = classifySupabaseStatus(input);
      assert.notEqual(
        res.state,
        'PAUSED',
        `Input ${JSON.stringify(input)} não deve ser classificado como PAUSED`
      );
      assert.equal(
        res.isPaused,
        false,
        `Input ${JSON.stringify(input)} deve ter isPaused=false`
      );
    }
  });
});
