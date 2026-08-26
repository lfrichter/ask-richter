import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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
