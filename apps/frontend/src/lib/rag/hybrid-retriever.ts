import { TSVectorStore, Document } from './ts-vector-store';

export interface QueryPlan {
  type: 'LIST_PROJECTS' | 'PROJECT_TECHNOLOGY_SEARCH' | 'SIMPLE_SEARCH';
  payload: {
    technologies?: string[];
    technology?: string;
    originalQuery?: string;
  };
}

const knownTechnologiesOriginal = [
  'Laravel', 'Lumen', 'PHP', 'Vue', 'Vue.js', 'React', 'React.js', 'JavaScript', 'TypeScript', 'Python',
  'MySQL', 'PostgreSQL', 'SQLite', 'SQL Server', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel', 'Render.com', 'Supabase',
  'Git', 'GitHub Actions', 'Jenkins', 'Bitbucket Pipelines',
  'LiveKit', 'WebRTC', 'Ollama', 'LangChain.js', 'FAISS', 'OpenAI', 'Hugging Face',
  'Next.js', 'FastAPI', 'Node.js', 'Express',
];
const knownTechnologies = knownTechnologiesOriginal.map(tech => tech.toLowerCase());

export function detectListQuery(query: string): boolean {
  const lowerCaseQuery = query.toLowerCase();
  const keywords = ['listar', 'liste', 'quais', 'todos', 'projetos', 'disponíveis'];
  const matches = keywords.filter(kw => lowerCaseQuery.includes(kw)).length;
  return matches >= 2;
}

export function expandQuery(query: string): string {
  const lowerCaseQuery = query.toLowerCase();
  const expansions = {
    tecnologias: ['stack', 'framework', 'biblioteca', 'linguagem', 'ferramenta'],
    experiência: ['trabalho', 'cargo', 'função', 'empresa'],
    projetos: ['realizações', 'trabalhos', 'exemplos'],
  };

  let expandedQuery = query;
  for (const keyword in expansions) {
    if (lowerCaseQuery.includes(keyword)) {
      expandedQuery += ' ' + expansions[keyword as keyof typeof expansions].join(' ');
    }
  }
  return expandedQuery;
}

export function classifyIntent(query: string): string {
  const lowerCaseQuery = query.toLowerCase();
  if (detectListQuery(query)) {
    return 'LIST_PROJECTS';
  }
  if (lowerCaseQuery.includes('detalhes sobre') || lowerCaseQuery.includes('me fale sobre')) {
    return 'PROJECT_DETAILS';
  }
  if (lowerCaseQuery.includes('tecnologia') || lowerCaseQuery.includes('stack')) {
    return 'TECH_QUESTION';
  }
  return 'GENERAL';
}

export function decomposeQuery(query: string): QueryPlan {
  const lowerCaseQuery = query.toLowerCase();
  const foundTechnologies: string[] = [];

  for (let i = 0; i < knownTechnologies.length; i++) {
    const tech = knownTechnologies[i];
    if (!tech) continue;
    const techRegex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
    if (techRegex.test(lowerCaseQuery)) {
      const canonicalTech = tech === 'vue' ? 'vue.js' : (knownTechnologiesOriginal[i] ?? tech);
      if (!foundTechnologies.some(t => t.toLowerCase() === canonicalTech.toLowerCase())) {
        foundTechnologies.push(canonicalTech);
      }
    }
  }

  if (foundTechnologies.length > 0) {
    return {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      payload: { technologies: foundTechnologies, technology: foundTechnologies[0], originalQuery: query }
    };
  }

  const listTriggers = ['todos os projetos', 'lista completa', 'quantos projetos', 'liste os projetos', 'projetos disponíveis'];
  if (listTriggers.some(trigger => lowerCaseQuery.includes(trigger))) {
    return { type: 'LIST_PROJECTS', payload: { originalQuery: query } };
  }

  return {
    type: 'SIMPLE_SEARCH',
    payload: { originalQuery: query }
  };
}

export class SimpleTfIdf {
  private docTokens: string[][] = [];

  public addDocument(text: string): void {
    const tokens = this.tokenize(text);
    this.docTokens.push(tokens);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
  }

  public score(queryText: string, docCount: number): number[] {
    const queryTokens = this.tokenize(queryText);
    if (queryTokens.length === 0) return new Array(docCount).fill(0);

    return this.docTokens.map((docTokens) => {
      let score = 0;
      const docLen = docTokens.length || 1;
      for (const token of queryTokens) {
        const count = docTokens.filter((t) => t === token).length;
        if (count > 0) {
          const tf = count / docLen;
          const docsWithToken = this.docTokens.filter((dt) => dt.includes(token)).length || 1;
          const idf = Math.log((docCount + 1) / docsWithToken);
          score += tf * idf;
        }
      }
      return score;
    });
  }
}

export class ServerlessHybridRetriever {
  private vectorStore: TSVectorStore;
  private tfidf: SimpleTfIdf;
  private documents: Document[] = [];

  constructor(vectorStore: TSVectorStore) {
    this.vectorStore = vectorStore;
    this.tfidf = new SimpleTfIdf();
  }

  public initialize(): void {
    this.documents = this.vectorStore.getDocuments();
    this.tfidf = new SimpleTfIdf();
    this.documents.forEach((doc) => {
      this.tfidf.addDocument(doc.pageContent);
    });
  }

