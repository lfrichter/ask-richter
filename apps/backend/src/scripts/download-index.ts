import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// --- FUNÇÃO AUXILIAR DE VALIDAÇÃO (MELHOR PRÁTICA) ---
function requiredEnv(varName: string): string {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória '${varName}' não está definida.`);
  }
  return value;
}

// --- Variáveis de Ambiente Validadas ---
const supabaseUrl = requiredEnv('SUPABASE_URL');
const supabaseKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const bucketName = requiredEnv('SUPABASE_BUCKET_NAME');

// Com a validação acima, o TypeScript sabe que as variáveis são strings.
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
