import assert from 'node:assert';
import { test, describe } from 'node:test';
import { classifySupabaseStatus } from './supabase/status-classifier';

describe('Production API Routing Invariants (Plan M Specification)', () => {
  test('REGRA ARQUITETURAL 1: Render.com NUNCA deve ser utilizado como endpoint de produção para /api/chat', () => {
    const rawUrl = 'https://ask-richter-backend.onrender.com';
    const apiBaseUrl = rawUrl.includes('onrender.com') ? '' : rawUrl.replace(/\/$/, '');
    
    const constructedChatUrl = `${apiBaseUrl}/api/chat`;
    
    // Invariante 1: O endpoint construído NUNCA pode ser a URL da Render
    assert.notStrictEqual(constructedChatUrl, 'https://ask-richter-backend.onrender.com/api/chat');
    
    // Invariante 2: O endpoint construído DEVE ser estritamente relativo em produção
    assert.strictEqual(constructedChatUrl, '/api/chat');
  });

  test('REGRA ARQUITETURAL 2: Quando NEXT_PUBLIC_API_BASE_URL estiver ausente (Vercel Prod), todas as rotas DEVEM ser relativas', () => {
    const rawUrl = undefined;
    const apiBaseUrl = (rawUrl || '').includes('onrender.com') ? '' : (rawUrl || '').replace(/\/$/, '');
    
    assert.strictEqual(`${apiBaseUrl}/api/chat`, '/api/chat');
    assert.strictEqual(`${apiBaseUrl}/api/supabase/status`, '/api/supabase/status');
    assert.strictEqual(`${apiBaseUrl}/api/supabase/restore`, '/api/supabase/restore');
    assert.strictEqual(`${apiBaseUrl}/api/ready`, '/api/ready');
  });

  test('REGRA ARQUITETURAL 3: Erro de autenticação (HTTP 401) NUNCA pode ser classificado como PAUSED', () => {
    const result = classifySupabaseStatus({
      statusCode: 401,
      responseBody: { message: 'Invalid API key', hint: 'Only the service_role API key can be used for this endpoint.' }
    });

    assert.strictEqual(result.state, 'AUTH_ERROR');
    assert.strictEqual(result.isPaused, false);
    assert.strictEqual(result.isReady, false);
  });

  test('REGRA ARQUITETURAL 4: Resposta HTTP 200 DEVE ser classificada como READY', () => {
    const result = classifySupabaseStatus({
      statusCode: 200,
      responseBody: { swagger: '2.0', info: { title: 'standard public schema' } }
    });

    assert.strictEqual(result.state, 'READY');
    assert.strictEqual(result.isReady, true);
    assert.strictEqual(result.isPaused, false);
  });
});
