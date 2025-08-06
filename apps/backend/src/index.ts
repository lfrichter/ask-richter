import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { callHuggingFaceAPI } from './core/huggingface.js';
import { callOllamaAPI } from './core/ollama.js';

// ... (declaração do vectorStore e configuração do embeddings)
let vectorStore: FaissStore;

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    configuration: {
      baseURL: "https://api.openai.com/v1",
    }
});

const FAISS_INDEX_PATH = path.join(process.cwd(), 'src/faiss_index');

async function main() {
  console.log('Carregando índice FAISS...');
  vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
  console.log('Índice FAISS carregado com sucesso.');

  const app = express();
  const port = process.env.PORT || 3001;
  app.use(cors());
  app.use(express.json());

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      const question = messages[messages.length - 1].content;

      if (!question) {
        return res.status(400).json({ error: 'A pergunta está vazia.' });
      }

      console.log(`[API] Pergunta recebida: "${question}"`);
      const searchResults = await vectorStore.similaritySearch(question, 4);
      const context = searchResults.map(doc => doc.pageContent).join('\n\n---\n\n');

      const systemPrompt = `Você é o "Ask Richter", um chatbot especialista e assistente de carreira de Luis Fernando Richter. Sua única função é responder perguntas sobre a carreira, projetos e competências de Luis, utilizando SOMENTE o contexto fornecido. Seja profissional, direto e preciso. Se a resposta não estiver no contexto, diga "Não tenho informações sobre isso no meu conhecimento."`;
      const finalPrompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPergunta do usuário: ${question}`;

      let responseText: string;
      const provider = process.env.AI_PROVIDER || 'ollama';

      console.log(`[API] Roteando para o provedor: ${provider}`);

      if (provider === 'ollama') {
        const model = 'llama3'; // Nome do modelo que você baixou com 'ollama pull llama3'
        responseText = await callOllamaAPI(model, finalPrompt);
      } else if (provider === 'huggingface') {
        const model = 'meta-llama/Llama-3.1-8B-Instruct:novita';
        responseText = await callHuggingFaceAPI(model, finalPrompt);
      } else {
        throw new Error(`Provedor de IA desconhecido: ${provider}`);
      }

      console.log(`[API] Resposta recebida do ${provider} com sucesso.`);

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

main().catch(console.error);
