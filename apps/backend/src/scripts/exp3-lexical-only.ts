import natural from 'natural';
import { SimpleTfIdf } from '../../../frontend/src/lib/rag/hybrid-retriever.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runExp3() {
  console.log('=== EXPERIMENTO 3: COMPARAÇÃO ISOLADA LEXICAL (LEGADO NAIVE BAYES VS NOVO SIMPLE TF-IDF) ===\n');

  const docstorePath = path.resolve(__dirname, '../faiss_index/docstore.json');
  const rawDocstore = JSON.parse(fs.readFileSync(docstorePath, 'utf-8'));
  const items = Array.isArray(rawDocstore[0]) && Array.isArray(rawDocstore[0][0]) ? rawDocstore[0] : rawDocstore;
  const docs = items.map((item: any) => ({
    id: item[0],
    pageContent: item[1].pageContent,
    metadata: item[1].metadata
  }));

  // 1. Legado: natural.BayesClassifier
  const bayes = new natural.BayesClassifier();
  docs.forEach((doc: any, i: number) => {
    bayes.addDocument(doc.pageContent, i.toString());
  });
  bayes.train();

  // 2. Novo: SimpleTfIdf
  const tfidf = new SimpleTfIdf();
  docs.forEach((doc: any) => {
    tfidf.addDocument(doc.pageContent);
  });

  const testQueries = [
    'Quais os projetos em Python?',
    'Qual a experiência com Laravel e PHP?',
    'Quais projetos envolvem Inteligência Artificial?',
    'Quais são todos os projetos disponíveis?',
    'Experiência com React e Vue.js'
  ];

  let totalOverlapTop1 = 0;
  let totalOverlapTop3 = 0;
  let totalOverlapTop5 = 0;

  for (const query of testQueries) {
    console.log(`--------------------------------------------------`);
    console.log(`QUERY: "${query}"`);
    console.log(`--------------------------------------------------`);

    // Legado Bayes
    const bayesResults = bayes.getClassifications(query)
      .slice(0, 5)
      .map(c => {
        const idx = parseInt(c.label, 10);
        return docs[idx];
      });

    // Novo TF-IDF
    const tfidfScores = tfidf.score(query, docs.length);
    const scoredDocs = tfidfScores.map((score, idx) => ({ doc: docs[idx], score }));
    scoredDocs.sort((a, b) => b.score - a.score);
    const tfidfResults = scoredDocs.slice(0, 5).map(s => s.doc);

    const bayesHeaders = bayesResults.map(d => d?.metadata?.section_header || d?.pageContent.slice(0, 35).replace(/\n/g, ' '));
    const tfidfHeaders = tfidfResults.map(d => d?.metadata?.section_header || d?.pageContent.slice(0, 35).replace(/\n/g, ' '));

    console.log(`[LEGADO NaiveBayes] Top-1: "${bayesHeaders[0]}"`);
    console.log(`[NOVO SimpleTfIdf]  Top-1: "${tfidfHeaders[0]}"`);

    const overlap1 = bayesHeaders[0] === tfidfHeaders[0] ? 1 : 0;
    const overlap3 = bayesHeaders.slice(0, 3).filter(h => tfidfHeaders.slice(0, 3).includes(h)).length;
    const overlap5 = bayesHeaders.slice(0, 5).filter(h => tfidfHeaders.slice(0, 5).includes(h)).length;

    totalOverlapTop1 += overlap1;
    totalOverlapTop3 += overlap3;
    totalOverlapTop5 += overlap5;

    console.log(`[METRICAS LEXICAS] Overlap Top-1: ${overlap1}/1 | Top-3: ${overlap3}/3 | Top-5: ${overlap5}/5\n`);
  }

  const numQueries = testQueries.length;
  console.log(`==================================================`);
  console.log(`RESULTADO FINAL EXPERIMENTO 3 (NAIVE BAYES VS TF-IDF APENAS LEXICO):`);
  console.log(`- Overlap Top-1 Médio: ${(totalOverlapTop1 / numQueries * 100).toFixed(1)}%`);
  console.log(`- Overlap Top-3 Médio: ${(totalOverlapTop3 / (numQueries * 3) * 100).toFixed(1)}%`);
  console.log(`- Overlap Top-5 Médio: ${(totalOverlapTop5 / (numQueries * 5) * 100).toFixed(1)}%`);
  console.log(`==================================================\n`);
}

runExp3().catch(console.error);
