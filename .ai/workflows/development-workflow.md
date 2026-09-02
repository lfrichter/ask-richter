# 🤖 AI Engineering Framework — Development Workflow Protocol

Este documento define o **protocolo operacional padrão** que qualquer Agente de IA deve seguir automaticamente ao receber uma demanda de desenvolvimento neste repositório.

---

## 🏛️ 1. Governança E Regras Constitucionais

Antes de qualquer ação, o agente deve respeitar a precedência definida em `AGENTS.md`:
1. Restrições de segurança do sistema
2. AI Engineering Framework v2.1
3. `META_SPEC.md` (Especificação Canônica do Projeto)
4. ADRs aprovadas (`docs/adr/`)
5. Contexto e comandos do projeto (`.ai/setup/project-context.md`)
6. Código existente

---

## 🧭 2. Fluxo Em Duas Fases Com Gate Humano

O ciclo de desenvolvimento divide-se estritamente em **duas fases**, separadas por uma **única revisão humana**:

```text
[PROMPT ÚNICO DO USUÁRIO COM A DEMANDA]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ FASE 1: PREPARAÇÃO & PLANEJAMENTO (Plan Mode)          │
│ 1. Especificação da TASK (docs/tasks/TASK-NNN.md)      │
│ 2. Avaliação de ADR (docs/adr/ - se necessária)        │
│ 3. Elaboração do PLAN (docs/Plans/Plan-DATE--NNN.md)   │
│    (com espelho ativo em .ai/memory/current_plan.md)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          🛑 GATE OBRIGATÓRIO DE REVISÃO HUMANA
          O agente para e aguarda aprovação do desenvolvedor
                           │
             [APROVAÇÃO: "Pode executar"]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ FASE 2: CONSTRUÇÃO & VALIDAÇÃO (Execution Mode)        │
│ 4. Execução Cirúrgica Passo a Passo (Jidoka)           │
│ 5. Verificação & Quality Gates (Testes, Lint, Build)   │
│ 6. Completion & Clean Reset (DoD e limpeza de memória) │
└────────────────────────────────────────────────────────┘
```

---

## 📋 FASE 1: Preparação & Planejamento (Plan Mode Estrito)

Quando o usuário apresentar uma nova demanda, o agente deve operar em **Plan Mode** (nenhum código-fonte ou infraestrutura pode ser modificado) e executar sequencialmente:

### Etapa 1.1: Especificação Da Demanda (`TASK`)
1. Avaliar a demanda contra a `META_SPEC.md` para garantir que está dentro da visão do projeto.
2. Identificar o próximo ID sequencial de tarefa (ex: `TASK-001`, `TASK-002`, etc. verificando a pasta `docs/tasks/`).
3. Criar a especificação em `docs/tasks/TASK-{{TASK_ID}}.md` utilizando o template `.ai/workflows/TASK.template.md`:
   - Objetivo de Negócio / Problema a ser resolvido
   - Limites de Escopo estritos: **In Scope** e **Out of Scope**
   - Critérios de Aceitação mensuráveis e verificáveis (Checklist)
   - Áreas impactadas e riscos identificados

### Etapa 1.2: Avaliação Arquitetural (`ADR` — Condicional)
1. Analisar se a tarefa envolve decisão técnica com impacto estrutural:
   - Introdução de nova dependência/biblioteca externa relevante
   - Novo banco de dados, storage ou serviço externo
   - Mudança de paradigma de arquitetura ou padrão de comunicação
   - Quebra de contrato de API pública ou alteração de schema crítico
2. **Se HOUVER impacto:**
   - Elaborar proposta em `docs/adr/NNNN-[titulo-da-decisao].md` (Status: `Proposed`) a partir de `docs/adr/0000-template.md`.
   - Listar opções consideradas, trade-offs e a recomendação técnica.
3. **Se NÃO HOUVER impacto:**
   - Registrar no plano que a tarefa segue os padrões já aprovados em ADRs existentes.

### Etapa 1.3: Elaboração Do Plano De Implementação (`PLAN`)
1. Inspecionar o código real nos arquivos afetados (**Evidence Before Assumption**).
2. Determinar a data atual (`YYYY-MM-DD`) e o próximo sequencial numérico diário de 3 dígitos (ex: `001`, `002`), compondo o nome oficial:
   `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md` (exemplo: `docs/Plans/Plan-2026-09-02--001.md`).
