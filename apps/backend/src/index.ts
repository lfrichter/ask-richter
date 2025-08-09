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

// --- Validação de Variáveis de Ambiente ---
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME, OPENAI_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME || !OPENAI_API_KEY) {
  throw new Error('Uma ou mais variáveis de ambiente essenciais não estão definidas.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Variáveis Globais ---
let vectorStore: FaissStore;

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
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

// --- Função Principal de Inicialização ---
async function main() {
  // LÓGICA DE INICIALIZAÇÃO RESTAURADA
  await downloadIndexFromSupabase();
  console.log('[INIT] Carregando índice FAISS para a memória...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('[INIT] Índice FAISS carregado com sucesso.');

  const app = express();
  const port = 3001;
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req: Request, res: Response) => { res.status(200).json({ status: 'ok' }); });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      const question = messages[messages.length - 1].content;

      if (!question) {
        return res.status(400).json({ error: 'A pergunta está vazia.' });
      }

      console.log(`[API] Pergunta recebida: "${question}"`);
      const searchResults = await vectorStore.similaritySearch(question, 4);
      const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');

      const systemPrompt = `Você é o "Ask Richter", um assistente de carreira especialista na trajetória de Luis Fernando Richter. Sua missão é responder a perguntas de recrutadores e líderes técnicos sobre ele.

      **Regras Estritas:**
      1.  **Perspectiva:** Fale sobre Luis Fernando Richter SEMPRE na terceira pessoa (use "ele", "Luis", "o profissional"). NUNCA use "você".
      2.  **Fonte da Verdade:** Baseie TODAS as suas respostas exclusivamente no "Contexto" fornecido. Não invente informações.
      3.  **Tom:** Seja profissional, objetivo e informativo.
      4.  **Se a resposta não estiver no contexto:** Diga "Não tenho informações sobre isso no meu conhecimento."`;

      const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta do usuário: ${question}`;

      let responseText: string;
      const provider = process.env.AI_PROVIDER || 'ollama';
      console.log(`[API] Roteando para o provedor: ${provider}`);

      if (provider === 'ollama') {
        const model = process.env.OLLAMA_MODEL || 'mistral:7b';
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
