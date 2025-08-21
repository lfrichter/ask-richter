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

      // --- PASSO 1.2: LIMITAR E ESTRUTURAR O CONTEXTO ---
      // 1. Busca inicial com score para permitir o sort
      const searchResults = await vectorStore.similaritySearchWithScore(question, 5);

      // 2. Re-ranking simples por score e limitação aos 3 melhores resultados
      const topResults = searchResults.sort((a, b) => b[1] - a[1]).slice(0, 3);

      // 3. Construção do contexto estruturado, agora com o cabeçalho da seção
      const structuredContext = topResults
        .map((result, idx) => {
          const doc = result[0];
          const source = doc.metadata.source?.split('/').pop() || 'Fonte desconhecida';
          const section = doc.metadata.section_header || 'Seção';
          // Incluímos o cabeçalho para dar mais contexto ao LLM
          return `[Fonte ${idx + 1}: ${source} | Seção: ${section}]\n${doc.pageContent}`;
        })
        .join('\n\n---\n\n');


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
