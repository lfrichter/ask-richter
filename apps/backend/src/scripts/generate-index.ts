import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
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
  // 1. Divide o conteúdo em chunks brutos por cabeçalhos ### e ####
  const rawChunks = markdownContent.split(/(?=^###\s|^####\s)/m).filter(chunk => chunk.trim() !== '');

  // 2. Primeira passagem: Agrupa chunks por projeto E identifica conteúdo das seções de tecnologia
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
    let sectionHeader = firstLine.replace(/###|####/g, '').trim();

    // Identifica o início de um novo projeto (ou seção não-projeto)
    if (firstLine.startsWith('### 🚀')) {
      currentProjectName = sectionHeader;
      currentProjectKey = currentProjectName;
      if (!projectsMap.has(currentProjectKey)) {
        projectsMap.set(currentProjectKey, { projectName: currentProjectName, techRelevantContent: '', chunks: [] });
      }
    } else if (!currentProjectKey || (!firstLine.startsWith('####') && projectsMap.has(currentProjectKey))) {
        // Se não for sub-header E já existe um projeto, OU se não há projeto atual,
        // cria/usa uma chave genérica para chunks fora de projetos nomeados
        currentProjectKey = `_non_project_${source}_${projectsMap.size}`;
        currentProjectName = null; // Garante que não é um projeto nomeado
        if (!projectsMap.has(currentProjectKey)) {
             projectsMap.set(currentProjectKey, { projectName: null, techRelevantContent: '', chunks: [] });
        }
    }


    const projectData = projectsMap.get(currentProjectKey!)!;
    projectData.chunks.push({ originalContent: content, sectionHeader: sectionHeader });

    // Acumula conteúdo APENAS se o chunk for de uma seção relevante para tecnologias
    if (sectionHeader.includes('Pilha de Tecnologias') ||
        sectionHeader.includes('CLASSIFICAÇÃO DE TECNOLOGIAS') ||
        sectionHeader.includes('Skills & Technologies') || // Para CV
        sectionHeader.startsWith('Skills:')) {             // Para Experience
      projectData.techRelevantContent += content + '\n\n';
    }
  }

  // 3. Segunda passagem: Processa cada projeto, extrai tecnologias e cria Documents
  const finalDocuments: Document[] = [];
  for (const [projectKey, projectData] of projectsMap.entries()) {
    // Extrai tecnologias APENAS do conteúdo acumulado das seções relevantes
    const projectTechnologies = parseTechnologiesFromChunk(projectData.techRelevantContent);

    for (const chunkData of projectData.chunks) {
      const metadata: Record<string, any> = {
        source: source,
        section_header: chunkData.sectionHeader,
      };
      if (projectData.projectName) {
        metadata.project_name = projectData.projectName;
      }
      // Aplica a lista (agora mais precisa) a TODOS os chunks do projeto
      if (projectTechnologies.length > 0) {
        metadata.technologies = projectTechnologies;
      }
      finalDocuments.push(new Document({
        pageContent: chunkData.originalContent,
        metadata: metadata,
      }));
    }
  }

  // LOG DE DEPURAÇÃO (Manter)
  console.log("--- METADADOS GERADOS (AMOSTRA) ---");
  finalDocuments.slice(0, 25).forEach(doc => {
      console.log(`Chunk Source: ${doc.metadata.source.split('/').pop()}`);
      console.log(`  Header: ${doc.metadata.section_header}`);
      console.log(`  Projeto: ${doc.metadata.project_name || 'N/A'}`);
      console.log(`  Tecnologias: ${doc.metadata.technologies ? doc.metadata.technologies.join(', ') : 'Nenhuma'}`);
      console.log('---');
  });
  console.log("---------------------------------");

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

  // NOVO CONTEÚDO APRIMORADO
  const enhancedContent = `
Título: Lista Completa de Todos os ${projectNames.length} Projetos.
Resumo: Este documento é o índice sintético oficial que lista o nome de todos os ${projectNames.length} projetos documentados na base de conhecimento.
Palavras-chave: todos os projetos, lista completa, índice de projetos, quantos projetos, listagem total.
Projetos: ${projectListString}
    `;

  // Crie o Document usando o conteúdo aprimorado
  const doc = new Document({
    pageContent: enhancedContent,
    metadata: {
      source: 'synthetic:project_list',
    },
  });

  console.log(`[SINTÉTICO] Documento criado com ${projectNames.length} projetos.`);
  return doc;
}

const ignoreList = new Set([
     'categoria', 'tecnologias e conceitos', 'componente', 'tecnologia utilizada',
     'papel na arquitetura', 'descrição', 'software development', 'architecture',
     'cloud computing', 'api restful development', 'frontend development',
     'mobile development', 'database', 'data management', 'content management - cms',
     'system administration', 'devops', 'leadership', 'coaching', 'agile project management',
     'ai & machine learning' // Adicione outros termos genéricos que aparecem
  ].map(term => term.toLowerCase()));


/**
 * Analisa o conteúdo ACUMULADO das seções de tecnologia (tabelas, listas de skills)
 * e extrai tecnologias de forma RÍGIDA. Ignora texto livre.
 * @param relevantContent O conteúdo combinado APENAS das seções de tecnologia.
 * @returns Um array de strings com as tecnologias limpas encontradas.
 */
function parseTechnologiesFromChunk(relevantContent: string): string[] {
  const techSet = new Set<string>();

  // Lista de termos a serem IGNORADOS (mantida)
  const ignoreList = new Set([ /* ... sua lista ignoreList ... */ ].map(term => term.toLowerCase()));

  // Função auxiliar de limpeza (mantida)
  const addCleanedTech = (techString: string | undefined) => {
    console.log(`[addCleanedTech Debug] Input: "${techString}"`);

    // ... (sua função addCleanedTech completa, incluindo ignoreList e normalizações) ...
     if (!techString || techString.toLowerCase() === 'n/a' || techString.includes('---')) return;
     // ... resto da lógica ...
     techString.split(',')
      .flatMap(part => part.split('·'))
      .flatMap(part => part.split('/'))
      .map(t => t.replace(/[[\]{}()#*`]/g, ''))
      .map(t => t.split(':')[0])
      .map(t => t.split('<')[0])
      .map(t => t.replace(/^[-\* ]+|[.$]$/g, ''))
      .map(t => t.trim())
      .filter(t => /^[a-zA-Z0-9.\-+#/ ]+$/.test(t))
      .filter(t => t.length > 1 && t.length < 30)
      .filter(t => !t.match(/^\d+$/))
      .forEach(cleanedTech => {
        const lowerTech = cleanedTech.toLowerCase();
        if (ignoreList.has(lowerTech)) { return; } // Pula termos ignorados
        let normalizedTech = cleanedTech;
        if (lowerTech.includes('laravel')) normalizedTech = 'Laravel';
        else if (lowerTech.includes('vue')) normalizedTech = 'Vue.js';
        // ... resto das normalizações ...
        else if (lowerTech.includes('mongo')) normalizedTech = 'MongoDB';
        if (normalizedTech) { techSet.add(normalizedTech); }
      });
  };


  // --- 1. Extração RÍGIDA de Tabelas Markdown ---
  // Procura por QUALQUER tabela, mas só processa se tiver cabeçalhos esperados
  const tableSections = relevantContent.match(/(\|.*\| *\n)((?:\| *[-:]+ *\|.*\n)+)((?:\|.*\| *\n)+)/g) || [];
  for (const tableSection of tableSections) {
      const tableLines = tableSection.split('\n').filter(line => line.trim().startsWith('|'));
      // Verifica se é uma tabela de tecnologia conhecida pelos cabeçalhos
      const headerLine = tableLines[0]?.toLowerCase() || '';
      const isTechTable = headerLine.includes('tecnologia') || headerLine.includes('componente') || headerLine.includes('categoria') || headerLine.includes('stack');

      if (isTechTable) {
          for (const line of tableLines) {
              const columns = line.split('|').map(col => col.trim());
              if (columns.length < 3 || columns[1].includes('---')) continue;
              // Extrai da segunda coluna (índice 2) - Ajuste se necessário
              const potentialTechString = columns[2];
              console.log(`[Parser Debug Table] Linha: "${line}", Coluna[2]: "${potentialTechString}"`);
              addCleanedTech(potentialTechString);
          }
      }
  }

  // --- 2. Extração RÍGIDA de Listas de Habilidades (CV/Experience) ---
  // Procura apenas linhas que COMEÇAM com marcadores ou palavras-chave de skill
  const skillLines = relevantContent.match(/^(?:\* |\- |Skills:|Languages & Frameworks:|Databases:|Deployment & DevOps:|Other Competencies:).*/gmi) || [];
  for (const line of skillLines) {
      // Remove o prefixo ANTES de passar para addCleanedTech
      const contentOnly = line.replace(/^(\* |\- |Skills:|Languages & Frameworks:|Databases:|Deployment & DevOps:|Other Competencies:)/i, '').trim();
      console.log(`[Parser Debug List] Linha: "${line}", Conteúdo: "${contentOnly}"`);
      addCleanedTech(contentOnly);
  }

  return Array.from(techSet);
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

    const projectListDoc = createProjectListDocument(splitDocs);
    if (projectListDoc) {
      splitDocs.push(projectListDoc);
      console.log(`[SINTÉTICO] Documento de lista de projetos criado e adicionado. Total de chunks agora: ${splitDocs.length}`);
    }

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    await vectorStore.save(FAISS_INDEX_PATH);
    console.log(`Índice FAISS salvo localmente em: ${FAISS_INDEX_PATH}`);

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
