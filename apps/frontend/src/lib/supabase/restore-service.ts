import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export interface RestoreOptions {
  managementToken?: string;
  projectRef?: string;
  supabaseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  skipIdempotencyLock?: boolean;
}

export interface RestoreResult {
  success: boolean;
  state:
    | 'WAKING'
    | 'READY'
    | 'AUTH_ERROR'
    | 'NOT_FOUND'
    | 'RATE_LIMITED'
    | 'UPSTREAM_ERROR'
    | 'TIMEOUT'
    | 'UNAVAILABLE'
    | 'CONFIG_MISSING'
    | 'UNKNOWN';
  status: 'restoring' | 'active' | 'error';
  projectRef?: string;
  message: string;
  checkedAt: string;
}

export interface ManagementProjectDetails {
  success: boolean;
  projectRef?: string;
  managementStatus?: string; // Ex: 'ACTIVE_HEALTHY', 'INACTIVE', 'RESTORING', 'GOING_DOWN'
  message: string;
}

// Trava de idempotência em memória e controle de promessas em voo
const inFlightRestorePromises = new Map<string, Promise<RestoreResult>>();
const lastRestoreTimestamps = new Map<string, number>();
const IDEMPOTENCY_WINDOW_MS = 10000; // 10 segundos

/**
 * Resolve as variáveis de ambiente estritamente no server-side.
 */
