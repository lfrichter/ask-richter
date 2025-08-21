import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import { Document } from '@langchain/core/documents';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import path from 'path';

if (!process.env.OPENAI_API_KEY) { throw new Error('OPENAI_API_KEY não definida.'); }

const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'src/knowledge-base');
const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

/**
 * Função de chunking semântico customizada para Markdown.
 * Divide o texto com base nos cabeçalhos ### e ####, mantendo-os
 * e extraindo o texto do cabeçalho para os metadados.
 * @param markdownContent O conteúdo completo do arquivo .md.
 * @param source O caminho do arquivo de origem.
 * @returns Um array de Documentos (chunks).
 */
function customMarkdownSplitter(markdownContent: string, source: string): Document[] {
  // A Regex divide o texto em cada linha que começa com '### ' ou '#### '
  // O `(?=...)` (positive lookahead) garante que os cabeçalhos sejam mantidos no início de cada chunk.
  const chunks = markdownContent.split(/(?=^###\s|^####\s)/m).filter(chunk => chunk.trim() !== '');

  return chunks.map(chunk => {
    const content = chunk.trim();
    // Extrai a primeira linha para usar como título da seção
    const header = content.split('\n')[0].replace(/###|####/g, '').trim();

    const metadata = { source, section_header: header };
    return new Document({ pageContent: content, metadata });
  });
}


async function run() {
  try {
    console.log(`[LIMPEZA] Verificando e limpando o diretório de índice antigo em: ${FAISS_INDEX_PATH}...`);
    if (fs.existsSync(FAISS_INDEX_PATH)) {
        fs.rmSync(FAISS_INDEX_PATH, { recursive: true, force: true });
        console.log('[LIMPEZA] Diretório antigo removido com sucesso.');
    }
    fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

    console.log('Iniciando indexação com a função de chunking customizada...');

    const loader = new DirectoryLoader(KNOWLEDGE_BASE_PATH, { '.md': (p: string) => new TextLoader(p) });
    const docs = await loader.load();

    let splitDocs: Document[] = [];
    for (const doc of docs) {
      const chunks = customMarkdownSplitter(doc.pageContent, doc.metadata.source);
      splitDocs.push(...chunks);
    }

    console.log(`[CHUNKING] Total de ${docs.length} documentos divididos em ${splitDocs.length} chunks semânticos.`);
    console.log('Exemplo de metadados do primeiro chunk:', splitDocs[0]?.metadata);

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    await vectorStore.save(FAISS_INDEX_PATH);
    console.log(`Índice FAISS salvo localmente em: ${FAISS_INDEX_PATH}`);

    // uploadIndexToSupabase(FAISS_INDEX_PATH); // Descomente para fazer o upload

  } catch (error) {
    console.error('Ocorreu um erro durante o processo de indexação e upload:', error);
    process.exit(1);
  }
}

// uploadIndexToSupabase não precisa de alterações
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

run();
