export interface LLMProvider {
  readonly name: string;
  generate(systemPrompt: string, userMessage: string): Promise<string>;
}
