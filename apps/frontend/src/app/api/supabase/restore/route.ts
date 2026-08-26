import { NextResponse } from 'next/server';
import { executeSupabaseRestore } from '@/lib/supabase/restore-service';

export async function POST() {
  try {
    const result = await executeSupabaseRestore();
    
    // Retorna HTTP 200 com a resposta sanitizada
    return NextResponse.json(result, {
      status: result.success ? 200 : (result.state === 'AUTH_ERROR' ? 401 : result.state === 'NOT_FOUND' ? 404 : result.state === 'RATE_LIMITED' ? 429 : 503)
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        state: 'UNKNOWN',
        status: 'error',
        message: err?.message || 'Erro interno ao processar restauração.',
        checkedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Bloqueia métodos não permitidos (ex: GET)
export async function GET() {
  return NextResponse.json(
    { error: 'Método GET não permitido. Use POST para acionar a restauração.' },
    { status: 405 }
  );
}
