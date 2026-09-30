/**
 * Módulo de Elegibilidade Semântica para Roteamento Agêntico Multi-Hop (M4)
 * Analisa a estrutura sintático-semântica da consulta sem acoplamento a listas exaustivas de entidades.
 */

// Padrões estruturais para Decisões Arquiteturais e ADRs
const ADR_PATTERNS = [
  /adr[- ]?\d+/i,
  /decis[aã]o (?:de )?arquitetur(?:a|al)/i,
  /motiva[çc][aã]o (?:da|de|para) decis[aã]o/i,
  /trade-?offs?(?: arquiteturais)?/i,
  /racional (?:arquitetural|técnico|da decisão)/i,
  /por que (?:a arquitetura|o sistema| Richter) (?:optou|escolheu|substituiu|abandonou|eliminou)/i,
  /why did (?:he|richter|the architecture) (?:eliminate|replace|choose|switch)/i,
  /architectural decision/i,
]

// Padrões estruturais de Causalidade e Relacionamento Multi-Entidade
const MULTI_HOP_PATTERNS = [
  /como (?:o|a|os|as) .+ (?:influenciou|impactou|resultou em|gerou)/i,
  /qual (?:a|o) rela[çc][aã]o entre .+ e .+/i,
  /como .+ se relaciona(?:m)? com .+/i,
  /quais .+ (?:conectam|ligam|relacionam) .+ (?:a|ao|à|às|com|e) .+/i,
  /how did .+ (?:influence|impact|result in|affect) .+/i,
  /what is the (?:relationship|connection|link) between .+ and .+/i,
  /(?:which|what) (?:technologies|tools|skills|concepts)?\s*(?:connect|link|relate) .+ to .+/i,
]

// Padrões estruturais para Conquistas / Métricas ligadas a Contexto Operacional
const IMPACT_METRIC_PATTERNS = [
  /(?:m[eé]tricas?|impactos?|resultados?(?: mensur[aá]veis)?|conquistas?).*(?:em|no|na|nos|nas|durante|ao longo|pelo|pela)/i,
  /(?:desafios?|problemas?).*(?:solu[çc][oõ]es|resultados?).*(?:em|no|na|durante)/i,
  /(?:measur(?:able|ed)|metrics?|impacts?|achievements?).*(?:at|in|during|throughout)/i,
  /(?:challenges?|problems?).*(?:solutions?|outcomes?).*(?:at|in|during)/i,
]

/**
 * Avalia se uma pergunta do usuário requer navegação relacional no Knowledge Graph (M4).
 *
 * @param query Pergunta textual enviada pelo usuário
 * @param hasStructuredMatch Flag indicando se a pergunta já casou com uma intenção declarativa M2
 * @returns boolean indicando se a pergunta é elegível para M4
 */
export function isAgenticMultiHopQuery(query: string, hasStructuredMatch = false): boolean {
  if (hasStructuredMatch) {
    // M2 possui precedência absoluta para intenções estruturadas declarativas
    return false
  }

  if (!query || !query.trim()) {
    return false
  }

  const clean = query.trim()

  // 1. Padrões de Decisão Arquitetural / ADR
  for (const pattern of ADR_PATTERNS) {
    if (pattern.test(clean)) {
      return true
    }
  }

  // 2. Padrões de Causalidade e Cruzamento Multi-Entidade
  for (const pattern of MULTI_HOP_PATTERNS) {
    if (pattern.test(clean)) {
      return true
    }
  }

  // 3. Padrões de Métricas / Conquistas em Contexto
  for (const pattern of IMPACT_METRIC_PATTERNS) {
    if (pattern.test(clean)) {
      return true
    }
  }

  return false
}
