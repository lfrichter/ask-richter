import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- LÓGICA DE DOWNLOAD ISOLADA ---

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME) {
  throw new Error('Variáveis de ambiente do Supabase não estão definidas para o download.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FAISS_INDEX_PATH = path.join('/tmp', 'faiss_index');

async function downloadIndexFromSupabase() {
  if (fs.existsSync(FAISS_INDEX_PATH) && fs.readdirSync(FAISS_INDEX_PATH).length > 0) {
    console.log('[DOWNLOAD-SCRIPT] Índice FAISS já existe. Pulando download.');
    return;
  }

  console.log(`[DOWNLOAD-SCRIPT] Iniciando download do bucket: ${SUPABASE_BUCKET_NAME}...`);
  fs.mkdirSync(FAISS_INDEX_PATH, { recursive: true });

  const { data: files, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list();
  if (error) throw new Error(`[DOWNLOAD-SCRIPT] Não foi possível listar arquivos: ${error.message}`);
  if (!files || files.length === 0) {
    throw new Error(`[DOWNLOAD-SCRIPT] Nenhum arquivo encontrado no bucket '${SUPABASE_BUCKET_NAME}'. Você já rodou o script 'build-index' localmente?`);
  }

  for (const file of files) {
    console.log(`[DOWNLOAD-SCRIPT] Baixando: ${file.name}`);
    const { data: blob, error: downloadError } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .download(file.name);

    if (downloadError) throw new Error(`[DOWNLOAD-SCRIPT] Erro no download de ${file.name}: ${downloadError.message}`);
    if (blob) {
      fs.writeFileSync(path.join(FAISS_INDEX_PATH, file.name), Buffer.from(await blob.arrayBuffer()));
      console.log(`[DOWNLOAD-SCRIPT] ✓ Salvo: ${file.name}`);
    }
  }
  console.log('[DOWNLOAD-SCRIPT] Download do índice concluído com sucesso.');
}

// Executa a função principal
downloadIndexFromSupabase().catch(error => {
  console.error(error);
  process.exit(1);
});