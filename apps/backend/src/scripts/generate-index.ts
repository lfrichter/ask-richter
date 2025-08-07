import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import 'dotenv/config';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import path from 'path';

// Valida se a chave da OpenAI para embeddings está configurada
if (!process.env.OPENAI_API_KEY) {
  throw new Error('A variável de ambiente OPENAI_API_KEY não está definida.');
}

// Define os caminhos relativos ao diretório do projeto
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'src/knowledge-base');
const FAISS_INDEX_PATH = process.env.FAISS_INDEX_PATH || path.join(process.cwd(), 'src/faiss_index');

/**
 * Função principal para gerar e salvar o índice vetorial.
 */
async function run() {
  try {
    console.log('Iniciando processo de indexação...');

    // 1. Carregar os documentos da base de conhecimento
    console.log(`Carregando documentos de: ${KNOWLEDGE_BASE_PATH}`);
    const loader = new DirectoryLoader(KNOWLEDGE_BASE_PATH, {
      '.md': (filePath: string) => new TextLoader(filePath),
    });
    const docs = await loader.load();
    console.log(`${docs.length} documentos carregados.`);

    // 2. Fragmentar (chunking) os documentos
    console.log('Fragmentando documentos...');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`${splitDocs.length} chunks criados.`);

    // 3. Inicializar o modelo de embeddings da OpenAI
    console.log('Inicializando modelo de embeddings e apontando para a API oficial da OpenAI...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
      // Adicionamos esta configuração para forçar o uso da URL correta
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      }
    });

    // 4. Gerar e construir o índice FAISS a partir dos documentos
    console.log('Gerando embeddings e construindo o índice FAISS...');
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    console.log('Índice FAISS criado em memória.');

    // 5. Salvar o índice no disco
    await vectorStore.save(FAISS_INDEX_PATH);
    console.log(`Índice FAISS salvo com sucesso em: ${FAISS_INDEX_PATH}`);

  } catch (error) {
    console.error('Ocorreu um erro durante o processo de indexação:', error);
    process.exit(1);
  }
}

run();
