import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProviderFactory } from './core/factory/provider-factory.js';
import { HybridRetriever } from './core/hybrid-retriever.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueryPlan {
  type: 'SIMPLE_SEARCH' | 'PROJECT_TECHNOLOGY_SEARCH' | 'MULTI_PROJECT_SEARCH' | 'LIST_PROJECTS'; // Add more types as needed
  payload: any; // Specific data for the plan type
}

// --- Validação de Variáveis de Ambiente ---
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME) {
  throw new Error('Uma ou mais variáveis de ambiente essenciais (Supabase) não estão definidas.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Variáveis Globais ---
let vectorStore: FaissStore;
let hybridRetriever: HybridRetriever;

const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackErrorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(fallbackErrorMsg));
    }, timeoutMs);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// --- Funções Auxiliares ---
async function downloadIndexFromSupabase(): Promise<boolean> {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('[INIT] Índice FAISS já existe localmente em /tmp. Pulando download.');
    return true;
  }

  // Verifica se existe o índice salvo localmente no repositório como fallback
  const localFallbackDirs = [
    path.join(process.cwd(), 'faiss_index'),
    path.join(process.cwd(), 'src/faiss_index'),
    path.join(__dirname, '../faiss_index'),
    path.join(__dirname, './faiss_index')
  ];

  for (const fallbackDir of localFallbackDirs) {
    if (fs.existsSync(fallbackDir) && fs.readdirSync(fallbackDir).length > 0) {
      console.log(`[INIT] Encontrado índice FAISS local em: ${fallbackDir}. Copiando para ${FAISS_INDEX_PATH}...`);
      fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });
      for (const file of fs.readdirSync(fallbackDir)) {
        const srcFile = path.join(fallbackDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, path.join(FAISS_INDEX_PATH, file));
        }
      }
      console.log('[INIT] ✓ Índice FAISS local copiado com sucesso.');
      return true;
    }
  }

  console.log(`[INIT] Tentando download do bucket Supabase: ${SUPABASE_BUCKET_NAME}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  try {
    const listPromise = supabase.storage.from(SUPABASE_BUCKET_NAME).list();
    const { data: files, error } = await withTimeout(listPromise, 3500, 'Timeout ao conectar com Supabase Storage (3.5s)');
    if (error) throw new Error(`Não foi possível listar arquivos: ${error.message}`);
    if (!files || files.length === 0) {
      throw new Error(`Nenhum arquivo encontrado no bucket '${SUPABASE_BUCKET_NAME}'.`);
    }

    for (const file of files) {
      const downloadPromise = supabase.storage.from(SUPABASE_BUCKET_NAME).download(file.name);
      const { data: blob, error: downloadError } = await withTimeout(downloadPromise, 3500, `Timeout no download de ${file.name}`);
      if (downloadError) throw new Error(`Erro no download de ${file.name}: ${downloadError.message}`);
      if (blob) {
        fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), Buffer.from(await blob.arrayBuffer()));
        console.log(`[INIT] ✓ Arquivo salvo: ${file.name}`);
      }
    }
    return true;
  } catch (err: any) {
    console.warn(`[INIT] Falha ou timeout no download do Supabase: ${err.message}`);
    return false;
  }
}

/**
 * Detecta se a consulta do usuário é um pedido de listagem de projetos.
 * @param query A pergunta do usuário.
 * @returns `true` se for uma consulta de listagem, `false` caso contrário.
 */
function detectListQuery(query: string): boolean {
  const lowerCaseQuery = query.toLowerCase();
  const keywords = ['listar', 'liste', 'quais', 'todos', 'projetos', 'disponíveis'];
  // Se a consulta contiver pelo menos 2 das palavras-chave, consideramos uma listagem.
  const matches = keywords.filter(kw => lowerCaseQuery.includes(kw)).length;
  return matches >= 2;
}

/**
 * Expande a consulta do usuário com sinônimos para melhorar a busca.
 * @param query A pergunta original do usuário.
 * @returns A pergunta expandida.
 */
function expandQuery(query: string): string {
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

/**
 * Classifica a intenção da consulta do usuário.
 * @param query A pergunta do usuário.
 * @returns A intenção classificada (e.g., 'LIST_PROJECTS', 'PROJECT_DETAILS', etc.).
 */
function classifyIntent(query: string): string {
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

// Lista de tecnologias conhecidas (Idealmente, isso seria gerado dinamicamente a partir dos seus arquivos .md)
// Adicione outras tecnologias importantes que você usa aqui.
const knownTechnologiesOriginal = [
  'Laravel', 'Lumen', 'PHP', 'Vue', 'Vue.js', 'React', 'React.js', 'JavaScript', 'TypeScript', 'Python',
  'MySQL', 'PostgreSQL', 'SQLite', 'SQL Server', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel', 'Render.com', 'Supabase',
  'Git', 'GitHub Actions', 'Jenkins', 'Bitbucket Pipelines',
  'LiveKit', 'WebRTC', 'Ollama', 'LangChain.js', 'FAISS', 'OpenAI', 'Hugging Face',
  'Next.js', 'FastAPI', 'Node.js', 'Express', // Adicionadas com base nos projetos
  // Adicione mais conforme necessário
];
const knownTechnologies = knownTechnologiesOriginal.map(tech => tech.toLowerCase()); // Converte para minúsculas para comparação

function findSyntheticProjectListDoc(store: FaissStore): Document | null {
  try {
    const docstore = store.docstore as any;
    if (docstore && docstore._docs && docstore._docs instanceof Map) {
      for (const doc of docstore._docs.values()) {
        if (doc?.metadata?.source === 'synthetic_project_list') {
          return doc;
        }
      }
    }
  } catch (err: any) {
    console.warn(`[findSyntheticProjectListDoc] Erro ao buscar no docstore: ${err.message}`);
  }
  return null;
}

function decomposeQuery(query: string): QueryPlan {
  const lowerCaseQuery = query.toLowerCase();

  // 1. Extrai TODAS as tecnologias presentes na query
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

  // Se alguma tecnologia for encontrada, a busca é direcionada para PROJECT_TECHNOLOGY_SEARCH
  if (foundTechnologies.length > 0) {
    console.log(`[QueryPlan] Intenção 'PROJECT_TECHNOLOGY_SEARCH' detectada para tecnologias: [${foundTechnologies.join(', ')}]`);
    return {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      payload: { technologies: foundTechnologies, technology: foundTechnologies[0], originalQuery: query }
    };
  }

  // 2. Apenas se NENHUMA tecnologia for encontrada, verifica triggers de listagem genérica de projetos
  const listTriggers = ['todos os projetos', 'lista completa', 'quantos projetos', 'liste os projetos', 'projetos disponíveis'];
  if (listTriggers.some(trigger => lowerCaseQuery.includes(trigger))) {
    console.log("[QueryPlan] Intenção 'LIST_PROJECTS' detectada.");
    return { type: 'LIST_PROJECTS', payload: { originalQuery: query } };
  }

  console.log(`[QueryPlan] Fallback para 'SIMPLE_SEARCH'. Query: "${lowerCaseQuery}"`);
  return {
    type: 'SIMPLE_SEARCH',
    payload: { originalQuery: query }
  };
}

/**
 * Realiza uma busca inteligente, decidindo entre a busca normal e a busca pelo documento sintético.
 * @param query A pergunta do usuário.
 * @returns Uma lista de resultados da busca com seus scores.
 */
async function smartSearch(queryPlan: QueryPlan): Promise<[Document, number][]> {
  console.log(`[SMART SEARCH] Executando plano de consulta: ${queryPlan.type}`);
  const originalQuery = queryPlan.payload.originalQuery || '';
  let results: any;

  switch (queryPlan.type) {
    case 'LIST_PROJECTS':
      console.log('[SMART SEARCH] Buscando lista de projetos sintética determinística...');
      const syntheticDoc = findSyntheticProjectListDoc(vectorStore);
      if (syntheticDoc) {
        console.log('[SMART SEARCH] ✓ Chunk sintético oficial de projetos encontrado no docstore.');
        return [[syntheticDoc, 1.0]];
      }
      console.warn('[SMART SEARCH] Chunk sintético não encontrado no docstore. Recorrendo à busca híbrida.');
      return await hybridRetriever.search(originalQuery, 10);

    case 'PROJECT_TECHNOLOGY_SEARCH':
      const targetTechnologies: string[] = queryPlan.payload.technologies || (queryPlan.payload.technology ? [queryPlan.payload.technology] : []);
      console.log(`[SMART SEARCH] Executando busca por METADATOS / VETORIAL para tecnologias: [${targetTechnologies.join(', ')}]`);

      const filterFunction = (doc: Document) => {
        const docTechs = doc.metadata?.technologies;
        if (!docTechs || !Array.isArray(docTechs)) {
          return false;
        }

        const match = targetTechnologies.some(target =>
          docTechs.some((t: string) => typeof t === 'string' && t.toLowerCase() === target.toLowerCase())
        );
        console.log(`[Filter] Chunk: ${doc.metadata?.project_name || doc.metadata?.source} | Tecnologias: [${docTechs.join(', ')}] | Busca por: [${targetTechnologies.join(', ')}] | Match: ${match}`);
        return match;
      };

      try {
        results = await vectorStore.similaritySearch(
          `projetos com ${targetTechnologies.join(' ')}`,
          30,
          filterFunction
        );
        console.log(`[SMART SEARCH] Filtro por metadados para [${targetTechnologies.join(', ')}] encontrou ${results.length} chunks.`);
        if (results.length > 0) {
          return results.map((doc: Document) => [doc, 1.0]);
        }
        console.warn(`[SMART SEARCH] Busca por metadados retornou 0 resultados. Tentando busca híbrida como fallback...`);
        return await hybridRetriever.search(originalQuery || `projetos ${targetTechnologies.join(' ')}`, 20);
      } catch (err: any) {
        console.warn(`[SMART SEARCH] Busca por metadados para '${targetTechnologies.join(', ')}' falhou (${err.message}). Utilizando busca híbrida.`);
        return await hybridRetriever.search(originalQuery || `projetos ${targetTechnologies.join(' ')}`, 20);
      }

    case 'SIMPLE_SEARCH':
    default:
      const intent = classifyIntent(originalQuery);
      console.log(`[SMART SEARCH] Intenção classificada como: ${intent}`);

      switch (intent) {
        case 'PROJECT_DETAILS':
          console.log('[SMART SEARCH] Executando busca por detalhes de projeto...');
          return await hybridRetriever.search(originalQuery, 5);

        case 'TECH_QUESTION':
          console.log('[SMART SEARCH] Executando busca por tecnologia (via intent)...');
          const expandedQuery = expandQuery(originalQuery);
          console.log(`[SMART SEARCH] Query expandida: "${expandedQuery}"`);
          return await hybridRetriever.search(expandedQuery, 5);

        case 'GENERAL':
        default:
          console.log('[SMART SEARCH] Executando busca geral...');
          return await hybridRetriever.search(originalQuery, 5);
      }
  }
}

function validateFaissManifest(manifestPath: string, activeEmbeddingProvider: any) {
  if (!fs.existsSync(manifestPath)) {
    console.warn(`[INIT] manifest.json não encontrado em ${manifestPath}. Ignorando validação estrita.`);
    return;
  }
  try {
    const rawContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawContent);
    const embeddingInfo = manifest.embedding;

    if (embeddingInfo) {
      const { provider, model, dimension } = embeddingInfo;
      if (
        provider !== activeEmbeddingProvider.name ||
        dimension !== activeEmbeddingProvider.dimension
      ) {
        throw new Error(
          `\n======================================================================\n` +
          `❌ FAISS embedding configuration mismatch!\n\n` +
          `Index manifest:\n` +
          `  provider:  ${provider}\n` +
          `  model:     ${model}\n` +
          `  dimension: ${dimension}\n\n` +
          `Current active provider:\n` +
          `  provider:  ${activeEmbeddingProvider.name}\n` +
          `  model:     ${activeEmbeddingProvider.modelName}\n` +
          `  dimension: ${activeEmbeddingProvider.dimension}\n\n` +
          `Rebuild the FAISS index before starting the application:\n` +
          `  npm run build-index -- --yes\n` +
          `======================================================================\n`
        );
      }
      console.log(`[INIT] ✓ Manifest do índice FAISS validado com sucesso (Provider: ${provider}, Model: ${model}, Dim: ${dimension}).`);
    }
  } catch (err: any) {
    if (err.message.includes('FAISS embedding configuration mismatch')) {
      throw err;
    }
    console.warn(`[INIT] Aviso ao ler manifest.json: ${err.message}`);
  }
}

// --- Função Principal de Inicialização ---
let isIndexLoaded = false;

async function loadIndexAndRetriever(): Promise<boolean> {
  if (isIndexLoaded) return true;
  try {
    const downloaded = await downloadIndexFromSupabase();
    if (!downloaded && (!fs.existsSync(FAISS_INDEX_PATH) || fs.readdirSync(FAISS_INDEX_PATH).length === 0)) {
      console.warn('[INIT] Não foi possível carregar o índice FAISS do Supabase e nenhum índice local existe.');
      isIndexLoaded = false;
      return false;
    }

    const embeddingProvider = ProviderFactory.getEmbeddingProvider();
    const manifestPath = path.join(FAISS_INDEX_PATH, 'manifest.json');
    validateFaissManifest(manifestPath, embeddingProvider);

    console.log(`[INIT] Carregando índice FAISS para a memória com o provedor '${embeddingProvider.name}'...`);
    vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddingProvider.getLangChainEmbeddings());
    console.log('[INIT] Índice FAISS carregado com sucesso.');

    console.log('[INIT] Carregando documentos para o retriever híbrido...');
    const loader = new DirectoryLoader(path.join(process.cwd(), 'src/knowledge-base'), { '.md': (p: string) => new TextLoader(p) });
    const docs = await loader.load();
    hybridRetriever = new HybridRetriever(vectorStore, docs);
    console.log('[INIT] Retriever híbrido inicializado com sucesso.');
    isIndexLoaded = true;
    return true;
  } catch (err: any) {
    console.warn(`[INIT] Erro ao carregar o índice FAISS / Retriever: ${err.message}`);
    isIndexLoaded = false;
    return false;
  }
}

// --- Função Principal de Inicialização ---
async function main() {
  const app = express();
  const port = Number(process.env.PORT) || 3001;
  app.use(cors());
  app.use(express.json());

  // Inicia o servidor HTTP IMEDIATAMENTE para que Render e Vercel recebam resposta na porta sem estagnar
  app.listen(port, '0.0.0.0', () => {
    console.log(`[server]: Backend rodando em http://0.0.0.0:${port}`);
  });

  // Tenta carregar o índice em segundo plano sem bloquear a porta 3001
  loadIndexAndRetriever().catch(err => {
    console.warn('[INIT] Aviso no carregamento assíncrono do índice:', err.message);
  });

  app.get('/api/health', async (req: Request, res: Response) => {
    let isSupabasePaused = false;
    try {
      const listPromise = supabase.storage.from(SUPABASE_BUCKET_NAME).list('', { limit: 1 });
      const { error } = await withTimeout(listPromise, 2500, 'Supabase health timeout (2.5s)');
      if (error) {
        const errMsg = error.message.toLowerCase();
        isSupabasePaused = errMsg.includes('fetch failed') || errMsg.includes('nxdomain') || errMsg.includes('enotfound') || errMsg.includes('paused');
      }
    } catch {
      isSupabasePaused = true;
    }
    res.status(200).json({ status: 'ok', isSupabasePaused, isIndexLoaded });
  });

  app.get('/api/supabase/status', async (req: Request, res: Response) => {
    try {
      const listPromise = supabase.storage.from(SUPABASE_BUCKET_NAME).list('', { limit: 1 });
      const { error } = await withTimeout(listPromise, 2500, 'Supabase status timeout (2.5s)');
      if (error) {
        const errMsg = error.message.toLowerCase();
        const isPaused = errMsg.includes('fetch failed') || errMsg.includes('nxdomain') || errMsg.includes('enotfound') || errMsg.includes('paused') || errMsg.includes('500') || errMsg.includes('503') || errMsg.includes('timeout');
        return res.status(200).json({
          status: isPaused ? 'paused' : 'error',
          isPaused,
          isIndexLoaded,
          error: error.message,
          supabaseUrl: SUPABASE_URL
        });
      }
      return res.status(200).json({ status: 'ok', isPaused: false, isIndexLoaded });
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase();
      const isPaused = errMsg.includes('fetch failed') || errMsg.includes('nxdomain') || errMsg.includes('enotfound') || errMsg.includes('paused') || errMsg.includes('500') || errMsg.includes('503') || errMsg.includes('timeout');
      return res.status(200).json({
        status: isPaused ? 'paused' : 'error',
        isPaused: true,
        isIndexLoaded,
        error: err?.message || 'Falha de conexão com o Supabase'
      });
    }
  });

  app.post('/api/supabase/restore', async (req: Request, res: Response) => {
    const projectRef = process.env.SUPABASE_PROJECT_REF || (SUPABASE_URL ? SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0] : '');
    const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN;

    if (!managementToken || !projectRef) {
      return res.status(200).json({
        success: false,
        status: 'manual_required',
        projectRef,
        dashboardUrl: projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : 'https://supabase.com/dashboard',
        message: 'Token de gerenciamento do Supabase (SUPABASE_MANAGEMENT_TOKEN) não configurado no backend. Acesse o Dashboard para descongelar manualmente.'
      });
    }

    try {
      console.log(`[SUPABASE RESTORE] Solicitando restauração do projeto ref: ${projectRef} via Management API...`);
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok || response.status === 201 || response.status === 202) {
        console.log(`[SUPABASE RESTORE] ✓ Restauração solicitada com sucesso para o projeto ${projectRef}.`);
        return res.status(200).json({
          success: true,
          status: 'restoring',
          projectRef,
          message: 'Restauração do Supabase disparada com sucesso! Aguarde cerca de 60-90 segundos.'
        });
      }

      const errText = await response.text();
      console.warn(`[SUPABASE RESTORE] Erro da Management API (${response.status}): ${errText}`);
      return res.status(200).json({
        success: false,
        status: 'manual_required',
        projectRef,
        dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}`,
        message: `A API do Supabase retornou erro (${response.status}). Acesse o Dashboard para descongelar manualmente.`
      });
    } catch (err: any) {
      console.error(`[SUPABASE RESTORE] Falha na requisição para Management API:`, err);
      return res.status(200).json({
        success: false,
        status: 'manual_required',
        projectRef,
        dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}`,
        message: `Falha de rede ao chamar a Management API do Supabase. Acesse o Dashboard para descongelar manualmente.`
      });
    }
  });

  /**
 * Agrupa e formata os chunks recuperados em um contexto estruturado por projeto.
 * @param retrievedChunks Um array de tuplas [Document, score] recuperados da busca.
 * @returns Uma string formatada e legível para o LLM.
 */
