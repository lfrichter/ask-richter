import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { executeSupabaseRestore, getSupabaseManagementProjectStatus, resetRestoreIdempotencyLock } from './restore-service.js';

describe('Supabase Restore Service (M11 Specification)', () => {
  beforeEach(() => {
    resetRestoreIdempotencyLock();
  });

  // 1. Restore Aceito
  it('Cenário 1: Deve retornar WAKING quando a Management API aceitar a restauração (HTTP 201)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Restoration accepted' }), { status: 201 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.state, 'WAKING');
    assert.equal(result.status, 'restoring');
    assert.equal(result.projectRef, 'mock-project-ref');
  });

  // 2. Projeto Já Restaurando
  it('Cenário 2: Deve retornar WAKING quando a Management API indicar restauração em andamento (HTTP 409)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Project is already restoring' }), { status: 409 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.state, 'WAKING');
    assert.equal(result.status, 'restoring');
  });

  it('Cenário 2 (Idempotência): Chamadas em sequência no curto intervalo de tempo devem retornar WAKING sem duplicar requisição', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return new Response(JSON.stringify({ message: 'Restoration accepted' }), { status: 201 });
    };

    const res1 = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    const res2 = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(res1.state, 'WAKING');
    assert.equal(res2.state, 'WAKING');
    assert.equal(callCount, 1, 'A segunda chamada no mesmo intervalo não deve ter disparado a API');
  });

  // 3. Projeto Já Ativo
  it('Cenário 3: Deve retornar READY quando a Management API indicar projeto já ativo (HTTP 400)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Project is already active and not paused' }), { status: 400 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, true);
    assert.equal(result.state, 'READY');
    assert.equal(result.status, 'active');
  });

  // 4. 401/403 Auth Error
  it('Cenário 4: Deve retornar AUTH_ERROR quando o token for recusado (HTTP 401)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    const result = await executeSupabaseRestore({
      managementToken: 'invalid-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'AUTH_ERROR');
    assert.equal(result.status, 'error');
  });

  // 5. 404 Project Not Found
  it('Cenário 5: Deve retornar NOT_FOUND quando o projeto não for localizado (HTTP 404)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Project not found' }), { status: 404 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'non-existent-project',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'NOT_FOUND');
    assert.equal(result.status, 'error');
  });

  // 6. 429 Rate Limited
  it('Cenário 6: Deve retornar RATE_LIMITED quando exceder limites da API (HTTP 429)', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'RATE_LIMITED');
    assert.equal(result.status, 'error');
  });

  // 7. 5xx Upstream Error
  it('Cenário 7: Deve retornar UPSTREAM_ERROR quando o Supabase responder 500/503', async () => {
    const mockFetch = async () => new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'UPSTREAM_ERROR');
    assert.equal(result.status, 'error');
  });

  // 8. Timeout
  it('Cenário 8: Deve retornar TIMEOUT quando a chamada estourar o tempo limite', async () => {
    const mockFetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'TIMEOUT');
    assert.equal(result.status, 'error');
  });

  // 9. Erro de Rede
  it('Cenário 9: Deve retornar UNAVAILABLE em caso de erro de conexão ou DNS', async () => {
    const mockFetch = async () => {
      throw new TypeError('fetch failed');
    };
    const result = await executeSupabaseRestore({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'UNAVAILABLE');
    assert.equal(result.status, 'error');
  });

  // 10. Ausência de Configuração Obrigatória
  it('Cenário 10: Deve retornar CONFIG_MISSING se o token de gerenciamento não estiver definido', async () => {
    const result = await executeSupabaseRestore({
      managementToken: '',
      projectRef: '',
      supabaseUrl: '',
    });

    assert.equal(result.success, false);
    assert.equal(result.state, 'CONFIG_MISSING');
    assert.equal(result.status, 'error');
  });

  // 11. Consulta de status via Management API (GET /v1/projects/{ref})
  it('Cenário 11: Deve consultar status do projeto via Management API (GET /v1/projects/{ref})', async () => {
    const mockFetch = async (url: string) => {
      assert.ok(url.includes('/v1/projects/mock-project-ref'));
      return new Response(JSON.stringify({ id: '1', ref: 'mock-project-ref', status: 'ACTIVE_HEALTHY' }), { status: 200 });
    };

    const details = await getSupabaseManagementProjectStatus({
      managementToken: 'mock-token',
      projectRef: 'mock-project-ref',
      fetchImpl: mockFetch as any,
    });

    assert.equal(details.success, true);
    assert.equal(details.managementStatus, 'ACTIVE_HEALTHY');
  });
});
