import fetch from 'node-fetch';

const OLLAMA_URL = `${process.env.OLLAMA_BASE_URL}/api/chat`; // Mudança crucial aqui!

export async function callOllamaAPI(model: string, systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const conservativeOptions = {
      temperature: 0.1,
      top_p: 0.3,
      num_predict: 512
    };

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: false,
        options: conservativeOptions
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API do Ollama: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const result = await response.json() as { message: { content: string } };
    return result.message?.content || "Ollama não retornou uma resposta.";

  } catch (error) {
    console.error("Erro ao chamar a API do Ollama:", error);
    throw error;
  }
}