function resolveServerSecrets(options: RestoreOptions) {
  let managementToken = options.managementToken || process.env.SUPABASE_MANAGEMENT_TOKEN;
  let supabaseUrl = options.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let projectRef = options.projectRef || process.env.SUPABASE_PROJECT_REF;

  // Fallback de desenvolvimento local em ambiente Node
  if ((!managementToken || !projectRef) && typeof process !== 'undefined' && process.cwd) {
    const candidatePaths = [
      path.join(process.cwd(), 'apps/backend/.env'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '../backend/.env')
    ];

    for (const envPath of candidatePaths) {
      if (fs.existsSync(envPath)) {
        try {
          const envConfig = dotenv.parse(fs.readFileSync(envPath));
          managementToken = managementToken || envConfig.SUPABASE_MANAGEMENT_TOKEN;
          projectRef = projectRef || envConfig.SUPABASE_PROJECT_REF;
          supabaseUrl = supabaseUrl || envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
        } catch {
          // Ignora falha de leitura
        }
      }
    }
  }

  // Extrai o projectRef da URL se não for fornecido explicitamente
  if (!projectRef && supabaseUrl) {
    try {
      const cleanUrl = supabaseUrl.replace(/^https?:\/\//, '');
      projectRef = cleanUrl.split('.')[0];
    } catch {
      // Ignora erro de parsing
    }
  }

  return { managementToken, projectRef };
}

/**
 * Limpa o histórico de idempotência (utilitário para testes unitários).
 */
export function resetRestoreIdempotencyLock() {
  lastRestoreTimestamps.clear();
  inFlightRestorePromises.clear();
}

/**
 * Consulta o status oficial do projeto via Supabase Management API (GET /v1/projects/{ref}).
 */
export async function getSupabaseManagementProjectStatus(options: RestoreOptions = {}): Promise<ManagementProjectDetails> {
  const { managementToken, projectRef } = resolveServerSecrets(options);
  const fetchFn = options.fetchImpl || fetch;

  if (!managementToken || !projectRef) {
    return {
      success: false,
      projectRef: projectRef || undefined,
      message: 'SUPABASE_MANAGEMENT_TOKEN ou projectRef não configurado.',
    };
  }

  try {
    const response = await fetchFn(`https://api.supabase.com/v1/projects/${projectRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        projectRef,
        message: `Management API retornou status HTTP ${response.status}`,
      };
    }

    const data: any = await response.json();
    return {
      success: true,
      projectRef,
      managementStatus: data.status || 'UNKNOWN',
      message: `Status oficial do projeto: ${data.status || 'UNKNOWN'}`,
    };
  } catch (err: any) {
    return {
      success: false,
      projectRef,
      message: `Falha ao consultar status na Management API: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Executa a solicitação de restauração server-side junto à Management API do Supabase (POST /v1/projects/{ref}/restore).
 */
export async function executeSupabaseRestore(options: RestoreOptions = {}): Promise<RestoreResult> {
  const checkedAt = new Date().toISOString();
  const { managementToken, projectRef } = resolveServerSecrets(options);
  const fetchFn = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 5000;

  // 10. Ausência de configuração obrigatória
  if (!managementToken || !projectRef) {
    return {
      success: false,
      state: 'CONFIG_MISSING',
      status: 'error',
      projectRef: projectRef || undefined,
      message: 'Token de gerenciamento do Supabase (SUPABASE_MANAGEMENT_TOKEN) não configurado no servidor.',
      checkedAt,
    };
  }

  // Se já existir uma requisição de restore em voo para este mesmo projectRef, reaproveita a promessa
  if (!options.skipIdempotencyLock && inFlightRestorePromises.has(projectRef)) {
    return inFlightRestorePromises.get(projectRef)!;
  }

  // Proteção contra chamadas concorrentes/redundantes em janela deslizante recente
  if (!options.skipIdempotencyLock) {
    const lastTimestamp = lastRestoreTimestamps.get(projectRef);
    if (lastTimestamp && Date.now() - lastTimestamp < IDEMPOTENCY_WINDOW_MS) {
      return {
        success: true,
        state: 'WAKING',
        status: 'restoring',
        projectRef,
        message: 'Solicitação de restauração em andamento (chamada recente tratada com idempotência).',
        checkedAt,
      };
    }
  }

  // Registra a promessa em voo e a marcação de tempo
  const restorePromise = (async (): Promise<RestoreResult> => {
    lastRestoreTimestamps.set(projectRef, Date.now());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(`https://api.supabase.com/v1/projects/${projectRef}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let responseBody: any = null;
      try {
        responseBody = await response.json();
      } catch {
        // Ignora erro de parsing JSON
      }

      const bodyMsg = (responseBody?.message || responseBody?.error || '').toLowerCase();

      // 1. Restore Aceito (HTTP 200, 201, 202) -> WAKING
      if (response.ok || response.status === 201 || response.status === 202) {
        return {
          success: true,
          state: 'WAKING',
          status: 'restoring',
          projectRef,
          message: 'Restauração do Supabase disparada com sucesso! Aguarde a inicialização dos contêineres.',
          checkedAt,
        };
      }

      // 2. Projeto Já Restaurando (HTTP 400/409/422 com mensagem de "restoring" / "in progress")
      if (
        bodyMsg.includes('restoring') ||
        bodyMsg.includes('in progress') ||
        bodyMsg.includes('already being restored')
      ) {
        return {
          success: true,
          state: 'WAKING',
          status: 'restoring',
          projectRef,
          message: 'O projeto Supabase já se encontra em processo de restauração.',
          checkedAt,
        };
      }

      // 3. Projeto Já Ativo (HTTP 400/409/422 com mensagem "active" / "not paused")
      if (
        bodyMsg.includes('active') ||
        bodyMsg.includes('already active') ||
        bodyMsg.includes('not paused')
      ) {
        return {
          success: true,
          state: 'READY',
          status: 'active',
          projectRef,
          message: 'O projeto Supabase já se encontra ativo e operacional.',
          checkedAt,
        };
      }

      // 4. Autenticação/Autorização Inválida (HTTP 401 / 403)
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          state: 'AUTH_ERROR',
          status: 'error',
          projectRef,
          message: `SUPABASE_MANAGEMENT_TOKEN inválido ou sem permissão (${response.status}). Exige escopo project_admin_write.`,
          checkedAt,
        };
      }

      // 5. Projeto Não Encontrado (HTTP 404)
      if (response.status === 404) {
        return {
          success: false,
          state: 'NOT_FOUND',
          status: 'error',
          projectRef,
          message: `Projeto ref '${projectRef}' não foi encontrado no Supabase Management.`,
          checkedAt,
        };
      }

      // 6. Rate Limit Excedido (HTTP 429)
      if (response.status === 429) {
        return {
          success: false,
          state: 'RATE_LIMITED',
          status: 'error',
          projectRef,
          message: 'Limite de requisições excedido na Management API do Supabase.',
          checkedAt,
        };
      }

      // 7. Erros de Servidor (HTTP 5xx)
      if (response.status >= 500) {
        return {
          success: false,
          state: 'UPSTREAM_ERROR',
          status: 'error',
          projectRef,
          message: `A Management API do Supabase retornou um erro interno (${response.status}).`,
          checkedAt,
        };
      }

      // Outros status de erro não previstos
      return {
        success: false,
        state: 'UNKNOWN',
        status: 'error',
        projectRef,
        message: `A Management API retornou status imprevisto (${response.status}).`,
        checkedAt,
      };

    } catch (err: any) {
      clearTimeout(timeoutId);
      const errName = (err?.name || '').toLowerCase();
      const errMsg = (err?.message || '').toLowerCase();

      // 8. Timeout
      if (errName === 'aborterror' || errMsg.includes('abort') || errMsg.includes('timeout')) {
        return {
          success: false,
          state: 'TIMEOUT',
          status: 'error',
          projectRef,
          message: 'Tempo limite de conexão com a Management API do Supabase excedido.',
          checkedAt,
        };
      }

      // 9. Erro de Rede (fetch failed, ENOTFOUND, ECONNREFUSED)
      return {
        success: false,
        state: 'UNAVAILABLE',
        status: 'error',
        projectRef,
        message: `Falha de rede ao conectar com a Management API: ${err?.message || 'Network Error'}`,
        checkedAt,
      };
    } finally {
      inFlightRestorePromises.delete(projectRef);
    }
  })();

  if (!options.skipIdempotencyLock) {
    inFlightRestorePromises.set(projectRef, restorePromise);
  }

  return restorePromise;
}
