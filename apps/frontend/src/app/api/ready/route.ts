import { NextResponse } from 'next/server';
import { TSVectorStore } from '@/lib/rag/ts-vector-store';
import { classifySupabaseStatus } from '@/lib/supabase/status-classifier';

export async function GET() {
  try {
    const vectorStore = new TSVectorStore();
    await vectorStore.initialize();
    const docs = vectorStore.getDocuments();

    if (!docs || docs.length === 0) {
      return NextResponse.json(
        {
          ready: false,
          state: 'UNAVAILABLE',
          isPaused: false,
          reason: 'INDEX_NOT_LOADED',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ready: true,
      state: 'READY',
      status: 'ok',
      totalChunks: docs.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const classified = classifySupabaseStatus({
      errorName: err?.name,
      errorMessage: err?.message || String(err)
    });

    return NextResponse.json(
      {
        ready: false,
        state: classified.state,
        isPaused: classified.isPaused,
        reason: classified.reason,
        error: err?.message || String(err),
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
