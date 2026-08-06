import fetch from 'node-fetch';

const OPENROUTER_URL = `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`;

export async function callOpenRouterAPI(
  model: string,
  systemPromptOrPrompt: string,
  userMessage?: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não está definida nas variáveis de ambiente.');
  }

  const messages = userMessage
    ? [
        { role: 'system', content: systemPromptOrPrompt },
        { role: 'user', content: userMessage }
      ]
    : [
        { role: 'user', content: systemPromptOrPrompt }
      ];

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ask-richter.local',
        'X-Title': 'Ask Richter'
      },
      body: JSON.stringify({
        model: model || 'google/gemma-4-26b-a4b-it:free',
        messages,
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do OpenRouter (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || 'OpenRouter não retornou uma resposta válida.';
  } catch (error) {
    console.error('Erro ao chamar OpenRouter API:', error);
    throw error;
  }
}
