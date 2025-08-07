import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- Validação Explícita de Variáveis de Ambiente no Topo do Arquivo ---
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET_NAME) {
  throw new Error('Uma ou mais variáveis de ambiente do Supabase não estão definidas.');
}

// Com a verificação acima, o TypeScript agora sabe que estas variáveis são strings.
const supabase = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);

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
    throw new Error(`[DOWNLOAD-SCRIPT] Nenhum arquivo encontrado no bucket '${SUPABASE_BUCKET_NAME}'. Você já rodou o script 'build-index' localmente para fazer o upload?`);
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

// Executa a função principal com o logging melhorado sugerido pelo Qwen
downloadIndexFromSupabase().catch(error => {
  console.error("[DOWNLOAD-SCRIPT] Falha crítica ao baixar o índice:", error);
  process.exit(1);
});