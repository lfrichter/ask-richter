import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { classifySupabaseStatus } from '@/lib/supabase/status-classifier';
import { getSupabaseManagementProjectStatus } from '@/lib/supabase/restore-service';

export async function GET() {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Fallback de desenvolvimento local: tenta carregar do apps/backend/.env ou root .env se não estiver no env do frontend
    if (!supabaseUrl || !supabaseKey) {
      const candidatePaths = [
        path.join(process.cwd(), 'apps/backend/.env'),
        path.join(process.cwd(), 'apps/frontend/.env.local'),
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '../backend/.env')
      ];

      for (const envPath of candidatePaths) {
        if (fs.existsSync(envPath)) {
          try {
            const envConfig = dotenv.parse(fs.readFileSync(envPath));
            supabaseUrl = supabaseUrl || envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
            supabaseKey = supabaseKey || envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) break;
          } catch {}
        }
      }
    }

    // 1. Checagem inicial via Supabase Management API se credenciais estiverem disponíveis
    let mgmtStatus: string | undefined;
    try {
      const mgmtRes = await getSupabaseManagementProjectStatus();
      if (mgmtRes.success && mgmtRes.managementStatus) {
        mgmtStatus = mgmtRes.managementStatus;
        if (mgmtStatus === 'INACTIVE' || mgmtStatus === 'PAUSED' || mgmtStatus === 'GOING_DOWN') {
          const result = classifySupabaseStatus({
            statusCode: 503,
            responseBody: { isPaused: true, status: 'paused', error: 'project_paused' }
          });
          return NextResponse.json({
            state: result.state,
            status: 'paused',
            isReady: result.isReady,
            isPaused: result.isPaused,
            statusCode: 503,
            reason: result.reason,
            checkedAt: result.checkedAt,
          });
        }
      }
    } catch {
      // Ignora falhas da Management API e avança para a probe operacional
    }

    if (!supabaseUrl || !supabaseKey) {
      const result = classifySupabaseStatus({
        errorMessage: 'Variáveis de ambiente do Supabase não encontradas.',
      });
      return NextResponse.json({
        state: result.state,
        status: 'ok',
        isReady: result.isReady,
        isPaused: result.isPaused,
        reason: 'SUPABASE_ENV_MISSING',
        checkedAt: result.checkedAt,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let bodyData: any = null;
      try {
        bodyData = await res.json();
      } catch {
        // Ignora erro de parse de JSON caso a resposta seja texto ou vazia
      }

      // Se a Management API já confirmou que o projeto está ACTIVE_HEALTHY e a chamada operacional retornou 401 (devido a anon key no OpenAPI root), consideramos a infraestrutura READY
      if (res.status === 401 && mgmtStatus === 'ACTIVE_HEALTHY') {
        const result = classifySupabaseStatus({ statusCode: 200 });
        return NextResponse.json({
          state: result.state,
          status: 'ok',
          isReady: result.isReady,
          isPaused: result.isPaused,
          statusCode: 200,
          reason: 'READY: Supabase ativo (confirmado via Management API)',
          checkedAt: result.checkedAt,
        });
      }

      const result = classifySupabaseStatus({
        statusCode: res.status,
        responseBody: bodyData,
      });

      return NextResponse.json({
        state: result.state,
        status: result.isReady ? 'ok' : (result.isPaused ? 'paused' : result.state.toLowerCase()),
        isReady: result.isReady,
        isPaused: result.isPaused,
        statusCode: res.status,
        reason: result.reason,
        checkedAt: result.checkedAt,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);

      const result = classifySupabaseStatus({
        errorName: fetchErr.name,
        errorMessage: fetchErr.message,
      });

      return NextResponse.json({
        state: result.state,
        status: result.isPaused ? 'paused' : result.state.toLowerCase(),
        isReady: result.isReady,
        isPaused: result.isPaused,
        reason: result.reason,
        checkedAt: result.checkedAt,
      });
    }
  } catch (err: any) {
    const result = classifySupabaseStatus({
      errorMessage: err?.message || String(err),
    });

    return NextResponse.json({
      state: result.state,
      status: 'error',
      isReady: false,
      isPaused: false,
      error: err?.message || String(err),
      checkedAt: result.checkedAt,
    });
  }
}
