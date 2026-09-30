# Ask Richter — Deep Architecture & Content Lake Design

## 1. Ontological Knowledge Modeling in Sanity

Ask Richter replaces raw textual chunks with an explicit, strongly-typed schema network defined in `apps/studio`:

```text
               ┌───────────────┐
               │    Person     │
               └───────┬───────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
┌────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│Experience │   │   Project   │   │  Education  │
└────┬──────┘   └──────┬──────┘   └─────────────┘
     │                 │
     │   ┌─────────────┤
     │   │             │
┌────▼───▼──┐   ┌──────▼──────┐   ┌─────────────┐
│   Skill   │   │ Achievement │   │   ADR Doc   │
└───────────┘   │ (STAR Impact│   │ (Governance)│
                └─────────────┘   └─────────────┘
```

### The 6 Canonical Schemas (`apps/studio/schemaTypes/`)

1. **`skill`**: Technical competencies with taxonomy (`languages_frameworks`, `cloud_devops`, `databases`, `ai_data_engineering`), proficiency level (`beginner` to `expert`), and keywords.
2. **`experience`**: Professional roles, companies, dates, responsibilities, and bidirectional references to utilized skills and delivered projects.
3. **`project`**: Production applications with architectural summaries, technical challenges, live URLs, repository links, and references to skills and parent experiences.
4. **`education`**: Academic degrees, specializations, institutions, and certifications.
5. **`achievement`**: Quantifiable engineering impact records structured with STAR metrics (Situation, Task, Action, Result).
6. **`architectureDecision`**: Architectural Decision Records (ADRs) with decision status, rationale, consequences, and linked technologies.

**Dataset Snapshot (Captured 2026-09-30):** 101 canonical documents, 121 verified cross-references.

---

## 2. Tri-Retrieval Engine Pipeline (`/api/chat`)

When a user submits a prompt, Ask Richter determines the optimal retrieval strategy through a 4-tier decision cascade:

```text
User Query
    │
    ▼
Intent Decomposer / Router
    │
    ├─► [Tier 1: M2 Structured Intent]
    │      GROQ Declarative Queries ➔ Sanity Content Lake
    │      (LIST_PROJECTS, PROJECT_BY_TECH, SKILLS_MATRIX, etc.)
    │
    ├─► [Tier 2: M4 Agentic Multi-Hop]
    │      AgentPlanner ➔ KnowledgeGraphRetriever (2 Hops / 4 Calls Budget)
    │      (Entity connections, career timelines, STAR impact)
    │
    ├─► [Tier 3: M3 Semantic Search]
    │      Sanity Dataset Embeddings (text::semanticSimilarity)
    │      (Open narrative queries, architectural challenges, ADR synthesis)
    │
    └─► [Tier 4: Resilient Fallback]
           Pure TypeScript TSVectorStore in-memory
           (Offline resilience & graceful degradation)
```

---

## 3. Safe Grounding & Prompt Injection Protection

1. **Deterministic Execution Budgets**:
   - `MAX_TOOL_HOPS = 2`
   - `MAX_TOOL_CALLS = 4`
   - `GLOBAL_TIMEOUT_MS = 4000`
   - Token budget ceiling: `CONTEXT_BUDGET_TOKENS = 2800`
2. **Query Sanitization**: Strips prompt injection tokens (`IGNORE ALL PREVIOUS INSTRUCTIONS`, etc.) and command sequences before planning.
3. **Strict System Prompt**: Constrains the LLM to output only what is present in the formatted context block (`[EVIDÊNCIA ESTRUTURADA - SANITY KNOWLEDGE GRAPH]`), automatically invoking safe abstention on missing data.
