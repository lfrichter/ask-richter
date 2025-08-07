import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express'; // Importa os tipos Request e Response
import path from 'path';
import { callOllamaAPI } from './core/ollama.js';

// --- Validação de Variáveis de Ambiente ---
const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_BUCKET_NAME'
];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`Variável de ambiente obrigatória '${varName}' não está definida.`);
    }
}

let vectorStore: FaissStore;

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    configuration: { baseURL: "https://api.openai.com/v1" }
});

const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

async function main() {
  // ... (código para carregar o índice continua o mesmo)
  console.log('Carregando índice FAISS...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('Índice FAISS carregado com sucesso.');

  const app = express();
  const port = 3001;
  app.use(cors());
  app.use(express.json());

  // Adiciona tipos explícitos para req e res
  app.get('/api/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', vectorStoreLoaded: true });
  });

  // Adiciona tipos explícitos para req e res
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      const question = messages[messages.length - 1].content;

      if (!question) {
        return res.status(400).json({ error: 'A pergunta está vazia.' });
      }

      const searchResults = await vectorStore.similaritySearch(question, 4);
      const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');

      const systemPrompt = `Você é o "Ask Richter", um chatbot especialista...`;
      const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta do usuário: ${question}`;

      let responseText: string;
      const provider = process.env.AI_PROVIDER || 'ollama';

      if (provider === 'ollama') {
        const model = 'llama3';
        responseText = await callOllamaAPI(model, finalPrompt);
      } else {
        throw new Error(`Provedor de IA '${provider}' não implementado.`);
      }

      res.json({ answer: responseText });

    } catch (error: any) {
      console.error('[ERRO DETALHADO]', error.message);
      res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
  });

  app.listen(port, () => {
    console.log(`[server]: Backend rodando em http://localhost:${port}`);
  });
}

main().catch(error => {
  console.error("Falha fatal ao iniciar o servidor:", error);
  process.exit(1);
});