3. **Persistir o plano oficial** em `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md` utilizando o template `.ai/workflows/PLAN.template.md`:
   - Vincular a `TASK` e `ADR` correspondentes.
   - Decompor a implementação em passos atômicos e cirúrgicos (Step 1, Step 2...).
   - Definir para **cada passo**:
     • Arquivos que serão criados ou editados.
     • O que exatamente será alterado.
     • Comando de verificação imediato pós-passo.
   - Definir a estratégia de testes (unitários, integração e regressão).
   - Registrar incógnitas (Unknowns) e riscos com mitigações.
4. **Espelhar em memória ativa:** Criar uma cópia idêntica em `.ai/memory/current_plan.md`. Esse arquivo funciona exclusivamente como ponteiro da memória de trabalho ativa para que, caso ocorra um desligamento inesperado ou reinício de sessão do agente, seja possível retomar exatamente de onde parou.

### 🛑 Etapa 1.4: STOP No Gate Humano (Parada Obrigatória)
O agente **DEVE PARAR** a execução e apresentar ao desenvolvedor:
- Resumo da TASK criada (`docs/tasks/TASK-{{TASK_ID}}.md`).
- Se uma ADR foi proposta (`docs/adr/NNNN-*.md`) ou se nenhuma foi necessária.
- O Plano de Implementação persistido em `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md` (espelhado em `.ai/memory/current_plan.md`).
- **Pedido explícito:** *"Revise a TASK, a ADR e o PLAN. Aguardo sua autorização para iniciar a execução em Execution Mode."*

---

## 🔨 FASE 2: Construção, Verificação & Fechamento (Execution Mode)

Após receber autorização humana explícita (ex: *"Aprovado"*, *"Pode executar"*), o agente entra em **Execution Mode**:

### Etapa 2.1: Execução Cirúrgica & Protocolo Jidoka
1. Seguir estritamente os passos previstos no plano ativo.
2. Manter o progresso atualizado tanto em `.ai/memory/current_plan.md` quanto no arquivo histórico `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md`.
3. **Surgical Changes:** Modificar somente os arquivos e linhas necessários. Não tocar em estilo alheio, não refatorar código não relacionado e não criar abstrações prematuras (*Simplicity First*).
4. **Protocolo Jidoka (Andon Cord):** Se qualquer passo falhar inesperadamente, um teste quebrar ou for necessária uma decisão fora do plano:
   - **PARE IMEDIATAMENTE.**
   - Não acumule patches sobre falhas.
   - Reporte o problema ao desenvolvedor com evidência e aguarde instrução.

### Etapa 2.2: Verificação & Quality Gates
1. Executar os comandos oficiais do projeto registrados em `.ai/setup/project-context.md`:
   - Suite de testes (Unitários e de Integração)
   - Typecheck (se aplicável)
   - Linter e Formatação
   - Build de produção
2. Inspecionar o `git diff` completo para garantir ausência de vazamento de segredos, arquivos de log temporários ou código residual.
3. Preencher a seção de Evidências em `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md` e `.ai/memory/current_plan.md`.

### Etapa 2.3: Completion & Clean Reset Protocol
1. Validar a **Definition of Done (DoD)**:
   - [ ] Requisitos e critérios de aceitação da TASK satisfeitos
   - [ ] Testes passando com 100% de sucesso
   - [ ] Build e checagens estáticas aprovadas
   - [ ] Diff cirúrgico e revisado
2. **Sincronização:** Se a alteração impactar documentação pública ou arquitetura, atualizar `docs/` e `docs/pt-br/`.
3. **Status Permanente:** Marcar o status como `Completed` no plano persistido em `docs/Plans/Plan-2026-09-02--{{PLAN_ID}}.md`.
4. **Clean Reset da Memória:** Limpar o arquivo de memória de trabalho `.ai/memory/current_plan.md` (ou registrar status `Completed / Idle`), deixando a pasta `.ai/memory/` desimpedida para o próximo ciclo e prevenindo *Context Poisoning*.
5. Sugerir a mensagem de commit final (no padrão Conventional Commits).