function assembleStructuredContext(retrievedChunks: [Document, number][]): string {
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
      const source = doc.metadata.source?.split('/').pop() || 'Fonte desconhecida';

      structuredOutput += `  - ${sectionHeader}
`;
      structuredOutput += `    ${doc.pageContent.trim()}\n\n`;
    }
    structuredOutput += '\n';
  }

  return structuredOutput.trim();
}

/**
 * Garante que o total acumulado de tokens nos chunks não exceda o orçamento máximo.
 * Estima a contagem de tokens dividindo o número total de caracteres por 4 (~4 chars/token).
 */
function pruneChunksToTokenBudget(
  chunks: [Document, number][],
  maxTokens: number = 2800
): [Document, number][] {
  let estimatedTokens = 0;
  const pruned: [Document, number][] = [];

  for (const item of chunks) {
    const doc = item[0];
    const chunkTokens = Math.ceil(doc.pageContent.length / 4);
    if (estimatedTokens + chunkTokens > maxTokens && pruned.length > 0) {
      console.warn(
        `[TOKEN BUDGET] Orçamento de ${maxTokens} tokens atingido (${estimatedTokens} est.). Injetando ${pruned.length} de ${chunks.length} chunks.`
      );
      break;
    }
    estimatedTokens += chunkTokens;
    pruned.push(item);
  }

  return pruned;
}

