import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import path from 'path';

if (!process.env.OPENAI_API_KEY) { throw new Error('OPENAI_API_KEY não definida.'); }

const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'src/knowledge-base');
const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

// --- NOVA FUNÇÃO DE UPLOAD ROBUSTA ---
async function uploadIndexToSupabase(directoryPath: string) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME) {
    console.warn('\n[AVISO] Variáveis de ambiente do Supabase não encontradas. Pulando etapa de upload para a nuvem.');
    return; // Encerra a função de upload graciosamente
  }

  console.log(`\nIniciando upload para o bucket Supabase: ${SUPABASE_BUCKET_NAME}...`);
  console.log('Bucket:', SUPABASE_BUCKET_NAME);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Verificando bucket...');
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(SUPABASE_BUCKET_NAME);
  if (bucketError) throw new Error(`Erro ao verificar bucket: ${bucketError.message}`);
  if (!bucket) throw new Error(`Bucket '${SUPABASE_BUCKET_NAME}' não encontrado`);
  console.log('Bucket encontrado e acessível.');

  const files = fs.readdirSync(directoryPath);
  console.log(`Encontrados ${files.length} arquivos para upload:`, files);

  for (const file of files) {
    console.log(`\n📤 Iniciando upload de: ${file}`);
    const filePath = path.join(directoryPath, file);
    const fileBuffer = fs.readFileSync(filePath);

    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(file, fileBuffer, {
          upsert: true,
          contentType: file.endsWith('.json') ? 'application/json' : 'application/octet-stream'
        });

      if (error) {
        throw new Error(`Erro no upload de ${file}: ${error.message}`);
      }
      console.log(`✅ Upload concluído: ${file}`, data);
    } catch (uploadError) {
      console.error(`💥 Exceção durante upload de ${file}:`, uploadError);
      throw uploadError;
    }
  }
  console.log('\n🎉 Todos os uploads concluídos com sucesso!');
}


async function run() {
  try {
    console.log('Iniciando processo de indexação...');
    const loader = new DirectoryLoader(KNOWLEDGE_BASE_PATH, { '.md': (p: string) => new TextLoader(p) });
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    if (fs.existsSync(FAISS_INDEX_PATH)) {
        fs.rmSync(FAISS_INDEX_PATH, { recursive: true, force: true });
    }
    fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });
    await vectorStore.save(FAISS_INDEX_PATH);
    console.log(`Índice FAISS salvo localmente em: ${FAISS_INDEX_PATH}`);

    await uploadIndexToSupabase(FAISS_INDEX_PATH);

  } catch (error) {
    console.error('Ocorreu um erro durante o processo de indexação e upload:', error);
    process.exit(1);
  }
}

run();
