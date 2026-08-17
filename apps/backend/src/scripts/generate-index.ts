import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.OPENAI_API_KEY) { throw new Error('OPENAI_API_KEY não definida.'); }

const KNOWLEDGE_BASE_PATH = fs.existsSync(path.join(process.cwd(), 'src/knowledge-base'))
  ? path.join(process.cwd(), 'src/knowledge-base')
  : path.resolve(__dirname, '../knowledge-base');

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
  // 1. Divide o conteúdo em chunks brutos (regex atualizado para mais headers)
  const rawChunks = markdownContent.split(/(?=^###\s|^####\s|^\*\*.*\*\*$\n|^\##\s)/m).filter(chunk => chunk.trim() !== '');

  // 2. Primeira passagem: Agrupa chunks por projeto E identifica conteúdo APENAS das seções de Pilha/Skills
  const projectsMap = new Map<string, {
    projectName: string | null;
    techRelevantContent: string; // Acumula conteúdo APENAS das seções RELEVANTES para tecnologia
    chunks: { originalContent: string, sectionHeader: string }[];
  }>();
  let currentProjectKey: string | null = null;
  let currentProjectName: string | null = null;

  for (const chunk of rawChunks) {
    const content = chunk.trim();
    const firstLine = content.split('\n')[0]!;
    let sectionHeader = firstLine.replace(/###|####|##|\*\*/g, '').trim(); // Limpa todos marcadores

    // Identifica o início de um novo projeto (ou seção não-projeto)
    if (firstLine.startsWith('### 🚀')) {

      // --- CORREÇÃO 1: Limpa TODOS os prefixos de projeto ---
      currentProjectName = sectionHeader.replace(/^(🚀 (PoC|Challenge|SideProject|Project): )/i, '').trim();
      currentProjectKey = currentProjectName; // Usa o nome limpo como chave
      // ----------------------------------------------------

      if (!projectsMap.has(currentProjectKey)) {
        projectsMap.set(currentProjectKey, { projectName: currentProjectName, techRelevantContent: '', chunks: [] });
      }
    } else if (!currentProjectKey || (!firstLine.startsWith('####') && projectsMap.has(currentProjectKey))) {
        // Chunks fora de um projeto (ex: CV, Experience)
        currentProjectKey = `_non_project_${source}`; // Chave genérica mais simples
        currentProjectName = null;
        if (!projectsMap.has(currentProjectKey)) {
             projectsMap.set(currentProjectKey, { projectName: null, techRelevantContent: '', chunks: [] });
        }
    }

    const projectData = projectsMap.get(currentProjectKey!)!;
    projectData.chunks.push({ originalContent: content, sectionHeader: sectionHeader });

    // --- CORREÇÃO 2: Acumula conteúdo SELETIVAMENTE (IGNORANDO 'CLASSIFICAÇÃO') ---
    const lowerContent = content.toLowerCase();

    // 1. Apenas da tabela "Pilha de Tecnologias" (Tech Stack)
    if (lowerContent.includes('#### 🛠️ pilha de tecnologias (tech stack)')) {
      projectData.techRelevantContent += content + '\n\n';
    }
    // 2. Apenas das listas de Skills do CV e Experience
    else if (source.includes('CV-Consolidated.md') && (lowerContent.includes('**skills & technologies**') || lowerContent.includes('experiência details'))) {
       projectData.techRelevantContent += content + '\n\n';
    } else if (source.includes('Experience-Consolidated.md') && lowerContent.includes('🛠️ 5. tabela de tecnologias utilizadas')) {
       projectData.techRelevantContent += content + '\n\n';
    }
    // (IGNORAMOS a tabela "CLASSIFICAÇÃO DE TECNOLOGIAS" de propósito para evitar poluição)
  }

  // 3. Segunda passagem: Processa cada projeto, extrai tecnologias e cria Documents
  const finalDocuments: Document[] = [];
  for (const [projectKey, projectData] of projectsMap.entries()) {

    const isSoftwareProject = Boolean(projectData.projectName);
    const projectTechnologies = isSoftwareProject ? parseTechnologiesFromChunk(projectData.techRelevantContent) : [];

    for (const chunkData of projectData.chunks) {
      const metadata: Record<string, any> = {
        source: source,
        section_header: chunkData.sectionHeader,
      };

      let enrichedContent = chunkData.originalContent;

      if (isSoftwareProject) {
        metadata.project_name = projectData.projectName;
        if (projectTechnologies.length > 0) {
          metadata.technologies = projectTechnologies;
        }

        enrichedContent = `[Contexto - Projeto: ${projectData.projectName}]\n` + enrichedContent;
        if (projectTechnologies.length > 0) {
          enrichedContent = `[Tecnologias do Projeto: ${projectTechnologies.join(', ')}]\n` + enrichedContent;
        }
      } else {
        enrichedContent = `[Contexto - Histórico/Formação/Certificações]\n` + enrichedContent;
        // Não adicionamos metadata.technologies nem [Tecnologias do Projeto: ...] para evitar poluição de escopo
      }

      finalDocuments.push(new Document({
        pageContent: enrichedContent, // Agora o FAISS busca e o LLM lê TUDO
        metadata: metadata, // Mantém os metadados para filtros hard-coded, se usar no backend
      }));
    }
  }

  // LOG DE DEPURAÇÃO (Manter)
  console.log("--- VERIFICAÇÃO FINAL DE TECNOLOGIAS POR PROJETO ---");
  for (const [projectKey, projectData] of projectsMap.entries()) {
    const technologies = parseTechnologiesFromChunk(projectData.techRelevantContent);
    const sourceName = projectKey.includes('_non_project_') ? projectKey.split('_')[2] : projectKey;

    if (technologies.length > 0) {
        console.log(`Projeto/Arquivo: ${projectData.projectName || sourceName}, Tecnologias Extraídas: [${technologies.join(', ')}]`);
    }
  }
  console.log("-----------------------------------------------------");

  return finalDocuments;
}

/**
 * Cria um documento sintético contendo uma lista de todos os nomes de projetos.
 * @param allDocs Um array de todos os documentos chunked.
 * @returns Um único Documento com a lista de projetos, ou null se nenhum projeto for encontrado.
 */
function createProjectListDocument(allDocs: Document[]): Document | null {
  console.log('[SINTÉTICO] Procurando por nomes de projetos para criar documento de lista...');
  const projectHeaders = allDocs
    .map(doc => doc.metadata.section_header)
    .filter(header => header && header.startsWith('🚀'));

  if (projectHeaders.length === 0) {
    console.log('[SINTÉTICO] Nenhum projeto encontrado. Pulando a criação do documento.');
    return null;
  }

  // Remove o emoji e limpa o nome do projeto
  const projectNames = projectHeaders.map(header => header.replace('🚀', '').trim());

  const projectListString = projectNames.join(', ');

  // NOVO CONTEÚDO APRIMORADO COM CABEÇALHO GLOBAL EXPLÍCITO
  const enhancedContent = `[RESUMO GLOBAL] Lista completa de todos os ${projectNames.length} projetos, portfólio e trabalhos desenvolvidos por Luis Fernando Richter:
Título: Lista Completa de Todos os ${projectNames.length} Projetos.
Resumo: Este documento é o índice sintético oficial que lista o nome de todos os ${projectNames.length} projetos documentados na base de conhecimento.
Palavras-chave: todos os projetos, lista completa, índice de projetos, quantos projetos, listagem total, portfólio.
Projetos: ${projectListString}
`;

  // Crie o Document usando o conteúdo aprimorado
  const doc = new Document({
    pageContent: enhancedContent,
    metadata: {
      source: 'synthetic_project_list',
    },
  });

  console.log(`[SINTÉTICO] Documento criado com ${projectNames.length} projetos.`);
  return doc;
}

/**
 * Analisa o conteúdo ACUMULADO das seções de tecnologia (tabelas, listas de skills)
 * e extrai tecnologias de forma RÍGIDA. Ignora texto livre.
 * @param relevantContent O conteúdo combinado APENAS das seções de tecnologia.
 * @returns Um array de strings com as tecnologias limpas encontradas.
 */
// EM: apps/backend/src/scripts/generate-index.ts
// SUBSTITUA A FUNÇÃO 'parseTechnologiesFromChunk' INTEIRA POR ESTA:

function parseTechnologiesFromChunk(relevantContent: string): string[] {
  const techSet = new Set<string>();

  const ignoreList = new Set([
     'tecnologia utilizada', 'tecnologias e conceitos', 'tecnologia',
     'categoria', 'componente', 'papel na arquitetura', 'descrição', 'software development',
     'architecture', 'cloud computing', 'api restful development', 'frontend development',
     'mobile development', 'database', 'data management', 'content management - cms',
     'system administration', 'devops', 'leadership', 'coaching', 'agile project management',
     'ai & machine learning'
  ].map(term => term.toLowerCase()));


  const addCleanedTech = (techString: string | undefined) => {
    if (!techString || techString.toLowerCase() === 'n/a' || techString.includes('---')) return;

    // console.log(`[addCleanedTech PRE-NORMALIZATION] Input: "${techString}"`);

    techString.split(',')
      .flatMap(part => part.split('·'))
      .flatMap(part => part.split('/'))
      .map(t => t.replace(/[[\]{}()#*`]/g, '')) // Limpa caracteres Markdown
      // --- CORREÇÃO 3: Remove emojis e símbolos ANTES da validação ---
      .map(t => t.replace(/[^\p{L}\p{N}\s.\-+#/]/gu, '')) // Remove qualquer coisa que não seja Letra, Número, espaço ou (.-+#/)
      // --------------------------------------------------
      .map(t => (t ? (t.split(':')[0] ?? '') : ''))
      .map(t => (t ? (t.split('<')[0] ?? '') : ''))
      .map(t => (t ? t.replace(/^[-\* ]+|[.$]$/g, '') : ''))
      .map(t => (t ? t.trim() : ''))
      .filter(t => /^[a-zA-Z0-9.\-+#/ ]+$/.test(t)) // Validação (agora vai passar)
      .filter(t => t.length > 1 && t.length < 30)
      .filter(t => !t.match(/^\d+$/))
      .forEach(cleanedTech => {
        const lowerTech = cleanedTech.toLowerCase();

        if (ignoreList.has(lowerTech)) {
           // console.log(`[addCleanedTech] Ignorando "${cleanedTech}" da ignoreList.`);
           return;
        }

        // Normalização específica para Vue.js
        let normalizedTech = cleanedTech;
        if (lowerTech === 'vue' || lowerTech === 'vue.js' || lowerTech.startsWith('vue 3')) {
           normalizedTech = 'Vue.js';
        }
        else if (lowerTech.includes('laravel')) normalizedTech = 'Laravel';
        else if (lowerTech.includes('mongo')) normalizedTech = 'MongoDB';
        else if (lowerTech.includes('react')) normalizedTech = 'React';
        else if (lowerTech.includes('next')) normalizedTech = 'Next.js';

        // console.log(`[addCleanedTech POST-NORMALIZATION] Original: "${cleanedTech}", Normalizado: "${normalizedTech}"`);
        if (normalizedTech) {
           techSet.add(normalizedTech);
        }
      });
  };

  // --- LÓGICA RÍGIDA DE PARSING (lendo ambas as tabelas) ---
  const tableSections = relevantContent.match(/(\|.*\| *\n)((?:\| *[-:]+ *\|.*\n)+)((?:\|.*\| *\n)+)/g) || [];
  for (const tableSection of tableSections) {
      const tableLines = tableSection.split('\n').filter(line => line.trim().startsWith('|'));
      const headerLine = tableLines[0]?.toLowerCase() || '';

      const isTechTable = headerLine.includes('tecnologia utilizada') && headerLine.includes('papel na arquitetura');
      const isClassificationTable = headerLine.includes('categoria') && headerLine.includes('conceitos');

      if (isTechTable || isClassificationTable) { // Processa AMBAS as tabelas
          for (const line of tableLines) {
              const columns = line.split('|').map(col => col.trim());
              const col1 = columns[1];
              const col2 = columns[2];
              if (columns.length < 3 || !col1 || col1.includes('---')) continue;

              if (isTechTable) {
                if (col1) addCleanedTech(col1); // Coluna do Componente
                if (col2) addCleanedTech(col2); // Coluna da Tecnologia
              } else if (isClassificationTable) {
                if (col2) addCleanedTech(col2); // Apenas a coluna de tecnologias
              }
          }
      }
  }

  // 2. Extração de Listas de Habilidades (CV/Experience)
  const skillLines = relevantContent.match(/^(?:\* |\- |Skills:|Languages & Frameworks:|Databases:|Deployment & DevOps:|Other Competencies:).*/gmi) || [];
  for (const line of skillLines) {
      const contentOnly = line.replace(/^(\* |\- |Skills:|Languages & Frameworks:|Databases:|Deployment & DevOps:|Other Competencies:)/i, '').trim();
      addCleanedTech(contentOnly);
  }

  return Array.from(techSet);
}

async function confirmIndexing(): Promise<boolean> {
  const hasYesFlag = process.argv.includes('--yes') || process.argv.includes('-y');
  if (hasYesFlag) {
    return true;
  }

  console.log('\n======================================================================');
  console.log('⚠️  ALERTA DE CUSTO: A cada reindexação, são geradas chamadas à API da OpenAI.');
  console.log('   Isso consome tokens e gera cobrança financeira.');
  console.log('   Por favor, execute a reindexação APENAS quando estritamente necessário');
  console.log('   (ex: após alterar arquivos na base de conhecimento).');
  console.log('======================================================================\n');

  if (!process.stdin.isTTY) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Deseja realmente prosseguir com a reindexação? (s/N): ', (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 's' || normalized === 'sim' || normalized === 'y' || normalized === 'yes');
    });
  });
}

async function run() {
  try {
    const confirmed = await confirmIndexing();
    if (!confirmed) {
      console.log('❌ Indexação cancelada pelo usuário.');
      process.exit(0);
    }

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

    const projectListDoc = createProjectListDocument(splitDocs);
    if (projectListDoc) {
      splitDocs.push(projectListDoc);
      console.log(`[SINTÉTICO] Documento de lista de projetos criado e adicionado. Total de chunks agora: ${splitDocs.length}`);
    }

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    await vectorStore.save(FAISS_INDEX_PATH);
    console.log(`Índice FAISS salvo localmente em: ${FAISS_INDEX_PATH}`);

    const localIndexPaths = new Set([
      path.join(process.cwd(), 'faiss_index'),
      path.join(process.cwd(), 'src/faiss_index'),
      path.resolve(__dirname, '../../faiss_index'),
      path.resolve(__dirname, '../faiss_index'),
    ]);

    for (const localPath of localIndexPaths) {
      await vectorStore.save(localPath);
      console.log(`Índice FAISS sincronizado na pasta do projeto: ${localPath}`);
    }

    const shouldUpload = process.argv.includes('--upload');

    if (shouldUpload) {
      await uploadIndexToSupabase(FAISS_INDEX_PATH);
    } else {
      console.log('\n[AVISO] Upload para o Supabase não solicitado. Use a flag --upload para fazer o upload.');
    }

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
