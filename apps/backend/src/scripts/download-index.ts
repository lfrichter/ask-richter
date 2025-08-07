import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Extrai as variáveis de ambiente primeiro
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME;

// 2. Valida cada uma individualmente, garantindo a tipagem para o compilador
if (!supabaseUrl) {
  throw new Error('Variável de ambiente SUPABASE_URL não está definida.');
}
if (!supabaseKey) {
  throw new Error('Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não está definida.');
}
if (!bucketName) {
  throw new Error('Variável de ambiente SUPABASE_BUCKET_NAME não está definida.');
}

// 3. Agora o TypeScript sabe que são strings, e o código compilará com sucesso
const supabase = createClient(supabaseUrl, supabaseKey);
const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

async function downloadIndexFromSupabase() {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('[DOWNLOAD-SCRIPT] Índice FAISS já existe. Pulando download.');
    return;
  }

  console.log(`[DOWNLOAD-SCRIPT] Iniciando download do bucket: ${bucketName}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  const { data: files, error } = await supabase.storage.from(bucketName).list();
  if (error) throw new Error(`[DOWNLOAD-SCRIPT] Não foi possível listar arquivos: ${error.message}`);
  if (!files || files.length === 0) {
    throw new Error(`[DOWNLOAD-SCRIPT] Nenhum arquivo encontrado no bucket '${bucketName}'. Você já rodou o script 'build-index' localmente para fazer o upload?`);
  }

  for (const file of files) {
    console.log(`[DOWNLOAD-SCRIPT] Baixando: ${file.name}`);
    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(file.name);

    if (downloadError) throw new Error(`[DOWNLOAD-SCRIPT] Erro no download de ${file.name}: ${downloadError.message}`);
    if (blob) {
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), buffer);
      console.log(`[DOWNLOAD-SCRIPT] ✓ Salvo: ${file.name}`);
    }
  }
  console.log('[DOWNLOAD-SCRIPT] Download do índice concluído com sucesso.');
}

downloadIndexFromSupabase().catch((error) => {
  console.error('[DOWNLOAD-SCRIPT] Falha crítica ao baixar o índice:', error);
  process.exit(1);
});