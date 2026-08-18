# ADR 0006: Resiliência de LLM com Retentativa Bounded e Cadeia de Fallback Abstrata

## Status
Aceito (Accepted) - 18 de agosto de 2026

## Contexto
Durante a operação com a API do Google Gemini, o modelo de LLM em produção (`gemini-3.6-flash`) pode apresentar instabilidades temporárias como erros `503 UNAVAILABLE` ("This model is currently experiencing high demand") ou `429 Too Many Requests`. Anteriormente, estas falhas do provedor resultavam em respostas `HTTP 500 Internal Server Error` diretas para a aplicação frontend.

Além disso, a arquitetura exigia que o sistema fosse capaz de tentar automaticamente provedores de contingência (OpenRouter, Hugging Face ou Ollama local) sem violar o isolamento de camadas e sem falhar a inicialização caso algum provedor secundário não possuísse credenciais configuradas.

## Decisões Tomadas

### 1. Política de Retentativa Bounded no Gemini (`GeminiLLMProvider`)
- Implementamos retentativa com backoff exponencial no `GeminiLLMProvider` para erros transitórios (`429`, `502`, `503`, `504` e falhas de rede).
- **Tentativas máximas**: 3 tentativas (delays: 2s, 4s, 8s ou conforme `RetryInfo`).
- **Erros não-transitórios**: Erros `400`, `401` e `403` não são retentados e falham imediatamente.
- **Log sem dados sensíveis**: O log exibe mensagens limpas de tentativa (`[AI] Gemini attempt 1/3 failed with 503. Retrying in 2000ms...`) sem expor prompt ou chaves de API.

### 2. Cadeia de Fallback Abstrata (`ResilientLLMProvider`)
- Criamos a classe `ResilientLLMProvider` que implementa a interface `LLMProvider` e orquestra a cadeia de fallback sem modificar a rota REST (`index.ts`).
- A ordem de tentativa respeita:
  1. Provedor primário (`AI_PROVIDER`, ex: `gemini`).
  2. Provedores de fallback em ordem de prioridade (`AI_FALLBACK_PROVIDERS="openrouter,huggingface,ollama"`).
- **Instanciação Preguiçosa (Lazy Evaluation)**: A validação de credenciais de um provedor de fallback só ocorre no momento em que ele é efetivamente acionado, evitando falhas de inicialização do backend em ambientes sem chaves secundárias.

### 3. Semântica de Resposta HTTP (`503 Service Unavailable`)
- Quando todos os provedores da cadeia de fallback falham por erro de upstream, o backend responde com `HTTP 503 Service Unavailable` e estrutura de erro legível (`{ "error": "AI service temporarily unavailable. Please try again.", "code": "SERVICE_UNAVAILABLE" }`), evitando indicar falsamente um erro interno de aplicação (`HTTP 500`).

## Consequências

### Positivas
- **Alta Disponibilidade**: A aplicação continua operando sem interrupções visíveis para o usuário mesmo durante picos de demanda da API do Gemini.
- **Zero Ruído no Startup**: Ambientes de produção não exigem chaves de todos os provedores secundários para iniciar.
- **Respeito Estrito à Arquitetura**: A orquestração permanece 100% dentro da camada de abstração de provedores (`UI -> API -> LLMProvider`).

### Cuidados
- Monitoramento de cotas de APIs de fallback (OpenRouter e Hugging Face) para evitar custos inesperados em cenários de indisponibilidade prolongada do Gemini.
