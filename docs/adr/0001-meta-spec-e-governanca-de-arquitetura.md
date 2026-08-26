# ADR-0001: Definição da Meta Spec, Isolamento WSCI e Protocolo Jidoka

- **Status:** Aprovado  
- **Data:** 2026-08-05  
- **Autor:** Antigravity (Chief of Staff / Agente Orquestrador)  
- **Escopo:** Todo o Monorepo AskRichter

---

## 1. Contexto e Problema

O projeto **AskRichter** evoluiu para um monorepo Turborepo contendo múltiplos serviços (Backend Node.js/Express/LangChain/FAISS e Frontend Next.js 15) implantados em diferentes plataformas de nuvem (Render, Vercel, Supabase).

Sem uma constituição técnica unificada e diretrizes claras de governança, o desenvolvimento orientado por agentes de IA corre o risco de:
- Alucinações sobre a stack tecnológica ou inclusão de ferramentas incompatíveis.
- Poluição de contexto (ler arquivos do frontend ao resolver bugs do backend).
- Inserção de regressões sem validação contínua (falta de controle Zero-Trust).
- Falta de histórico legível sobre decisões de design e infraestrutura.

---

## 2. Decisão

Decidimos instituir o **Framework de Engenharia de Software Guiado por IA v2.0 Master**, estabelecendo três pilares primários de governança:

1. **Adoção da META SPEC como Lei Constitucional (`.askrichter-spec.md`):**
   - O documento [`.askrichter-spec.md`](../../.askrichter-spec.md) passa a ser a referência absoluta e imutável sobre a arquitetura do projeto, stack tecnológica, fluxo RAG e regras de infraestrutura.

2. **Engenharia de Contexto WSCI (World-Scope Context Isolation):**
   - As tarefas devem ser estritamente classificadas em escopos (Frontend, Backend ou Infraestrutura).
   - O agente orquestrador solicitará e lerá apenas os arquivos estritamente necessários para o escopo delimitado, evitando dispersão de contexto.

3. **Governança por ADRs Individuais e Índice `docs/architect.md`:**
   - Nenhuma decisão arquitetural deve ser registrada em logs monolíticos.
   - Cada decisão gerará um novo arquivo numerado no diretório [`docs/adr/`](./).
   - O arquivo [`docs/architect.md`](../architect.md) será mantido como mapa mental de alto nível e índice das ADRs.

4. **Protocolo Jidoka (Andon Cord & Zero-Trust):**
   - Estabelecida a política de que nenhum código é válido até passar nos checkpoints automatizados de lint (`npm run lint`), checagem de tipos (`npm run check-types`) e build limpo do Turborepo (`npm run build`).
   - Qualquer erro interrompe o ciclo de desenvolvimento para realização de um Reset Limpo e correção na raiz.

---

## 3. Consequências

### Positivas:
- **Prevenção de Alucinações:** O agente sempre se baseará na Meta Spec para validar premissas e decisões.
- **Desenvolvimento Mais Rápido e Focado:** O isolamento de contexto reduz drasticamente o consumo de tokens e reduz erros.
- **Rastreabilidade Histórica:** O diretório `docs/adr/` preserva a motivação de cada evolução arquitetural.
- **Alta Estabilidade:** A esteira Jidoka garante que a branch principal nunca receba código com erros de build ou lint.

### Mitigações / Trade-offs:
- Exige disciplina para registrar ADRs em qualquer mudança de escopo.
- Requer execução sistemática de scripts de teste e build antes de concluir tarefas.
