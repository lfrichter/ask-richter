// Usaremos o fetch nativo do Node.js.

const API_URL = "https://api-inference.huggingface.co/models/";

if (!process.env.HUGGINGFACE_API_KEY) {
  throw new Error('A variável de ambiente HUGGINGFACE_API_KEY não está definida.');
}

/**
 * Faz uma chamada para a API de Inferência da Hugging Face.
 * (Renomeado para mais clareza no roteador)
 * @param model - O nome do modelo a ser usado.
 * @param prompt - O prompt formatado a ser enviado para o modelo.
 * @returns O texto gerado pelo modelo.
 */
export async function callHuggingFaceAPI(model: string, prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          return_full_text: false,
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API da Hugging Face: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json() as any[];
    return result[0]?.generated_text || "Não foi possível gerar uma resposta.";

  } catch (error) {
    console.error("Erro ao chamar a API da Hugging Face:", error);
    throw error;
  }
}