  /**
   * Executa a busca híbrida (Similaridade Vetorial em TS + TF-IDF Léxico em TS + RRF).
   */
  public search(queryEmbedding: number[], queryText: string, k = 5): [Document, number][] {
    if (this.documents.length === 0) {
      this.initialize();
    }

    // 1. Busca Vetorial por Cosseno em TS
    const vectorResults = this.vectorStore.similaritySearch(queryEmbedding, k * 2);

    // 2. Busca Léxica TF-IDF em TS
    const scores = this.tfidf.score(queryText, this.documents.length);
    const tfidfScores: { doc: Document; score: number }[] = [];
    scores.forEach((sc, idx) => {
      if (sc > 0 && this.documents[idx]) {
        tfidfScores.push({ doc: this.documents[idx]!, score: sc });
      }
    });

    tfidfScores.sort((a, b) => b.score - a.score);
    const bm25Results = tfidfScores.slice(0, k * 2).map((item) => [item.doc, item.score] as [Document, number]);

    // 3. Fusão RRF (Reciprocal Rank Fusion)
    const rrfMap = new Map<string, { doc: Document; rrfScore: number }>();
    const RRF_CONSTANT = 60;

    vectorResults.forEach(([doc], rank) => {
      const key = doc.id || doc.pageContent;
      const rankScore = 1 / (RRF_CONSTANT + rank + 1);
      if (rrfMap.has(key)) {
        rrfMap.get(key)!.rrfScore += rankScore;
      } else {
        rrfMap.set(key, { doc, rrfScore: rankScore });
      }
    });

    bm25Results.forEach(([doc], rank) => {
      const key = doc.id || doc.pageContent;
      const rankScore = 1 / (RRF_CONSTANT + rank + 1);
      if (rrfMap.has(key)) {
        rrfMap.get(key)!.rrfScore += rankScore;
      } else {
        rrfMap.set(key, { doc, rrfScore: rankScore });
      }
    });

    const finalRanked = Array.from(rrfMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, k);

    return finalRanked.map(item => [item.doc, item.rrfScore]);
  }
}

/**
 * Filtro de Diversidade (Post-Retrieval Deduplication)
 */
export function applyDiversityFilter(
  chunks: [Document, number][],
  maxUniqueProjects: number = 6,
  maxChunksPerProject: number = 2
): [Document, number][] {
  const projectGroups = new Map<string, [Document, number][]>();

  for (const item of chunks) {
    const doc = item[0];
    const projectName = doc.metadata?.project_name || 'Outros';
    if (!projectGroups.has(projectName)) {
      projectGroups.set(projectName, []);
    }
    projectGroups.get(projectName)!.push(item);
  }

  const selectedChunks: [Document, number][] = [];
  let uniqueProjectsCount = 0;

  for (const [, projectChunks] of projectGroups.entries()) {
    if (uniqueProjectsCount >= maxUniqueProjects) {
      break;
    }

    const sortedProjectChunks = [...projectChunks].sort((a, b) => {
      const headerA = (a[0].metadata?.section_header || '').toUpperCase();
      const contentA = a[0].pageContent.toUpperCase();
      const headerB = (b[0].metadata?.section_header || '').toUpperCase();
      const contentB = b[0].pageContent.toUpperCase();

      const isPriorityA =
        headerA.includes('RESUMO TÉCNICO') ||
        contentA.includes('RESUMO TÉCNICO') ||
        headerA.includes('RESUMO') ||
        headerA.includes('VISÃO GERAL');
      const isPriorityB =
        headerB.includes('RESUMO TÉCNICO') ||
        contentB.includes('RESUMO TÉCNICO') ||
        headerB.includes('RESUMO') ||
        headerB.includes('VISÃO GERAL');

      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;

      return b[1] - a[1];
    });

    const chunksToTake = sortedProjectChunks.slice(0, maxChunksPerProject);
    selectedChunks.push(...chunksToTake);
    uniqueProjectsCount++;
  }

  return selectedChunks;
}

/**
 * Corta chunks para respeitar o orçamento de tokens.
 */
export function pruneChunksToTokenBudget(
  chunks: [Document, number][],
  maxTokens: number = 2800
): [Document, number][] {
  let estimatedTokens = 0;
  const pruned: [Document, number][] = [];

  for (const item of chunks) {
    const doc = item[0];
    const chunkTokens = Math.ceil(doc.pageContent.length / 4);
    if (estimatedTokens + chunkTokens > maxTokens && pruned.length > 0) {
      break;
    }
    estimatedTokens += chunkTokens;
    pruned.push(item);
  }

  return pruned;
}

/**
 * Agrupa e formata os chunks recuperados em um contexto estruturado por projeto.
 */
export function assembleStructuredContext(retrievedChunks: [Document, number][]): string {
  const projectsMap = new Map<string, Document[]>();

  for (const [doc] of retrievedChunks) {
    const projectName = doc.metadata.project_name || 'Outros';
    if (!projectsMap.has(projectName)) {
      projectsMap.set(projectName, []);
    }
    projectsMap.get(projectName)?.push(doc);
  }

  let structuredOutput = '';
  for (const [projectName, docs] of projectsMap.entries()) {
    if (projectName !== 'Outros') {
      structuredOutput += `PROJETO: ${projectName}\n`;
    }

    docs.sort((a, b) => (a.metadata.section_header || '').localeCompare(b.metadata.section_header || ''));

    for (const doc of docs) {
      const sectionHeader = doc.metadata.section_header || 'Seção Desconhecida';
      structuredOutput += `  - ${sectionHeader}\n`;
      structuredOutput += `    ${doc.pageContent.trim()}\n\n`;
    }
    structuredOutput += '\n';
  }

  return structuredOutput.trim();
}
