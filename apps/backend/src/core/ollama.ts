import fetch from 'node-fetch';

const OLLAMA_URL = `${process.env.OLLAMA_BASE_URL}/api/generate`;

/**
 * Faz uma chamada para a API local do Ollama.
 * @param model - O nome do modelo Ollama a ser usado (ex: 'llama3').
 * @param prompt - O prompt formatado a ser enviado para o modelo.
 * @returns O texto gerado pelo modelo.
 */
export async function callOllamaAPI(model: string, prompt: string): Promise<string> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false, // Queremos a resposta completa, não em streaming
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API do Ollama: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json() as { response: string };
    return result.response || "Ollama não retornou uma resposta.";

  } catch (error) {
    console.error("Erro ao chamar a API do Ollama:", error);
    throw error;
  }
}
