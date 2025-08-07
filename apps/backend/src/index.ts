import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { callOllamaAPI } from './core/ollama.js';

// Configuração do cliente Supabase
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME) {
  throw new Error('Variáveis de ambiente do Supabase (URL, SERVICE_ROLE_KEY, BUCKET_NAME) não estão definidas.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let vectorStore: FaissStore;
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-3-small', configuration: { baseURL: "https://api.openai.com/v1" } });
const FAISS_INDEX_PATH = path.join(process.cwd(), 'src/faiss_index');

async function downloadIndexFromSupabase() {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('Índice FAISS já existe localmente. Pulando download.');
    return;
  }

  console.log(`Índice não encontrado localmente. Iniciando download do bucket Supabase: ${SUPABASE_BUCKET_NAME}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  const { data: files, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list();
  if (error) throw new Error(`Não foi possível listar arquivos no bucket: ${error.message}`);
  if (!files) return;

  for (const file of files) {
    console.log(`- Baixando arquivo: ${file.name}`);
    const { data: blob, error: downloadError } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .download(file.name);

    if (downloadError) throw new Error(`Erro no download de ${file.name}: ${downloadError.message}`);
    if (blob) {
      fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), Buffer.from(await blob.arrayBuffer()));
    }
  }
  console.log('Download do índice concluído.');
}

async function main() {
  await downloadIndexFromSupabase();

  console.log('Carregando índice FAISS...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('Índice FAISS carregado com sucesso.');

  const app = express();
  const port = process.env.PORT || 3001;
  app.use(cors());
  app.use(express.json());

  // ... (o resto da sua API com a rota /api/chat continua aqui)
  app.post('/api/chat', async (req, res) => {
    // ... Lógica da rota de chat ...
    try {
      const { messages } = req.body;
      const question = messages[messages.length - 1].content;
      if (!question) { return res.status(400).json({ error: 'A pergunta está vazia.' }); }

      const searchResults = await vectorStore.similaritySearch(question, 4);
      const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');
      const systemPrompt = `Você é o "Ask Richter", um chatbot especialista...`;
      const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta do usuário: ${question}`;

      const responseText = await callOllamaAPI('llama3', finalPrompt);
      res.json({ answer: responseText });
    } catch (error: any) {
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
  });

  app.listen(port, () => {
    console.log(`[server]: Backend rodando em http://localhost:${port}`);
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
}

main().catch(console.error);