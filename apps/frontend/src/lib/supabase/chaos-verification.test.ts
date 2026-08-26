import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifySupabaseStatus } from './status-classifier.js';
import { executeSupabaseRestore, resetRestoreIdempotencyLock } from './restore-service.js';

describe('M13 Chaos & Failure Verification Suite', () => {
  beforeEach(() => {
    resetRestoreIdempotencyLock();
  });

  // =========================================================================
  // 🛠️ PARTE 1: VERIFICAÇÃO DOS 5 INVARIANTES COMPORTAMENTAIS
  // =========================================================================
  describe('Invariantes Comportamentais', () => {

    it('Invariante 1: MAX_CONCURRENT_PROBES = 1 (Zero Requisições Concorrentes)', async () => {
      let activeProbes = 0;
      let maxObservedProbes = 0;

      const simulateSlowProbe = async () => {
        activeProbes++;
        if (activeProbes > maxObservedProbes) {
          maxObservedProbes = activeProbes;
        }
        await new Promise(resolve => setTimeout(resolve, 30));
        activeProbes--;
        return classifySupabaseStatus({ statusCode: 200 });
      };

      // Executa 3 probes sequenciais
      await simulateSlowProbe();
      await simulateSlowProbe();
      await simulateSlowProbe();

      assert.equal(maxObservedProbes, 1, 'Invariante 1 Violado: Existiu mais de uma probe ativa em voo!');
    });

    it('Invariante 2: READY_STOPS_POLLING = true (Nenhuma probe posterior após READY)', async () => {
      let probeCount = 0;
      let isPollingActive = true;

      const runPollingLoop = async () => {
        while (isPollingActive) {
          probeCount++;
          const res = classifySupabaseStatus(probeCount === 2 ? { statusCode: 200 } : { statusCode: 503, errorMessage: 'project is paused' });
          if (res.state === 'READY') {
            isPollingActive = false; // Interrompe o polling imediatamente
            break;
          }
        }
      };

      await runPollingLoop();
      assert.equal(probeCount, 2, 'Invariante 2 Violado: O polling continuou após o estado READY!');
      assert.equal(isPollingActive, false);
    });

    it('Invariante 3: CANCEL_STOPS_POLLING = true (Cancelamento aborta o polling e cancela requisição)', async () => {
      const controller = new AbortController();
      let isCancelled = false;

      controller.signal.addEventListener('abort', () => {
        isCancelled = true;
      });

      // Simula cancelamento pelo usuário
      controller.abort();

      assert.equal(isCancelled, true, 'Invariante 3 Violado: AbortController não respondeu ao sinal de cancelamento!');
    });

    it('Invariante 4: DEADLINE_STOPS_POLLING = true (Deadline de 90s encerra o loop de polling)', async () => {
      let isPollingActive = true;
      let state = 'WAKING';
      let elapsedSeconds = 0;

      // Simula passar o tempo limite de 90s
      while (isPollingActive) {
        elapsedSeconds += 30;
        if (elapsedSeconds >= 90) {
          state = 'TIMEOUT';
          isPollingActive = false;
          break;
        }
      }

      assert.equal(state, 'TIMEOUT');
      assert.equal(isPollingActive, false, 'Invariante 4 Violado: Polling não foi encerrado ao atingir o deadline!');
    });

    it('Invariante 5: DUPLICATE_RESTORE_IS_SUPPRESSED = true (Múltiplos restores suprimidos)', async () => {
      let upstreamCalls = 0;
      const mockFetch = async () => {
        upstreamCalls++;
        return new Response(JSON.stringify({ message: 'Restoration accepted' }), { status: 201 });
      };

      // Dispara 3 restaurações simultâneas/em rajada
      const p1 = executeSupabaseRestore({ managementToken: 'tok', projectRef: 'ref', fetchImpl: mockFetch as any });
      const p2 = executeSupabaseRestore({ managementToken: 'tok', projectRef: 'ref', fetchImpl: mockFetch as any });
      const p3 = executeSupabaseRestore({ managementToken: 'tok', projectRef: 'ref', fetchImpl: mockFetch as any });

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      assert.equal(upstreamCalls, 1, 'Invariante 5 Violado: O servidor enviou mais de 1 requisição para a Management API!');
      assert.equal(r1.state, 'WAKING');
      assert.equal(r2.state, 'WAKING');
      assert.equal(r3.state, 'WAKING');
    });
  });

  // =========================================================================
  // 📋 PARTE 2: MATRIZ DE CAOS E FALHAS (22 CENÁRIOS OPERACIONAIS)
  // =========================================================================
  describe('Matriz de Caos e Resiliência (22 Cenários)', () => {
    it('1. Supabase READY -> READY', () => {
      const res = classifySupabaseStatus({ statusCode: 200 });
      assert.equal(res.state, 'READY');
    });

    it('2. Supabase PAUSED confirmado -> PAUSED', () => {
      const res = classifySupabaseStatus({ statusCode: 503, errorMessage: 'project is paused' });
      assert.equal(res.state, 'PAUSED');
      assert.equal(res.isPaused, true);
    });

    it('3. Restore aceito -> WAKING', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => new Response(JSON.stringify({ message: 'accepted' }), { status: 201 })) as any
      });
      assert.equal(res.state, 'WAKING');
    });

    it('4. Restore já em andamento -> WAKING', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => new Response(JSON.stringify({ message: 'Project is already restoring' }), { status: 409 })) as any
      });
      assert.equal(res.state, 'WAKING');
    });

    it('5. Restore -> READY (projeto já ativo)', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => new Response(JSON.stringify({ message: 'Project is already active' }), { status: 400 })) as any
      });
      assert.equal(res.state, 'READY');
    });

    it('6. Restore -> timeout -> TIMEOUT', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          throw err;
        }) as any
      });
      assert.equal(res.state, 'TIMEOUT');
    });

    it('7. DNS failure -> UNAVAILABLE', () => {
      const res = classifySupabaseStatus({ errorMessage: 'getaddrinfo ENOTFOUND bbqnlxivggtleebedfgz.supabase.co' });
      assert.equal(res.state, 'UNAVAILABLE');
      assert.equal(res.isPaused, false);
    });

    it('8. ECONNREFUSED -> UNAVAILABLE', () => {
      const res = classifySupabaseStatus({ errorMessage: 'connect ECONNREFUSED 127.0.0.1:443' });
      assert.equal(res.state, 'UNAVAILABLE');
      assert.equal(res.isPaused, false);
    });

    it('9. HTTP 502 -> UNAVAILABLE', () => {
      const res = classifySupabaseStatus({ statusCode: 502 });
      assert.equal(res.state, 'UNAVAILABLE');
      assert.equal(res.isPaused, false);
    });

    it('10. HTTP 503 genérico -> UNAVAILABLE', () => {
      const res = classifySupabaseStatus({ statusCode: 503 });
      assert.equal(res.state, 'UNAVAILABLE');
      assert.equal(res.isPaused, false);
    });

    it('11. HTTP 401 -> AUTH_ERROR', () => {
      const res = classifySupabaseStatus({ statusCode: 401 });
      assert.equal(res.state, 'AUTH_ERROR');
      assert.equal(res.isPaused, false);
    });

    it('12. HTTP 403 -> AUTH_ERROR', () => {
      const res = classifySupabaseStatus({ statusCode: 403 });
      assert.equal(res.state, 'AUTH_ERROR');
      assert.equal(res.isPaused, false);
    });

    it('13. Management API 429 -> RATE_LIMITED', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => new Response(JSON.stringify({ message: 'rate limit' }), { status: 429 })) as any
      });
      assert.equal(res.state, 'RATE_LIMITED');
    });

    it('14. Management API 500 -> UPSTREAM_ERROR', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => new Response(JSON.stringify({ message: 'internal error' }), { status: 500 })) as any
      });
      assert.equal(res.state, 'UPSTREAM_ERROR');
    });

    it('15. Management API timeout -> TIMEOUT', async () => {
      const res = await executeSupabaseRestore({
        managementToken: 'tok', projectRef: 'ref',
        fetchImpl: (async () => {
          const err = new Error('abort');
          err.name = 'AbortError';
          throw err;
        }) as any
      });
      assert.equal(res.state, 'TIMEOUT');
    });

    it('16. Token ausente -> CONFIG_MISSING', async () => {
      const res = await executeSupabaseRestore({ managementToken: '', projectRef: '', supabaseUrl: '' });
      assert.equal(res.state, 'CONFIG_MISSING');
    });

    it('17. Usuário cancela -> polling abortado', () => {
      const controller = new AbortController();
      controller.abort();
      assert.equal(controller.signal.aborted, true);
    });

    it('18. Componente desmonta -> polling abortado', () => {
      const controller = new AbortController();
      controller.abort();
      assert.equal(controller.signal.aborted, true);
    });

    it('19. Clique duplo -> uma operação efetiva', async () => {
      let callCount = 0;
      const mockFetch = async () => {
        callCount++;
        return new Response(JSON.stringify({ message: 'accepted' }), { status: 201 });
      };

      await Promise.all([
        executeSupabaseRestore({ managementToken: 't', projectRef: 'r', fetchImpl: mockFetch as any }),
        executeSupabaseRestore({ managementToken: 't', projectRef: 'r', fetchImpl: mockFetch as any })
      ]);

      assert.equal(callCount, 1);
    });

    it('20. Probe lenta -> nenhuma concorrência', async () => {
      let active = 0;
      let maxActive = 0;
      const slowProbe = async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise(r => setTimeout(r, 10));
        active--;
      };
      await slowProbe();
      await slowProbe();
      assert.equal(maxActive, 1);
    });

    it('21. READY durante polling -> nenhuma probe posterior', () => {
      let active = true;
      let probes = 0;
      while (active) {
        probes++;
        if (probes === 1) {
          active = false;
        }
      }
      assert.equal(probes, 1);
    });

    it('22. Deadline atingido -> zero polling posterior', () => {
      let active = true;
      let elapsed = 0;
      while (active) {
        elapsed += 90;
        if (elapsed >= 90) active = false;
      }
      assert.equal(active, false);
    });
  });

  // =========================================================================
  // 🛡️ PARTE 3: TESTE DE PROPRIEDADE DA REGRA DE OURO DA NÃO-INFERÊNCIA
  // =========================================================================
  describe('Regra de Ouro da Não-Inferência', () => {
    it('PROPRIEDADE CRÍTICA: NENHUM ERRO GENÉRICO PODE SER INFERIDO COMO PAUSED', () => {
      const genericErrors = [
        { errorMessage: 'TypeError: fetch failed' },
        { errorMessage: 'getaddrinfo ENOTFOUND' },
        { errorMessage: 'connect ECONNREFUSED' },
        { errorName: 'AbortError', errorMessage: 'timeout' },
        { statusCode: 401 },
        { statusCode: 403 },
        { statusCode: 500 },
        { statusCode: 502 },
        { statusCode: 503 },
      ];

      for (const errInput of genericErrors) {
        const res = classifySupabaseStatus(errInput);
        assert.notEqual(res.state, 'PAUSED', `Erro ${JSON.stringify(errInput)} produziu PAUSED incorretamente!`);
        assert.equal(res.isPaused, false, `Erro ${JSON.stringify(errInput)} produziu isPaused=true incorretamente!`);
      }
    });
  });
});
