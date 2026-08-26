import { NextResponse } from 'next/server';
import { TSVectorStore } from '@/lib/rag/ts-vector-store';

export async function GET() {
  try {
    const vectorStore = new TSVectorStore();
    await vectorStore.initialize();
    const docs = vectorStore.getDocuments();

    if (!docs || docs.length === 0) {
      return NextResponse.json(
        { ready: false, reason: 'INDEX_NOT_LOADED' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ready: true,
      status: 'ok',
      totalChunks: docs.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { ready: false, reason: 'SUPABASE_UNAVAILABLE', error: err?.message || String(err) },
      { status: 503 }
    );
  }
}
