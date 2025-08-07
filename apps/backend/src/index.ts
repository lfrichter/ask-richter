import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { callOllamaAPI } from './core/ollama.js';

// ... (Validação de Variáveis de Ambiente) ...

let vectorStore: FaissStore;

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    configuration: { baseURL: "https://api.openai.com/v1" }
});

// O caminho agora é consistente
const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

async function main() {
  // A lógica de download foi removida daqui
  console.log('Carregando índice FAISS do caminho local...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('Índice FAISS carregado com sucesso.');

  const app = express();
  const port = 3001;
  app.use(cors());
  app.use(express.json());

  // ... (O resto da sua API continua o mesmo)
  app.get('/api/health', (req: Request, res: Response) => { res.status(200).json({ status: 'ok' }); });
  app.post('/api/chat', async (req: Request, res: Response) => {
      // ... Lógica da rota de chat ...
      res.json({ answer: '...' }); // Lógica omitida para brevidade
  });

  app.listen(port, () => {
    console.log(`[server]: Backend rodando em http://localhost:${port}`);
  });
}

main().catch(error => {
  console.error("Falha fatal ao iniciar o servidor:", error);
  process.exit(1);
});