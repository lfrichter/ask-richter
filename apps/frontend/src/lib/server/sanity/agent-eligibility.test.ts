import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isAgenticMultiHopQuery } from './agent-eligibility'

describe('M4 — Agent Eligibility Module', () => {
  it('Deve priorizar M2 se hasStructuredMatch for verdadeiro', () => {
    assert.strictEqual(isAgenticMultiHopQuery('Quais projetos o Richter fez?', true), false)
    assert.strictEqual(isAgenticMultiHopQuery('O que diz a ADR-0007?', true), false)
  })

  it('Deve reconhecer padrões estruturais de ADR e Decisões de Arquitetura em PT e EN', () => {
    assert.strictEqual(isAgenticMultiHopQuery('O que diz a ADR-0007 sobre o FAISS?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Qual foi a decisão de arquitetura tomada na ADR 7?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Por que a arquitetura optou por substituir o faiss-node?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Why did the architecture eliminate FAISS in favor of TSVectorStore?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Quais foram os trade-offs arquiteturais da migração?'), true)
  })

  it('Deve reconhecer padrões de Causalidade e Relacionamento Multi-Entidade', () => {
    assert.strictEqual(isAgenticMultiHopQuery('Como a liderança técnica influenciou a retenção de clientes?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Qual a relação entre o projeto Mid-Stay e o aumento de faturamento?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Quais tecnologias conectam o projeto Ask Richter às experiências profissionais do Richter?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('How did the migration impact the system performance?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('What is the connection between his role at Turno and the CI/CD pipeline?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Which technologies connect the Ask Richter project to his professional career?'), true)
  })

  it('Deve reconhecer padrões de Impacto e Métricas em Contexto', () => {
    assert.strictEqual(isAgenticMultiHopQuery('Quais métricas de performance foram alcançadas na empresa?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('Quais resultados mensuráveis foram entregues durante a experiência?'), true)
    assert.strictEqual(isAgenticMultiHopQuery('What measurable achievements did he deliver during his leadership?'), true)
  })

  it('Não deve interceptar consultas conceituais simples (devem seguir para M3)', () => {
    assert.strictEqual(isAgenticMultiHopQuery('Como ele lida com incidentes críticos em produção?'), false)
    assert.strictEqual(isAgenticMultiHopQuery('Qual a experiência dele com Docker e Kubernetes?'), false)
    assert.strictEqual(isAgenticMultiHopQuery('What is his background in software architecture?'), false)
    assert.strictEqual(isAgenticMultiHopQuery('O que é Clean Architecture?'), false)
  })

  it('Não deve interceptar queries vazias', () => {
    assert.strictEqual(isAgenticMultiHopQuery(''), false)
    assert.strictEqual(isAgenticMultiHopQuery('   '), false)
  })
})
