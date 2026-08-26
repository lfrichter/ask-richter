export type SupabaseOperationalState =
  | 'READY'
  | 'PAUSED'
  | 'WAKING'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'AUTH_ERROR'
  | 'UNKNOWN';

export interface ClassifyInput {
  statusCode?: number | null;
  errorMessage?: string | null;
  errorName?: string | null;
  responseBody?: any;
}

export interface SupabaseStatusResult {
  state: SupabaseOperationalState;
  isReady: boolean;
  isPaused: boolean;
  statusCode?: number;
  reason: string;
  checkedAt: string;
}

/**
 * Classificador puro de estado operacional do Supabase.
 *
 * Regra de Ouro:
 * NENHUM erro genérico (timeout, DNS, conexão recusada, fetch failed, auth error)
 * pode ser inferido como PAUSED. O estado PAUSED só é retornado quando houver
 * evidência explícita e inequívoca de que o projeto Supabase está congelado/pausado.
 */
export function classifySupabaseStatus(input: ClassifyInput): SupabaseStatusResult {
  const checkedAt = new Date().toISOString();
  const { statusCode, errorMessage, errorName, responseBody } = input;
  const msgLower = (errorMessage || '').toLowerCase();
  const nameLower = (errorName || '').toLowerCase();

  // 1. TIMEOUT Check (AbortError ou erros explícitos de timeout)
  if (
    nameLower === 'aborterror' ||
    msgLower.includes('abort') ||
    msgLower.includes('timeout') ||
    msgLower.includes('etimedout')
  ) {
    return {
      state: 'TIMEOUT',
      isReady: false,
      isPaused: false,
      statusCode: statusCode || undefined,
      reason: errorMessage || 'TIMEOUT: Requisição excedeu o tempo limite.',
      checkedAt,
    };
  }

  // 2. AUTH_ERROR Check (401, 403, JWT ou apikey inválidos)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    msgLower.includes('jwt') ||
    msgLower.includes('apikey') ||
    msgLower.includes('unauthorized') ||
    msgLower.includes('forbidden') ||
    msgLower.includes('invalid api key')
  ) {
    return {
      state: 'AUTH_ERROR',
      isReady: false,
      isPaused: false,
      statusCode: statusCode || undefined,
      reason: errorMessage || `AUTH_ERROR: Falha de autenticação ou autorização (${statusCode || '401/403'}).`,
      checkedAt,
    };
  }

  // 3. PAUSED Check - Requer evidência EXPLÍCITA do Supabase
  let hasExplicitPausedSignature = false;

  if (responseBody && typeof responseBody === 'object') {
    if (
      responseBody.isPaused === true ||
      responseBody.status === 'paused' ||
      responseBody.code === 'PGRST301' || // PostgREST project paused signature
      responseBody.error === 'project_paused' ||
      (typeof responseBody.message === 'string' && responseBody.message.toLowerCase().includes('project is paused'))
    ) {
      hasExplicitPausedSignature = true;
    }
  }

  if (
    msgLower.includes('project is paused') ||
    msgLower.includes('project_paused') ||
    msgLower.includes('database is paused')
  ) {
    hasExplicitPausedSignature = true;
  }

  // Status 503 com corpo contendo a palavra 'paused' explícita
  if (statusCode === 503 && (msgLower.includes('paused') || (typeof responseBody === 'string' && responseBody.toLowerCase().includes('paused')))) {
    hasExplicitPausedSignature = true;
  }

  if (hasExplicitPausedSignature) {
    return {
      state: 'PAUSED',
      isReady: false,
      isPaused: true,
      statusCode: statusCode || 503,
      reason: 'PAUSED: Projeto Supabase confirmado em estado congelado por inatividade.',
      checkedAt,
    };
  }

  // 4. WAKING Check (quando em processo de restauração)
  if (
    msgLower.includes('waking') ||
    msgLower.includes('restoring') ||
    (responseBody && responseBody.status === 'restoring')
  ) {
    return {
      state: 'WAKING',
      isReady: false,
      isPaused: false,
      statusCode: statusCode || 202,
      reason: 'WAKING: Projeto Supabase está em processo de restauração.',
      checkedAt,
    };
  }

  // 5. READY Check (HTTP 200, 204 com resposta de sucesso)
  if (statusCode && statusCode >= 200 && statusCode < 300) {
    return {
      state: 'READY',
      isReady: true,
      isPaused: false,
      statusCode,
      reason: 'READY: Supabase operacional e respondendo.',
      checkedAt,
    };
  }

  // 6. UNAVAILABLE Check (Falhas de rede, DNS, conexão recusada, 502/503/504 genéricos)
  if (
    msgLower.includes('fetch failed') ||
    msgLower.includes('enotfound') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('nxdomain') ||
    msgLower.includes('network') ||
    msgLower.includes('failed to fetch') ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504
  ) {
    return {
      state: 'UNAVAILABLE',
      isReady: false,
      isPaused: false,
      statusCode: statusCode || undefined,
      reason: errorMessage || `UNAVAILABLE: Falha de rede ou infraestrutura (${statusCode || 'Network Error'}).`,
      checkedAt,
    };
  }

  // 7. UNKNOWN Check (Falhas não categorizadas)
  return {
    state: 'UNKNOWN',
    isReady: false,
    isPaused: false,
    statusCode: statusCode || undefined,
    reason: errorMessage || 'UNKNOWN: Estado do Supabase não pôde ser determinado com certeza.',
    checkedAt,
  };
}
