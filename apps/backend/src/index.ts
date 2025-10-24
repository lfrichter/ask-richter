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
import { callHuggingFaceAPI } from './core/huggingface.js';
import { HybridRetriever } from './core/hybrid-retriever.js';
import { callOllamaAPI } from './core/ollama.js';

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
    configuration: { baseURL: "https://api.openai.com/v1" }
});

const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

// --- Funções Auxiliares ---
async function downloadIndexFromSupabase() {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('[INIT] Índice FAISS já existe localmente. Pulando download.');
    return;
  }

  console.log(`[INIT] Iniciando download do bucket: ${SUPABASE_BUCKET_NAME}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  const { data: files, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list();
  if (error) throw new Error(`[INIT] Não foi possível listar arquivos: ${error.message}`);
  if (!files || files.length === 0) {
    throw new Error(`[INIT] Nenhum arquivo encontrado no bucket '${SUPABASE_BUCKET_NAME}'.`);
  }

  for (const file of files) {
    const { data: blob, error: downloadError } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(file.name);
    if (downloadError) throw new Error(`[INIT] Erro no download de ${file.name}: ${downloadError.message}`);
    if (blob) {
      fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), Buffer.from(await blob.arrayBuffer()));
      console.log(`[INIT] ✓ Arquivo salvo: ${file.name}`);
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
const knownTechnologies = [
  'Laravel', 'Lumen', 'PHP', 'Vue', 'Vue.js', 'React', 'React.js', 'JavaScript', 'TypeScript', 'Python',
  'MySQL', 'PostgreSQL', 'SQLite', 'SQL Server', 'MongoDB', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel', 'Render.com', 'Supabase',
  'Git', 'GitHub Actions', 'Jenkins', 'Bitbucket Pipelines',
  'LiveKit', 'WebRTC', 'Ollama', 'LangChain.js', 'FAISS', 'OpenAI', 'Hugging Face',
  'Next.js', 'FastAPI', 'Node.js', 'Express', // Adicionadas com base nos projetos
  // Adicione mais conforme necessário
].map(tech => tech.toLowerCase()); // Converte para minúsculas para comparação

// function decomposeQuery(query: string): QueryPlan {
//   const lowerCaseQuery = query.toLowerCase();

//   // --- REGRA 1: Lista Completa (Mantida) ---
//   const listTriggers = ['todos os projetos', 'lista completa', 'quantos projetos', 'liste os projetos'];
//   if (listTriggers.some(trigger => lowerCaseQuery.includes(trigger))) {
//     console.log("[QueryPlan] Intenção 'LIST_PROJECTS' detectada.");
//     return { type: 'LIST_PROJECTS', payload: { originalQuery: query } };
//   }

//   // --- REGRA 2: Busca por Tecnologia (Lógica Reforçada) ---
//   const techSearchTriggers = ['projetos?', 'project[s]?', 'usam?', 'utilizam?', 'feitos? com', 'desenvolvidos? com', 'em'];
//   const techSearchRegex = new RegExp(`\\b(${techSearchTriggers.join('|')})\\b`, 'i');
//   const containsTechSearchKeyword = techSearchRegex.test(lowerCaseQuery);

//   let foundTechnology: string | null = null;

//   for (const tech of knownTechnologies) {
//     const techRegex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
//     if (techRegex.test(lowerCaseQuery)) {
//       foundTechnology = tech;
//       break;
//     }
//   }

//   // A intenção só é acionada se UMA tecnologia e UMA palavra-chave de busca forem encontradas.
//   if (foundTechnology && containsTechSearchKeyword) {
//     console.log(`[QueryPlan] Intenção 'PROJECT_TECHNOLOGY_SEARCH' detectada. Tecnologia: ${foundTechnology}, Trigger: ${lowerCaseQuery.match(techSearchRegex)?.[0]}`);
//     return {
//       type: 'PROJECT_TECHNOLOGY_SEARCH',
//       payload: { technology: foundTechnology }
//     };
//   }

//   // --- REGRA 3: (Fallback) Busca Simples ---
//   console.log("[QueryPlan] Nenhuma intenção específica. Usando 'SIMPLE_SEARCH'.");
//   return { type: 'SIMPLE_SEARCH', payload: { originalQuery: query } };
// }
// EM: apps/backend/src/index.ts
// (Certifique-se que 'vue.js' está na sua lista 'knownTechnologies' no topo do arquivo)
// const knownTechnologies = [ 'laravel', 'vue.js', 'react', ... ];

// EM: apps/backend/src/index.ts
// (Certifique-se que 'vue.js', 'laravel', 'react', 'python', 'node.js' estão na sua lista 'knownTechnologies')

// EM: apps/backend/src/index.ts
// (Certifique-se que 'vue.js', 'laravel', 'react', 'python', 'node.js' estão na sua lista 'knownTechnologies')
// const knownTechnologies = [ 'laravel', 'vue.js', 'react', ... ];

// EM: apps/backend/src/index.ts

function decomposeQuery(query: string): QueryPlan {
  const lowerCaseQuery = query.toLowerCase();

  // --- REGRA 1: Lista Completa (Mantida) ---
  const listTriggers = ['todos os projetos', 'lista completa', 'quantos projetos', 'liste os projetos'];
  if (listTriggers.some(trigger => lowerCaseQuery.includes(trigger))) {
    console.log("[QueryPlan] Intenção 'LIST_PROJECTS' detectada.");
    return { type: 'LIST_PROJECTS', payload: { originalQuery: query } };
  }

  // --- REGRA 2: Busca por Tecnologia (Lógica Simplificada) ---
  let foundTechnology: string | null = null;
  for (const tech of knownTechnologies) {
      // Regex \b garante que é a palavra inteira (ex: "vue" e não "revenue")
      const techRegex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
      if (techRegex.test(lowerCaseQuery)) {
        // Normaliza "vue" para "vue.js" para o filtro de metadados
        foundTechnology = (tech === 'vue') ? 'vue.js' : tech;
        break;
      }
  }

  // Se encontramos uma tecnologia, é 99% de chance de ser uma busca por tecnologia.
  if (foundTechnology) {
    console.log(`[QueryPlan] Intenção 'PROJECT_TECHNOLOGY_SEARCH' detectada para: ${foundTechnology}`);
    return {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      // Passa a tecnologia normalizada (ex: "vue.js")
      payload: { technology: foundTechnology }
    };
  }

  // --- REGRA 3: (Fallback) Busca Simples ---
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
  const originalQuery = queryPlan.payload.originalQuery;
  let results: any;

  switch (queryPlan.type) {
    case 'LIST_PROJECTS':
      console.log('[SMART SEARCH] Buscando lista de projetos...');

      results = await vectorStore.similaritySearch(
        originalQuery,
        1,
        { source: 'synthetic_project_list' }
      );
      return results.map(doc => [doc, 1.0]);

    case 'PROJECT_TECHNOLOGY_SEARCH':
      const technology = queryPlan.payload.technology;
      console.log(`[SMART SEARCH] Executando busca por METADATOS para tecnologia: ${technology}`);

      // Criamos um filtro de função que o FaissStore suporta.
      // Isso é muito mais preciso do que a busca semântica.
      const filterFunction = (doc: Document) => {
        if (!doc.metadata.technologies || !Array.isArray(doc.metadata.technologies)) {
          return false;
        }

        // Compara a tecnologia pedida (ex: "laravel")
        // com a lista de tecnologias nos metadados do chunk (ex: ['Laravel', 'PHP', 'Vue.js'])
        // de forma case-insensitive.
        return doc.metadata.technologies.some((t: string) =>
          t.toLowerCase() === technology.toLowerCase()
        );
      };

      // Aplica o filtro de metadados e loga os resultados
      results = await vectorStore.similaritySearch(
        `projetos com ${technology}`,
        30, // Aumentado para 30 para garantir que todos os chunks relevantes sejam considerados
        filterFunction
      );
      console.log(`[SMART SEARCH] Filtro por metadados para '${technology}' encontrou ${results.length} chunks.`);

      // Como o filtro pode trazer vários chunks do *mesmo* projeto (header, descrição, etc.)
      // Nós agrupamos por nome de projeto para evitar duplicatas.
      const uniqueProjects = new Map<string, Document>();
      for (const doc of results) {
        const projectName = doc.metadata.project_name;
        if (projectName && !uniqueProjects.has(projectName)) {
          uniqueProjects.set(projectName, doc);
        }
      }

      console.log(`[SMART SEARCH] Encontrados ${results.length} chunks, ${uniqueProjects.size} projetos únicos.`);

      // Retornamos apenas os chunks únicos
      return Array.from(uniqueProjects.values()).map(doc => [doc, 1.0]); // Retorna com score 1.0

    case 'SIMPLE_SEARCH':
    default:
      // const originalQuery = queryPlan.payload.originalQuery;
      const intent = classifyIntent(originalQuery); // Still use intent for general searches
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

  // Group chunks by project_name
  for (const [doc] of retrievedChunks) {
    const projectName = doc.metadata.project_name || 'Outros'; // Default to 'Outros' if no project_name
    if (!projectsMap.has(projectName)) {
      projectsMap.set(projectName, []);
    }
    projectsMap.get(projectName)?.push(doc);
  }

  let structuredOutput = '';
  for (const [projectName, docs] of projectsMap.entries()) {
    if (projectName !== 'Outros') { // Don't add "PROJETO: Outros" header
      structuredOutput += `PROJETO: ${projectName}\n`;
    }

    // Sort documents within each project by section_header for consistent output
    docs.sort((a, b) => (a.metadata.section_header || '').localeCompare(b.metadata.section_header || ''));

    for (const doc of docs) {
      const sectionHeader = doc.metadata.section_header || 'Seção Desconhecida';
      const source = doc.metadata.source?.split('/').pop() || 'Fonte desconhecida';

      // Add section header and content
      structuredOutput += `  - ${sectionHeader} \n`;
      structuredOutput += `    ${doc.pageContent.trim()}\n\n`;
    }
    structuredOutput += '\n'; // Add an extra newline between projects for readability
  }

  return structuredOutput.trim(); // Remove trailing newlines
}

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      const question = messages[messages.length - 1].content;

      if (!question) {
        return res.status(400).json({ error: 'A pergunta está vazia.' });
      }

      console.log(`[API] Pergunta recebida: "${question}"`);

      // --- PASSO 1: DECOMPOSIÇÃO DA CONSULTA ---
      const queryPlan = decomposeQuery(question);
      console.log(`[API] Plano de consulta gerado: ${queryPlan.type}`);

      // --- PASSO 2: ROTEAMENTO INTELIGENTE DA BUSCA ---
      const searchResults = await smartSearch(queryPlan);

      // --- PASSO 2.1: LIMITAR E ESTRUTURAR O CONTEXTO ---
      // Re-ranking simples por score e limitação aos 3 melhores resultados
      // const topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 3);
      // --- PASSO 2.1: LIMITAÇÃO DE CONTEXTO CONDICIONAL (CORREÇÃO APLICADA) ---
      let topResults;

      if (queryPlan.type === 'LIST_PROJECTS') {
        // Se o plano é a lista, NÃO limitamos a 3.
        // Usamos todos os resultados (que deve ser apenas 1: o chunk sintético)
        console.log('[API] Plano LIST_PROJECTS: Usando todos os resultados da busca (sem slice).');
        topResults = searchResults;
      } else {
        // Para qualquer outro plano, aplicamos o Top-K (K=3)
        console.log(`[API] Plano ${queryPlan.type}: Aplicando re-ranking e limitando a Top-K=15.`);
        topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 15);
      }

      // 3. Construção do contexto estruturado, agora com o cabeçalho da seção
      const structuredContext = assembleStructuredContext(topResults);


      console.log(`================ CONTEXTO ESTRUTURADO PARA A IA (TOP ${topResults.length}) ================`);
      console.log(structuredContext);
      console.log("=======================================================================");

      // --- PASSO 1.1: IMPLEMENTAR O NOVO PROMPT BLINDADO ---
      const systemPrompt = `Você é um assistente especialista na carreira de Luis Fernando Richter e responde EXCLUSIVAMENTE baseado no contexto fornecido.

REGRAS OBRIGATÓRIAS:
1.  Use APENAS o contexto abaixo. NÃO use seu conhecimento prévio.
2.  Se a resposta não estiver no contexto, diga "Com base nas informações que tenho, não consigo responder a essa pergunta." NÃO invente.
3.  NÃO faça inferências, suposições ou cálculos (como "X anos de experiência").
4.  Ao listar projetos, SEMPRE use o formato de bullet point: "* Projeto: [Nome Completo do Projeto]".

CONTEXTO:
{context}

PERGUNTA:
{query}

RESPOSTA (seguindo rigorosamente as regras acima):`;


      // Formato final do prompt injetando as variáveis
      const finalPrompt = `${systemPrompt}\n\nCONTEXTO:\n${structuredContext}\n\nPERGUNTA:\n${question}\n\nRESPOSTA (seguindo rigorosamente as regras acima):\n`;

      let responseText: string;
      const provider = process.env.AI_PROVIDER || 'ollama';
      console.log(`[API] Roteando para o provedor: ${provider}`);

      if (provider === 'ollama') {
        const model = (process.env.OLLAMA_MODEL as string) || 'mistral:7b'; // Explicit cast
        responseText = await callOllamaAPI(model, finalPrompt);
      } else if (provider === 'huggingface') {
        const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct:novita';
        responseText = await callHuggingFaceAPI(model, finalPrompt);
      } else {
        throw new Error(`Provedor de IA '${provider}' não implementado.`);
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
