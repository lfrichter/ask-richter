# Ask Richter — Official 6-Query Demonstration Script

This document details the exact sequence of 6 demonstration queries evaluated against the live system. Each query proves a distinct architectural capability of the Sanity Content Lake and Tri-Retrieval Engine.

---

## 🎬 The 6-Question Demonstration Flow

```text
1. Multilingual Structured   ➔ "Which projects use React?"
2. Cardinality & Pagination  ➔ "Which projects use Laravel?"
3. Structured Catalog        ➔ "Which projects did Richter develop?"
4. Distributed Semantic      ➔ "What were the architectural challenges in building Ask Richter's RAG architecture?"
5. Agentic Graph Traversal   ➔ "Which technologies connect the Ask Richter project to Richter's professional experiences?"
6. Grounded Abstention       ➔ "What was Richter's experience developing production systems in Rust?"
```

---

### Query 1: Multilingual Structured Intent (`M2_STRUCTURED / PROJECT_BY_TECH`)

- **Prompt**: `"Which projects use React?"`
- **Engine Executed**: `M2_STRUCTURED` (Intent: `PROJECT_BY_TECH`)
- **What it Proves**:
  - Declarative filtering by technology.
  - Symmetrical English language detection and response alignment.
  - Returns exactly the **4 matching projects** (`Web3 React dApp`, `Cat Guardian`, `Canaoaves`, `Toot`).
- **Reviewer Note**: Demonstrates deterministic entity recall without vector threshold drift.

---

### Query 2: Cardinality & Cognitive Load Management (`M2_STRUCTURED / PROJECT_BY_TECH`)

- **Prompt**: `"Which projects use Laravel?"`
- **Engine Executed**: `M2_STRUCTURED` (Intent: `PROJECT_BY_TECH`)
- **What it Proves**:
  - The Sanity Content Lake retrieves all **8 Laravel projects**.
  - Applies the strict **7-item cognitive load rule**: presents the 7 most relevant projects with clean summaries and explicitly states that additional projects exist, inviting the user to explore further.
- **Reviewer Note**: Prevents cognitive overload while maintaining 100% factual accuracy regarding total matching records.

---

### Query 3: Structured Catalog Listing (`M2_STRUCTURED / LIST_PROJECTS`)

- **Prompt**: `"Which projects did Richter develop?"`
- **Engine Executed**: `M2_STRUCTURED` (Intent: `LIST_PROJECTS`)
- **What it Proves**:
  - Full catalog intent detection across the 18 production projects in Sanity.
  - Paginates the output gracefully (7 items displayed + total count context).
- **Reviewer Note**: Differentiates general catalog requests from narrow technology filters.

---

### Query 4: Distributed Architectural Knowledge (`M3_SEMANTIC`)

- **Prompt**: `"What were the architectural challenges in building Ask Richter's RAG architecture?"`
- **Engine Executed**: `M3_SEMANTIC` (Sanity Dataset Embeddings via `text::semanticSimilarity`)
- **What it Proves**:
  - Semantic retrieval across unstructured/narrative text in Architectural Decision Records (`ADR-0007`).
  - Retrieves complex engineering context: elimination of native C++ FAISS dependencies, Vercel Serverless runtime constraints, sub-50ms cold starts, and the `TSVectorStore` design.
- **Reviewer Note**: Shows how Sanity Dataset Embeddings excel at synthesizing multi-document architectural knowledge.

---

### Query 5: Agentic Knowledge Graph Traversal & Grounded Safety (`M4_AGENTIC`)

- **Prompt**: `"Which technologies connect the Ask Richter project to Richter's professional experiences?"`
- **Engine Executed**: `M4_AGENTIC` (`AgentPlanner` + `KnowledgeGraphRetriever`)
- **What it Proves**:
  - Agentic planning: identifies `Ask Richter` as the root entity and navigates to its associated skills (`TypeScript`, `Next.js`, `RAG`).
  - **Grounded Safety**: Because `Ask Richter` is an independent AI Engineering project not tied to an employer in the graph, the agent safely states the technologies present in the project and abstains from fabricating career connections that lack explicit graph nodes.
- **Reviewer Note**: *"This demonstrates agentic graph traversal and grounded abstention when the required relationship is not available within the traversal budget."*

---

### Query 6: Zero-Trust Factual Grounding & Safe Abstention

- **Prompt**: `"What was Richter's experience developing production systems in Rust?"`
- **Engine Executed**: `M3_SEMANTIC` ➔ Factual Grounding Guardrail
- **What it Proves**:
  - No matching Rust production experience exists in the dataset.
  - The model issues an explicit, polite abstention: *"Based on the information retrieved, I do not have the details to answer this question."*
- **Reviewer Note**: Proof of Zero-Trust governance — the agent never hallucinates skills, companies, or projects.
