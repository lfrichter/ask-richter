import { TSVectorStore } from './ts-vector-store';
import {
  ServerlessHybridRetriever,
  decomposeQuery,
  applyDiversityFilter,
  pruneChunksToTokenBudget,
  assembleStructuredContext
} from './hybrid-retriever';
import assert from 'node:assert';
import test from 'node:test';

test('TSVectorStore - Cosine Similarity test', () => {
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  const vecC = [0, 1, 0];

  assert.strictEqual(TSVectorStore.cosineSimilarity(vecA, vecB), 1);
  assert.strictEqual(TSVectorStore.cosineSimilarity(vecA, vecC), 0);
});

test('Query decomposition test', () => {
  const planPython = decomposeQuery('Quais os projetos em Python?');
  assert.strictEqual(planPython.type, 'PROJECT_TECHNOLOGY_SEARCH');
  assert.ok(planPython.payload.technologies?.includes('Python'));

  const planList = decomposeQuery('quais todos os projetos disponíveis?');
  assert.strictEqual(planList.type, 'LIST_PROJECTS');
});

test('Token Budgeting test', () => {
  const sampleDocs = [
    [{ pageContent: 'A'.repeat(4000), metadata: { project_name: 'P1' } }, 0.9],
    [{ pageContent: 'B'.repeat(4000), metadata: { project_name: 'P2' } }, 0.8],
    [{ pageContent: 'C'.repeat(4000), metadata: { project_name: 'P3' } }, 0.7],
  ] as any;

  const pruned = pruneChunksToTokenBudget(sampleDocs, 2400);
  assert.strictEqual(pruned.length, 2);
});