/**
 * Filtro de Diversidade (Post-Retrieval Deduplication)
 * Previne o "Monopólio de Chunks" agrupando por `metadata.project_name`
 * e limitando a quantidade de chunks por projeto, priorizando resumos técnicos.
 *
 * @param chunks Tuplas de [Document, number] retornadas da busca.
 * @param maxUniqueProjects Número máximo de projetos únicos no resultado (padrão: 6).
 * @param maxChunksPerProject Máximo de chunks por projeto (padrão: 2).
 * @returns Array de chunks filtrados por diversidade de projetos.
 */
function applyDiversityFilter(
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

  for (const [projectName, projectChunks] of projectGroups.entries()) {
    if (uniqueProjectsCount >= maxUniqueProjects) {
      break;
    }

    // Ordenar chunks do mesmo projeto dando prioridade para RESUMO TÉCNICO ou cabeçalhos principais
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

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      if (!isIndexLoaded) {
        console.log('[API] Índice não carregado em memória. Tentando carregar em runtime...');
        const loaded = await loadIndexAndRetriever();
        if (!loaded) {
          return res.status(503).json({
            error: 'O banco de dados / armazenamento no Supabase está temporariamente pausado.',
            code: 'SUPABASE_PAUSED',
            isSupabasePaused: true
          });
        }
      }

      const { messages, message, question: bodyQuestion } = req.body;
      let question: string | undefined;

      if (Array.isArray(messages) && messages.length > 0) {
        const last = messages[messages.length - 1];
        question = typeof last === 'string' ? last : (last?.content || last?.message);
      } else if (typeof message === 'string') {
        question = message;
      } else if (typeof bodyQuestion === 'string') {
        question = bodyQuestion;
      }

      if (!question || !question.trim()) {
        return res.status(400).json({ error: 'A pergunta está vazia.' });
      }

      console.log(`[API] Pergunta recebida: "${question}"`);

      const queryPlan = decomposeQuery(question);
      console.log(`[API] Plano de consulta gerado: ${queryPlan.type}`);

      const searchResults = await smartSearch(queryPlan);

      let topResults: [Document, number][];

      if (queryPlan.type === 'LIST_PROJECTS') {
        console.log('[API] Plano LIST_PROJECTS: Retornando apenas o chunk sintético oficial (Top-K=1).');
        topResults = searchResults.slice(0, 1);
      } else if (queryPlan.type === 'PROJECT_TECHNOLOGY_SEARCH') {
        console.log('[API] Plano PROJECT_TECHNOLOGY_SEARCH: Aplicando Filtro de Diversidade (Post-Retrieval Deduplication)...');
        const sortedChunks = searchResults.sort((a, b) => b[1] - a[1]);
        topResults = applyDiversityFilter(sortedChunks, 6, 1);
        console.log(`[API] Filtro de diversidade selecionou ${topResults.length} chunks de projetos variados.`);
      } else {
        console.log(`[API] Plano ${queryPlan.type}: Aplicando re-ranking e limitando a Top-K=5.`);
        topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 5);
      }

      // Aplica a guarda de orçamento defensivo de tokens (~2800 tokens max)
      topResults = pruneChunksToTokenBudget(topResults, 2800);

      const structuredContext = assembleStructuredContext(topResults);

      console.log(`================ CONTEXTO ESTRUTURADO PARA A IA (TOP ${topResults.length}) ================\n`);
      console.log(structuredContext);
      console.log("=======================================================================");

      const systemPrompt = `Você é um assistente especialista na carreira de Luis Fernando Richter e atua de forma direta, profissional e precisa.

REGRAS OBRIGATÓRIAS E INEGOCIÁVEIS:
1. IDIOMA / LANGUAGE ALIGNMENT: Responda SEMPRE no mesmo idioma da pergunta do usuário (Answer ALWAYS in the exact same language as the user's message). Se a pergunta for em Inglês, responda em Inglês. Se for em Português, responda em Português. Se for em Espanhol, responda em Espanhol. O idioma da mensagem do usuário tem prioridade absoluta sobre o idioma do contexto recuperado. O contexto recuperado serve exclusivamente como fonte de evidência factual.
2. FONTE DA VERDADE: Use APENAS o contexto fornecido pelo usuário. NUNCA use seu conhecimento prévio. NUNCA faça inferências ou suposições.
3. DESAMBIGUAÇÃO CRÍTICA: Quando questionado sobre "projetos", refira-se ESTRITAMENTE a "Projetos de Software" (sistemas, aplicações desenvolvidas). Cursos, Treinamentos e Certificações NÃO SÃO projetos de software e NUNCA devem ser listados.
4. AUSÊNCIA DE DADOS: Se a resposta não estiver no contexto exato, informe no mesmo idioma da pergunta do usuário que não possui os detalhes no momento (ex em PT: "Com base nas informações que recuperei no momento, não tenho os detalhes para responder a essa pergunta." | em EN: "Based on the retrieved information, I do not have the details to answer this question."). NÃO invente.
5. FORMATAÇÃO: Ao listar projetos, SEMPRE use o formato: "* Projeto: [Nome] - [Descrição/Tecnologias]".
6. LIMITE DE CARGA COGNITIVA (PAGINAÇÃO): Se o contexto retornar uma lista longa (mais de 7 projetos), NUNCA liste todos de uma vez. Escolha e liste apenas os 7 mais relevantes. Ao final da lista, adicione OBRIGATORIAMENTE uma frase no idioma da pergunta convidando o usuário a explorar o restante.`;

      const userMessage = `CONTEXTO RECUPERADO DO BANCO DE DADOS:
      ${structuredContext}

      PERGUNTA DO USUÁRIO:
      ${question}

      RESPOSTA (seguindo rigorosamente as regras do sistema):`;

      console.log("=== CONTEXTO RECUPERADO DO FAISS ===");
      console.log(structuredContext);
      console.log("====================================");

      const llmProvider = ProviderFactory.getLLMProvider();
      console.log(`[API] Roteando para o provedor de IA: ${llmProvider.name}`);

      const responseText = await llmProvider.generate(systemPrompt, userMessage);

      console.log(`[API] Resposta recebida do ${llmProvider.name} com sucesso.`);
      res.json({ answer: responseText });

    } catch (error: any) {
      console.error('[ERRO DETALHADO]', error.message || error);
      const is503 = error?.status === 503 || error?.code === 'SERVICE_UNAVAILABLE' || error?.code === 'ALL_PROVIDERS_FAILED' || error?.code === 'SUPABASE_PAUSED';
      if (is503) {
        return res.status(503).json({
          error: 'AI service or database temporarily unavailable. Please try again.',
          code: 'SUPABASE_PAUSED',
          isSupabasePaused: true
        });
      }
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
  });
}

main().catch(error => {
  console.error("Falha fatal ao iniciar o servidor:", error);
  process.exit(1);
});
