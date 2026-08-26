import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback de desenvolvimento local: tenta carregar do apps/backend/.env ou root .env se não estiver no env do frontend
    if (!supabaseUrl || !supabaseKey) {
      const candidatePaths = [
        path.join(process.cwd(), 'apps/backend/.env'),
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '../backend/.env')
      ];

      for (const envPath of candidatePaths) {
        if (fs.existsSync(envPath)) {
          const envConfig = dotenv.parse(fs.readFileSync(envPath));
          supabaseUrl = supabaseUrl || envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
          supabaseKey = supabaseKey || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;
          if (supabaseUrl && supabaseKey) break;
        }
      }
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        isPaused: false,
        status: 'ok',
        reason: 'SUPABASE_ENV_MISSING'
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
        headers: { apikey: supabaseKey },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 503 || res.status === 504 || res.status === 502) {
        return NextResponse.json({ isPaused: true, status: 'paused', statusCode: res.status });
      }

      return NextResponse.json({ isPaused: false, status: 'ok', statusCode: res.status });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ isPaused: true, status: 'paused', reason: 'TIMEOUT' });
      }
      return NextResponse.json({ isPaused: true, status: 'paused', reason: fetchErr.message });
    }
  } catch (err: any) {
    return NextResponse.json({ isPaused: false, status: 'error', error: err?.message || String(err) });
  }
}
