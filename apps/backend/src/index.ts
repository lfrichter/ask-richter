import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { callHuggingFaceAPI } from './core/huggingface.js';
import { callOllamaAPI } from './core/ollama.js';
import { HybridRetriever } from './core/hybrid-retriever.js';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from '@langchain/core/documents';

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

/**
 * Decompõe a consulta do usuário em um plano de ação estruturado.
 * @param query A pergunta do usuário.
 * @returns Um objeto QueryPlan que descreve a intenção e os parâmetros da consulta.
 */
function decomposeQuery(query: string): QueryPlan {
  const lowerCaseQuery = query.toLowerCase();

  // Pattern for "projetos [tecnologia]"
  const projectTechMatch = lowerCaseQuery.match(/(?:projetos|quais projetos)\s+utilizam?\s+(.+)/);
  if (projectTechMatch && projectTechMatch[1]) {
    const technology = projectTechMatch[1].trim();
    return {
      type: 'PROJECT_TECHNOLOGY_SEARCH',
      payload: { technology: technology }
    };
  }

  // Default to simple search if no specific pattern is matched
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

  switch (queryPlan.type) {
    case 'LIST_PROJECTS':
      console.log('[SMART SEARCH] Buscando lista de projetos...');
      const results = await vectorStore.similaritySearch(
        'Lista de todos os projetos',
        1,
        { source: 'synthetic_project_list' }
      );
      return results.map(doc => [doc, 1.0]);

    case 'PROJECT_TECHNOLOGY_SEARCH':
      const technology = queryPlan.payload.technology;
      console.log(`[SMART SEARCH] Buscando projetos que utilizam a tecnologia: ${technology}`);
      // For now, we'll do a general search with the technology.
      // In a more advanced version, we might filter by metadata.
      return await hybridRetriever.search(`projetos que usam ${technology}`, 5);

    case 'SIMPLE_SEARCH':
    default:
      const originalQuery = queryPlan.payload.originalQuery;
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
      structuredOutput += `  - ${sectionHeader} (Fonte: ${source})\n`;
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

      // --- PASSO 2: LIMITAR E ESTRUTURAR O CONTEXTO ---
      // Re-ranking simples por score e limitação aos 3 melhores resultados
      const topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 3);

      // 3. Construção do contexto estruturado, agora com o cabeçalho da seção
      const structuredContext = assembleStructuredContext(topResults);


      console.log("================ CONTEXTO ESTRUTURADO PARA A IA (TOP 3) ================");
      console.log(structuredContext);
      console.log("=======================================================================");

      // --- PASSO 1.1: IMPLEMENTAR O NOVO PROMPT BLINDADO ---
      const systemPrompt = `Você é um assistente que responde EXCLUSIVAMENTE baseado no contexto fornecido.

REGRAS OBRIGATÓRIAS:
1.  Use APENAS informações presentes no contexto fornecido.
2.  Se a informação não estiver no contexto, responda: "Com base nas informações que tenho, não consigo responder a essa pergunta."
3.  NÃO faça inferências, suposições ou combine informações de forma criativa.

PROCESSO DE RESPOSTA:
1.  Leia o contexto completamente.
2.  Identifique as partes EXATAS que são relevantes para a pergunta.
3.  Responda usando APENAS essas partes, citando diretamente sempre que possível.`;

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
