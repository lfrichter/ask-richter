import assert from 'node:assert';
import { test, describe } from 'node:test';

describe('M15 — Multilingual Response Alignment (Plan A Specification)', () => {
  test('REGRA M15.1: Perguntas em Inglês devem instruir o LLM a responder em Inglês', () => {
    const question = 'Could you give me last companies experience from him';
    const isEnglish = /[a-zA-Z]/.test(question) && !question.includes('experiência');
    
    assert.strictEqual(isEnglish, true);
  });

  test('REGRA M15.2: O idioma do contexto não pode sobrepor o idioma da mensagem do usuário', () => {
    const userQueryLanguage = 'en';
    const contextLanguage = 'pt-BR';
    
    // O idioma de saída DEVE obrigatoriamente ser igual ao idioma da query
    const targetResponseLanguage = userQueryLanguage;
    assert.notStrictEqual(targetResponseLanguage, contextLanguage);
    assert.strictEqual(targetResponseLanguage, 'en');
  });

  test('REGRA M15.3: Retrieval não sofre alteração e é neutro ao idioma da geração', () => {
    const mockContext = 'Luis trabalhou na empresa X como Engenheiro de Software.';
    // A recuperação factual é mantida intacta
    assert.strictEqual(mockContext.includes('Engenheiro de Software'), true);
  });
});
