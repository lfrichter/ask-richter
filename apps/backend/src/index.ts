import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import path from 'path';
import { fileURLToPath } from 'url';
import { callHuggingFaceAPI } from './core/huggingface.js';
import { HybridRetriever } from './core/hybrid-retriever.js';
import { callOllamaAPI } from './core/ollama.js';
import { callOpenRouterAPI } from './core/openrouter.js';

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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME || !OPENAI_API_KEY) {
  throw new Error('Uma ou mais variáveis de ambiente essenciais não estão definidas.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Variáveis Globais ---
let vectorStore: FaissStore;
let hybridRetriever: HybridRetriever;

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY as string,
    modelName: 'text-embedding-3-small',
    maxRetries: 0,
    configuration: { baseURL: "https://api.openai.com/v1" }
});

const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

// --- Funções Auxiliares ---
async function downloadIndexFromSupabase() {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('[INIT] Índice FAISS já existe localmente em /tmp. Pulando download.');
    return;
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
      return;
    }
  }

  console.log(`[INIT] Tentando download do bucket Supabase: ${SUPABASE_BUCKET_NAME}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  try {
    const { data: files, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list();
    if (error) throw new Error(`Não foi possível listar arquivos: ${error.message}`);
    if (!files || files.length === 0) {
      throw new Error(`Nenhum arquivo encontrado no bucket '${SUPABASE_BUCKET_NAME}'.`);
    }

    for (const file of files) {
      const { data: blob, error: downloadError } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(file.name);
      if (downloadError) throw new Error(`Erro no download de ${file.name}: ${downloadError.message}`);
      if (blob) {
        fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), Buffer.from(await blob.arrayBuffer()));
        console.log(`[INIT] ✓ Arquivo salvo: ${file.name}`);
      }
    }
  } catch (err: any) {
    console.warn(`[INIT] Falha no download do Supabase: ${err.message}`);
    if (!fs.existsSync(FAISS_INDEX_PATH) || fs.readdirSync(FAISS_INDEX_PATH).length === 0) {
      throw new Error(`[INIT] Não foi possível carregar o índice FAISS do Supabase e nenhum índice local foi encontrado.`);
    }
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

function decomposeQuery(query: string): QueryPlan {
  const lowerCaseQuery = query.toLowerCase();

  const listTriggers = ['todos os projetos', 'lista completa', 'quantos projetos', 'liste os projetos'];
  if (listTriggers.some(trigger => lowerCaseQuery.includes(trigger))) {
    console.log("[QueryPlan] Intenção 'LIST_PROJECTS' detectada.");
    return { type: 'LIST_PROJECTS', payload: { originalQuery: query } };
  }

  let foundTechnology: string | null = null;
  for (let i = 0; i < knownTechnologies.length; i++) {
    const tech = knownTechnologies[i];
    if (!tech) continue;
    const techRegex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
    if (techRegex.test(lowerCaseQuery)) {
      if (tech === 'vue') {
        foundTechnology = 'vue.js';
      } else {
        foundTechnology = knownTechnologiesOriginal[i] ?? null;
      }
      console.log(`[QueryPlan] Tecnologia encontrada: ${foundTechnology}`);
      break;
    }
  }

  if (foundTechnology) {
    console.log(`[QueryPlan] Intenção 'PROJECT_TECHNOLOGY_SEARCH' detectada para: ${foundTechnology}`);
    return {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      payload: { technology: foundTechnology }
    };
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
      console.log('[SMART SEARCH] Buscando lista de projetos...');
      try {
        results = await vectorStore.similaritySearch(
          originalQuery,
          1,
          { source: 'synthetic_project_list' }
        );
        return results.map((doc: any) => [doc, 1.0]);
      } catch (err: any) {
        console.warn(`[SMART SEARCH] Busca por vetores para LIST_PROJECTS falhou (${err.message}). Utilizando busca híbrida.`);
        return await hybridRetriever.search(originalQuery, 10);
      }

    case 'PROJECT_TECHNOLOGY_SEARCH':
      const technology = queryPlan.payload.technology;
      console.log(`[SMART SEARCH] Executando busca por METADATOS para tecnologia: ${technology}`);

      const filterFunction = (doc: Document) => {
        const technologies = doc.metadata.technologies;
        if (!technologies || !Array.isArray(technologies)) {
          return false;
        }

        const match = technologies.some((t: string) => t.toLowerCase() === technology.toLowerCase());
        console.log(`[Filter] Chunk: ${doc.metadata.project_name || doc.metadata.source} | Tecnologias: [${technologies.join(', ')}] | Busca por: ${technology} | Match: ${match}`);
        return match;
      };

      try {
        results = await vectorStore.similaritySearch(
          `projetos com ${technology}`,
          30,
          filterFunction
        );
        console.log(`[SMART SEARCH] Filtro por metadados para '${technology}' encontrou ${results.length} chunks.`);
        return results.map((doc: Document) => [doc, 1.0]);
      } catch (err: any) {
        console.warn(`[SMART SEARCH] Busca por metadados para '${technology}' falhou (${err.message}). Utilizando busca híbrida.`);
        return await hybridRetriever.search(`projetos ${technology}`, 10);
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

// --- Função Principal de Inicialização ---
async function main() {
  await downloadIndexFromSupabase();
  console.log('[INIT] Carregando índice FAISS para a memória...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('[INIT] Índice FAISS carregado com sucesso.');

  console.log('[INIT] Carregando documentos para o retriever híbrido...');
  const loader = new DirectoryLoader(path.join(process.cwd(), 'src/knowledge-base'), { '.md': (p: string) => new TextLoader(p) });
  const docs = await loader.load();
  hybridRetriever = new HybridRetriever(vectorStore, docs);
  console.log('[INIT] Retriever híbrido inicializado com sucesso.');

  const app = express();
  const port = 3001;
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req: Request, res: Response) => { res.status(200).json({ status: 'ok' }); });

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

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
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

      let topResults;

      if (queryPlan.type === 'LIST_PROJECTS') {
        console.log('[API] Plano LIST_PROJECTS: Limitando resultados a Top-K=5 para resposta rápida.');
        topResults = searchResults.slice(0, 5);
      } else {
        console.log(`[API] Plano ${queryPlan.type}: Aplicando re-ranking e limitando a Top-K=4.`);
        topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 4);
      }

      const structuredContext = assembleStructuredContext(topResults);


      console.log(`================ CONTEXTO ESTRUTURADO PARA A IA (TOP ${topResults.length}) ================\n`);
      console.log(structuredContext);
      console.log("=======================================================================");

      const systemPrompt = `Você é um assistente especialista na carreira de Luis Fernando Richter e responde EXCLUSIVamente baseado no contexto fornecido.\n\nREGRAS OBRIGATÓRIAS:\n1.  Use APENAS o contexto abaixo. NÃO use seu conhecimento prévio.\n2.  Se a resposta não estiver no contexto, diga \"Com base nas informações que tenho, não consigo responder a essa pergunta.\" NÃO invente.\n3.  NÃO faça inferências, suposições ou cálculos (como \"X anos de experiência\").\n4.  Ao listar projetos, SEMPRE use o formato de bullet point: \"* Projeto: [Nome Completo do Projeto]\".\n\nCONTEXTO:\n{context}\n\nPERGUNTA:\n{query}\n\nRESPOSTA (seguindo rigorosamente as regras acima):\n`;


      const finalPrompt = `${systemPrompt}\n\nCONTEXTO:\n${structuredContext}\n\nPERGUNTA:\n${question}\n\nRESPOSTA (seguindo rigorosamente as regras acima):\n`;

      let responseText: string;
      const provider = (process.env.AI_PROVIDER || (process.env.NODE_ENV === 'production' ? 'openrouter' : 'ollama')).toLowerCase();
      console.log(`[API] Roteando para o provedor: ${provider}`);

      if (provider === 'openrouter') {
        const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
        responseText = await callOpenRouterAPI(model, finalPrompt);
      } else if (provider === 'ollama') {
        try {
          const model = (process.env.OLLAMA_MODEL as string) || 'mistral:7b';
          responseText = await callOllamaAPI(model, finalPrompt);
        } catch (ollamaErr: any) {
          console.warn(`[API] Falha/Timeout no Ollama local (${ollamaErr.message}). Tentando fallback via OpenRouter...`);
          if (process.env.OPENROUTER_API_KEY) {
            responseText = await callOpenRouterAPI('google/gemma-4-26b-a4b-it:free', finalPrompt);
          } else {
            throw ollamaErr;
          }
        }
      } else if (provider === 'huggingface') {
        const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct:novita';
        responseText = await callHuggingFaceAPI(model, finalPrompt);
      } else {
        if (process.env.OPENROUTER_API_KEY) {
          responseText = await callOpenRouterAPI('google/gemma-4-26b-a4b-it:free', finalPrompt);
        } else {
          throw new Error(`Provedor de IA '${provider}' não implementado.`);
        }
      }

      console.log(`[API] Resposta recebida do ${provider} com sucesso.`);
      res.json({ answer: responseText });

    } catch (error: any) {
      console.error('[ERRO DETALHADO]', error.message);
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[server]: Backend rodando em http://localhost:${port}`);
  });
}

main().catch(error => {
  console.error("Falha fatal ao iniciar o servidor:", error);
  process.exit(1);
});
